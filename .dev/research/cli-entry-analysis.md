# CLI Entry Point Analysis

## Files Analyzed

- `/home/user/gsd-2/src/loader.ts` — Process-level bootstrap (env vars, workspace linking)
- `/home/user/gsd-2/src/cli.ts` — Main CLI logic (session creation, mode dispatch)
- `/home/user/gsd-2/src/resource-loader.ts` — Resource syncing and `DefaultResourceLoader` construction
- `/home/user/gsd-2/src/extension-registry.ts` — Extension enable/disable registry
- `/home/user/gsd-2/src/extension-discovery.ts` — Extension entry-point discovery
- `/home/user/gsd-2/src/models-resolver.ts` — models.json path resolution
- `/home/user/gsd-2/src/app-paths.ts` — Canonical paths (`~/.gsd/agent/`, etc.)
- `/home/user/gsd-2/src/bundled-extension-paths.ts` — Serialize/parse extension paths via env var

---

## 1. Full Startup Flow

### Phase 1: `loader.ts` (process bootstrap)

1. **Fast-path exits** — `--version` and `--help` handled before any heavy imports.
2. **Set critical env vars** before `cli.ts` is imported:
   ```ts
   process.env.PI_PACKAGE_DIR = pkgDir        // tells pi SDK config.js to use gsd branding
   process.env.PI_SKIP_VERSION_CHECK = '1'     // gsd runs its own update check
   process.env.GSD_CODING_AGENT_DIR = agentDir // overrides pi's getAgentDir()
   process.env.GSD_VERSION = gsdVersion
   process.env.GSD_BIN_PATH = process.argv[1]  // used by subagent spawning
   process.env.GSD_WORKFLOW_PATH = join(resourcesDir, 'GSD-WORKFLOW.md')
   ```
3. **NODE_PATH injection** — Prepends gsd's `node_modules/` so extensions loaded via jiti can resolve dependencies:
   ```ts
   const gsdNodeModules = join(gsdRoot, 'node_modules')
   process.env.NODE_PATH = [gsdNodeModules, process.env.NODE_PATH].filter(Boolean).join(delimiter)
   const { Module } = await import('module');
   (Module as any)._initPaths?.()
   ```
4. **Extension discovery + registry filtering** — Scans bundled extensions dir, remaps paths to `~/.gsd/agent/extensions/`, filters by registry:
   ```ts
   const registry = loadRegistry()
   const discoveredExtensionPaths = discoverExtensionEntryPaths(bundledExtDir)
     .map((entryPath) => join(agentExtDir, relative(bundledExtDir, entryPath)))
     .filter((entryPath) => {
       const manifest = readManifestFromEntryPath(entryPath)
       if (!manifest) return true  // no manifest = always load
       return isExtensionEnabled(registry, manifest.id)
     })
   process.env.GSD_BUNDLED_EXTENSION_PATHS = serializeBundledExtensionPaths(discoveredExtensionPaths)
   ```
5. **Proxy support** — Lazy-loads `undici` only when `HTTP_PROXY`/`HTTPS_PROXY` are set.
6. **Workspace package linking** — Ensures `@gsd/*` packages are symlinked (or copied on Windows) from `packages/` into `node_modules/@gsd/`:
   ```ts
   const wsPackages = ['native', 'pi-agent-core', 'pi-ai', 'pi-coding-agent', 'pi-tui']
   ```
7. **Dynamic import of cli.ts** — `await import('./cli.js')` — deferred so all env vars are set first.

### Phase 2: `cli.ts` (main logic)

1. **Parse CLI args** — `parseCliArgs()` produces a `CliFlags` struct.
2. **Resource skew check** — `exitIfManagedResourcesAreNewer(agentDir)` aborts if synced resources are from a newer gsd version.
3. **TTY gate** — Non-TTY without `--print`/`--mode`/subcommand exits with usage help.
4. **Subcommand dispatch** — `config`, `update`, `sessions`, `headless`, `worktree` each exit early.
5. **Tool bootstrap** — `ensureManagedTools(join(agentDir, 'bin'))` provisions `fd`/`rg` binaries.
6. **Auth + credentials** — `AuthStorage.create()`, `loadStoredEnvKeys()`, `migratePiCredentials()`.
7. **Model registry** — `resolveModelsJsonPath()` then `new ModelRegistry(authStorage, modelsJsonPath)`.
8. **Settings** — `SettingsManager.create(agentDir)`.
9. **Onboarding** — Runs wizard if no provider configured.
10. **Model validation** — Ensures configured model exists; picks fallback if not.
11. **Resource init + loader** — `initResources(agentDir)` syncs bundled resources, then `buildResourceLoader(agentDir)`.
12. **Session creation** — `createAgentSession({ authStorage, modelRegistry, settingsManager, sessionManager, resourceLoader })`.
13. **Scoped models restoration** — Reads `settingsManager.getEnabledModels()` and applies to session.
14. **InteractiveMode** — `new InteractiveMode(session)` then `await interactiveMode.run()`.

