# Phase 3: Session Lifecycle Adapter

## Summary

Migrated the GSD CLI session lifecycle from Pi SDK (`@gsd/pi-coding-agent`) to the Claude Code adapter (`@gsd/claude-code-adapter`). All imports in the main CLI flow now resolve from the adapter package, which provides working implementations of AuthStorage, ModelRegistry, SettingsManager, SessionManager, and createAgentSession.

## Changes Made

### 1. `src/loader.ts`
- **Removed** `PI_PACKAGE_DIR` and `PI_SKIP_VERSION_CHECK` env vars (Pi-specific)
- **Added** `claude-code-adapter` to the workspace packages list (`wsPackages`)
- **Changed** critical package validation from `pi-coding-agent` to `claude-code-adapter`

### 2. `src/cli.ts`
- **Swapped** import from `@gsd/pi-coding-agent` to `@gsd/claude-code-adapter`
- **Simplified** model fallback chain to Claude-only:
  - Removed: OpenAI gpt-5.4 fallback, generic OpenAI fallback
  - Now: `claude-sonnet-4-6` (default) -> `claude-opus-4-6` -> any anthropic -> first available

### 3. `src/wizard.ts`, `src/onboarding.ts`, `src/pi-migration.ts`
- Swapped `AuthStorage` / `AuthCredential` type imports from `@gsd/pi-coding-agent` to `@gsd/claude-code-adapter`

### 4. `src/resource-loader.ts`
- Swapped `DefaultResourceLoader` import to `@gsd/claude-code-adapter`

### 5. `src/headless.ts`, `src/headless-ui.ts`, `src/headless-answers.ts`
- Swapped `RpcClient`, `attachJsonlLineReader`, `serializeJsonLine` imports to `@gsd/claude-code-adapter`

### 6. `packages/claude-code-adapter/src/types/settings.ts`
- **Replaced** stub SettingsManager with file-backed implementation
- Reads/writes `settings.json` from agent directory
- Added missing methods used by cli.ts: `getDefaultThinkingLevel()`, `setDefaultThinkingLevel()`, `getQuietStartup()`, `setQuietStartup()`, `getCollapseChangelog()`, `setCollapseChangelog()`

### 7. `packages/claude-code-adapter/src/types/session.ts`
- **Replaced** stub SessionManager with file-backed JSONL implementation
- Working `create()`, `inMemory()`, `continueRecent()`, `open()`, `list()` static methods
- Working instance methods for session queries (getEntries, getHeader, etc.)
- Working `buildSessionContext()` implementation

### 8. `packages/claude-code-adapter/src/adapters/session-adapter.ts`
- **Implemented** `createAgentSession()` factory
- Creates `AgentSessionProxy` with model selection, thinking level, scoped models
- Provides stub `ExtensionRuntime` in the extensions result
- Model fallback: configured model -> claude-sonnet-4-6 -> first available

### 9. `packages/claude-code-adapter/src/index.ts`
- Re-exports `AgentSessionProxy` as `AgentSession` from session-adapter

## TypeScript Verification

`npx tsc --noEmit` produces **no new errors** from these changes. All remaining errors are pre-existing:
- `@types/node` resolution issues (root tsconfig lacks node types in paths)
- Pre-existing headless RpcClient stub missing methods
- Pre-existing worktree/update-cmd issues

## What Still Needs Implementation (TODOs)

1. **Extension loading** in `createAgentSession` — currently returns empty extensions list; needs to wire up resource loader paths to actual extension discovery/loading
2. **AuthStorage file persistence** — current implementation is in-memory only; the `_authPath` parameter is accepted but credentials are not persisted to disk (sufficient for Claude Code native auth via env vars)
3. **SessionManager branching** — `getBranch()` returns flat entry list; tree branching/forking not yet implemented
4. **InteractiveMode** — still a stub that throws; needs Claude Code SDK TUI integration
5. **runPrintMode / runRpcMode** — still stubs; need Claude Code subprocess spawning
6. **RpcClient** — stub; headless mode needs real implementation

## Architecture Notes

The adapter package now provides a complete session lifecycle that:
- Reads settings from `~/.gsd/agent/settings.json` (file-backed)
- Stores sessions as JSONL in `~/.gsd/sessions/<safeCwd>/` (file-backed)
- Uses hardcoded Claude model family (opus, sonnet, haiku) instead of models.json
- Handles auth via in-memory credential store seeded from `ANTHROPIC_API_KEY`
- Creates session proxy objects compatible with the extension API surface
