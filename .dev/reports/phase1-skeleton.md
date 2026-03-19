# Phase 1: @gsd/claude-code-adapter Package Skeleton

## Status: Complete

TypeScript compiles with **zero errors** (`npx tsc --noEmit` passes cleanly).

## What Was Created

### Package Root
- `packages/claude-code-adapter/package.json` — `@gsd/claude-code-adapter@0.1.0`, ESM, deps: `@sinclair/typebox`
- `packages/claude-code-adapter/tsconfig.json` — NodeNext module resolution, strict mode, matches other workspace packages

### Type Definitions (`src/types/`)

| File | Contents | Strategy |
|------|----------|----------|
| `extension-api.ts` | All 100+ extension system types: `ExtensionAPI`, `ExtensionContext`, `ExtensionCommandContext`, all event types (Agent/Session/Tool/Input/Model), `ToolDefinition`, `RegisteredCommand`, `ProviderConfig`, `EventBus`, type guards (`isBashToolResult`, `isToolCallEventType`, etc.), plus lightweight forward-declared types for `Model`, `Message`, `TextContent`, etc. | Exact interface shapes from pi-coding-agent source |
| `tools.ts` | Tool input/detail/options types for all 7 built-in tools, `BashInterceptorRule`, hashline types, operation interfaces | Exact shapes from pi-coding-agent tools module |
| `session.ts` | `SessionManager` class, `SessionHeader`, all entry types (`SessionMessageEntry`, `CompactionEntry`, `BranchSummaryEntry`, `CustomEntry`, etc.), `SessionContext`, `SessionInfo`, `buildSessionContext`, `parseSessionEntries` | Class with throwing method stubs; `parseSessionEntries` has real JSONL parsing impl |
| `model.ts` | `ModelRegistry`, `ModelDiscoveryCache`, `ModelInfo`, `DiscoveredModel`, `DiscoveryResult` | Class with throwing stubs |
| `auth.ts` | `AuthStorage`, `FileAuthStorageBackend`, `InMemoryAuthStorageBackend`, credential types | Classes with throwing stubs; `InMemoryAuthStorageBackend` has working impl |
| `settings.ts` | `SettingsManager`, `CompactionSettings`, `RetrySettings`, `ImageSettings`, `MemorySettings`, `AsyncSettings`, `TaskIsolationSettings`, `PackageSource` | Class with throwing stubs |
| `theme.ts` | `Theme` class, `ThemeColor` type, `initTheme`, `getMarkdownTheme`, `highlightCode`, `getLanguageFromPath`, `getSelectListTheme`, `getSettingsListTheme` | Class with throwing stubs |
| `events.ts` | `EventBus`, `EventBusController`, `createEventBus()` | **Real implementation** (copied from pi-coding-agent, uses Node EventEmitter) |

### Adapter Stubs (`src/adapters/`)

| File | Contents |
|------|----------|
| `session-adapter.ts` | `createAgentSession()` stub with full option types |
| `subagent-adapter.ts` | `spawnSubagent()` stub with `SubagentSpawnOptions`, `SubagentResult`, `SubagentUpdate` types |
| `extension-runtime.ts` | `createExtensionRuntime()`, `discoverAndLoadExtensions()`, `ExtensionRunner`, `importExtensionModule()`, trust helpers |
| `interactive-mode.ts` | `InteractiveMode`, `runPrintMode()`, `runRpcMode()`, `RpcClient`, JSONL utilities |

### Utilities (`src/utils/`)

| File | Contents | Strategy |
|------|----------|----------|
| `frontmatter.ts` | `parseFrontmatter()`, `stripFrontmatter()` | **Real implementation** (with simple YAML parser, no `yaml` dep) |
| `shell.ts` | `getShellConfig()`, `sanitizeCommand()` | **Real implementation** (simplified, no SettingsManager dep) |
| `text.ts` | `truncateHead()`, `truncateTail()`, `truncateLine()`, `formatSize()`, `DEFAULT_MAX_BYTES`, `DEFAULT_MAX_LINES` | **Real implementation** |
| `typebox-helpers.ts` | `StringEnum()` | **Real implementation** (copied from pi-ai) |

### Core Stubs (`src/core/`)

| File | Contents |
|------|----------|
| `compaction.ts` | `compact()`, `shouldCompact()`, `estimateTokens()`, `DEFAULT_COMPACTION_SETTINGS`, and 9 more compaction functions |
| `blob-store.ts` | `BlobStore`, `ArtifactManager`, `isBlobRef()`, `parseBlobRef()` |
| `skills.ts` | `loadSkills()`, `Skill`, `SkillFrontmatter`, `formatSkillsForPrompt()` |
| `package-manager.ts` | `DefaultPackageManager` (returns empty results) |
| `resource-loader.ts` | `DefaultResourceLoader` (returns empty arrays) |
| `sdk.ts` | All tool factory functions, pre-built tool constants |

### UI Components (`src/ui/components.ts`)

27 component stubs (all return `undefined`): `AssistantMessageComponent`, `BashExecutionComponent`, `FooterComponent`, `ToolExecutionComponent`, `UserMessageComponent`, `ModelSelectorComponent`, `SessionSelectorComponent`, plus 20 more. Also includes `CustomEditor` base class, key hint helpers, `renderDiff()`, `truncateToVisualLines()`.

### Barrel (`src/index.ts`)

375+ exports matching pi-coding-agent's `index.ts` surface. Includes:
- All type re-exports from `types/`
- All value re-exports from `core/`, `adapters/`, `utils/`, `ui/`
- Inline stubs for: `AgentSession`, `ModelsJsonWriter`, `main()`, `convertToLlm()`, `toPosixPath()`, `copyToClipboard()`, `VERSION`, `getAgentDir()`
- Re-exports of `Type`, `Static`, `TSchema` from `@sinclair/typebox`
- Bash interceptor stubs

## Implementation Strategy Summary

1. **Types/Interfaces**: Defined with correct shapes by reading actual pi-coding-agent source
2. **Classes with complex implementations**: Stubs that throw `"Not implemented: use claude-code-adapter implementation"`
3. **Pure utility functions**: Real implementations copied (frontmatter, shell, text, typebox-helpers, event bus, parseSessionEntries, isBlobRef)
4. **Constants**: Real values (`DEFAULT_MAX_BYTES`, `DEFAULT_MAX_LINES`, `CURRENT_SESSION_VERSION`, `DEFAULT_COMPACTION_SETTINGS`)

## Verification

```
$ cd packages/claude-code-adapter && npx tsc --noEmit
(no output — zero errors)
```

## File Count

- 19 TypeScript source files
- 2 config files (package.json, tsconfig.json)
- Total: 21 files