---

## 2. Pi SDK Imports and Usage

All Pi SDK imports come from `@gsd/pi-coding-agent` (line 1 of cli.ts):

```ts
import {
  AuthStorage,
  DefaultResourceLoader,
  ModelRegistry,
  SettingsManager,
  SessionManager,
  createAgentSession,
  InteractiveMode,
  runPrintMode,
  runRpcMode,
} from '@gsd/pi-coding-agent'
```

### Usage of each import:

| Import | How Used |
|---|---|
| `AuthStorage` | `AuthStorage.create(authFilePath)` — creates auth store from `~/.gsd/agent/auth.json` |
| `DefaultResourceLoader` | Wraps `agentDir` + optional `additionalExtensionPaths` + `appendSystemPrompt`; `.reload()` loads resources |
| `ModelRegistry` | `new ModelRegistry(authStorage, modelsJsonPath)` — `.getAvailable()`, `.getAll()` for model queries |
| `SettingsManager` | `SettingsManager.create(agentDir)` — `.getDefaultProvider()`, `.getDefaultModel()`, `.setDefaultModelAndProvider()`, `.getEnabledModels()`, etc. |
| `SessionManager` | `.create(cwd, dir)`, `.inMemory()`, `.continueRecent(cwd, dir)`, `.open(path, dir)`, `.list(cwd, dir)` |
| `createAgentSession` | Core session factory — takes `{ authStorage, modelRegistry, settingsManager, sessionManager, resourceLoader }`, returns `{ session, extensionsResult }` |
| `InteractiveMode` | `new InteractiveMode(session)` then `await interactiveMode.run()` — the TUI |
| `runPrintMode` | Single-shot execution: `await runPrintMode(session, { mode, messages })` |
| `runRpcMode` | JSON-RPC server: `await runRpcMode(session)` |

---

## 3. Session Creation

### SessionManager instantiation (three modes):

```ts
// Resume a specific session picked from `gsd sessions`
const sessionManager = cliFlags._selectedSessionPath
  ? SessionManager.open(cliFlags._selectedSessionPath, projectSessionsDir)
  // Resume most recent session (--continue / -c)
  : cliFlags.continue
    ? SessionManager.continueRecent(cwd, projectSessionsDir)
    // New session (default)
    : SessionManager.create(cwd, projectSessionsDir)
```

Session directory is per-cwd:
```ts
const safePath = `--${cwd.replace(/^[/\\]/, '').replace(/[/\\:]/g, '-')}--`
const projectSessionsDir = join(sessionsDir, safePath)
```

### createAgentSession call:

```ts
const { session, extensionsResult } = await createAgentSession({
  authStorage,
  modelRegistry,
  settingsManager,
  sessionManager,
  resourceLoader,
})
```

The returned `extensionsResult.errors` are logged to stderr but do not block startup.

### Print mode session creation differs:

```ts
const sessionManager = cliFlags.noSession
  ? SessionManager.inMemory()
  : SessionManager.create(process.cwd())
// Note: no projectSessionsDir passed — flat session storage
```

---

## 4. InteractiveMode Initialization

```ts
const interactiveMode = new InteractiveMode(session)
await interactiveMode.run()
```

Before `run()`, scoped models are restored from settings:

```ts
const enabledModelPatterns = settingsManager.getEnabledModels()
// ... resolve patterns to model objects ...
if (scopedModels.length > 0 && scopedModels.length < availableModels.length) {
  session.setScopedModels(scopedModels)
}
```

Pattern format is `"provider/modelId"` strings saved by `/scoped-models` command. Fallback matches by model id alone.

---

## 5. Extension Loading

### Discovery (`extension-discovery.ts`)

`discoverExtensionEntryPaths(extensionsDir)` scans a directory:

- **Top-level `.ts`/`.js` files** are standalone extension entry points.
- **Subdirectories** are resolved via `resolveExtensionEntries()`:
  1. If `package.json` has `pi.extensions` array, resolve each entry.
  2. Fallback: `index.ts` then `index.js`.

```ts
export function discoverExtensionEntryPaths(extensionsDir: string): string[] {
  const discovered: string[] = []
  for (const entry of readdirSync(extensionsDir, { withFileTypes: true })) {
    const entryPath = join(extensionsDir, entry.name)
    if ((entry.isFile() || entry.isSymbolicLink()) && isExtensionFile(entry.name)) {
      discovered.push(entryPath)
      continue
    }
    if (entry.isDirectory() || entry.isSymbolicLink()) {
      discovered.push(...resolveExtensionEntries(entryPath))
    }
  }
  return discovered
}
```

### Registry (`extension-registry.ts`)

- Stored at `~/.gsd/extensions/registry.json`.
- Schema: `{ version: 1, entries: Record<string, { id, enabled, source, disabledAt?, disabledReason? }> }`.
- **Missing entries default to enabled** — `isExtensionEnabled()` returns `true` if entry not found.
- Core-tier extensions cannot be disabled (`disableExtension()` returns error string).

### Two-stage filtering

**Stage 1 (loader.ts)** — Filters bundled extensions before cli.ts imports. Sets `GSD_BUNDLED_EXTENSION_PATHS` env var. This is what the Pi SDK's `DefaultResourceLoader` reads to know which bundled extensions to load.

**Stage 2 (resource-loader.ts `buildResourceLoader()`)** — For interactive mode, also discovers extensions from `~/.pi/agent/extensions/` (Pi's location), excludes duplicates of bundled extensions, filters by registry:

```ts
export function buildResourceLoader(agentDir: string): DefaultResourceLoader {
  const registry = loadRegistry()
  const piExtensionPaths = discoverExtensionEntryPaths(piExtensionsDir)
    .filter((entryPath) => !bundledKeys.has(getExtensionKey(entryPath, piExtensionsDir)))
    .filter((entryPath) => {
      const manifest = readManifestFromEntryPath(entryPath)
      if (!manifest) return true
      return isExtensionEnabled(registry, manifest.id)
    })

  return new DefaultResourceLoader({
    agentDir,
    additionalExtensionPaths: piExtensionPaths,
  })
}
```

### Resource syncing (`initResources()`)

Before loading, bundled resources are synced from `dist/resources/` (or `src/resources/`) to `~/.gsd/agent/`:

- `extensions/` -> `~/.gsd/agent/extensions/`
- `agents/` -> `~/.gsd/agent/agents/`
- `skills/` -> `~/.gsd/agent/skills/`

Skipped when both version AND content fingerprint match (avoids ~128ms cpSync).

---

## 6. Model Resolution

### models.json path (`models-resolver.ts`)

Simple fallback chain:

```ts
export function resolveModelsJsonPath(): string {
  if (existsSync(GSD_MODELS_PATH)) return GSD_MODELS_PATH    // ~/.gsd/agent/models.json
  if (existsSync(PI_MODELS_PATH))  return PI_MODELS_PATH     // ~/.pi/agent/models.json
  return GSD_MODELS_PATH                                       // default (will be created)
}
```

### ModelRegistry construction

```ts
const modelsJsonPath = resolveModelsJsonPath()
const modelRegistry = new ModelRegistry(authStorage, modelsJsonPath)
```

### Model validation + fallback (cli.ts lines 305-335)

On startup, validates the configured model still exists in the registry. If not, picks a fallback in priority order:

1. Pi's default model/provider (from migration)
2. `openai/gpt-5.4`
3. Any `openai` model
4. `anthropic/claude-opus-4-6`
5. Any `anthropic` model with "opus" in id
6. Any `anthropic` model
7. First available model

```ts
const preferred =
  (piDefault ? availableModels.find(...) : undefined) ||
  availableModels.find((m) => m.provider === 'openai' && m.id === 'gpt-5.4') ||
  availableModels.find((m) => m.provider === 'openai') ||
  availableModels.find((m) => m.provider === 'anthropic' && m.id === 'claude-opus-4-6') ||
  availableModels.find((m) => m.provider === 'anthropic' && m.id.includes('opus')) ||
  availableModels.find((m) => m.provider === 'anthropic') ||
  availableModels[0]
```

### `--model` override (print mode)

```ts
if (cliFlags.model) {
  const available = modelRegistry.getAvailable()
  const match =
    available.find((m) => m.id === cliFlags.model) ||
    available.find((m) => `${m.provider}/${m.id}` === cliFlags.model)
  if (match) session.setModel(match)
}
```

---

## 7. Key Architectural Notes

1. **loader.ts is the true entry point** (`#!/usr/bin/env node`). It sets all env vars, links workspace packages, then dynamically imports `cli.ts`.

2. **`@gsd/pi-coding-agent` is a local workspace package** — one of five (`native`, `pi-agent-core`, `pi-ai`, `pi-coding-agent`, `pi-tui`) symlinked from `packages/` into `node_modules/@gsd/`.

3. **Extension paths travel via env var** — `GSD_BUNDLED_EXTENSION_PATHS` is set in loader.ts and presumably read by `DefaultResourceLoader` inside the Pi SDK. The `buildResourceLoader()` in resource-loader.ts adds `additionalExtensionPaths` for Pi-location extensions.

4. **Two resource loaders** — Print mode creates `DefaultResourceLoader` directly with explicit options; interactive mode uses `buildResourceLoader()` which also merges Pi extensions.

5. **Session storage is per-cwd** — Encoded as `--path-segments--` under `~/.gsd/sessions/`. Legacy flat sessions are migrated on startup.

6. **Startup is instrumented** — `markStartup()` / `printStartupTimings()` track performance of each phase.
