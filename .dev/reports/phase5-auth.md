# Phase 5: Auth Layer Simplification

## Summary

Simplified the auth layer for the GSD v2 to Claude Code SDK migration. Three files were updated to replace stub implementations with working code that eliminates multi-provider complexity in favor of Anthropic-only auth via `ANTHROPIC_API_KEY` or Claude Code native auth.

## Changes

### 1. AuthStorage (`packages/claude-code-adapter/src/types/auth.ts`)

**Before:** All methods threw `"Not implemented"` errors.

**After:** Working in-memory credential store that:
- Seeds from `ANTHROPIC_API_KEY` env var on construction
- Detects Claude Code native auth via `CLAUDE_CODE` / `CLAUDE_CODE_ENTRYPOINT` env vars
- Provides all methods used by `cli.ts`, `onboarding.ts`, `wizard.ts`, and `pi-migration.ts`:
  - `create()` — static factory (accepts optional `authPath` for interface compat, ignored)
  - `get()` / `set()` / `has()` / `list()` — credential CRUD
  - `hasAuth()` — checks stored creds, fallback resolver, and env vars
  - `getApiKey()` / `setApiKey()` / `removeApiKey()` — API key shortcuts
  - `getCredential()` / `getCredentials()` / `hasCredentials()` — credential access
  - `hasAnyCredentials()` — new method for simplified onboarding check
  - `setFallbackResolver()` — env var lookup fallback
  - `getOAuthProviders()` — returns `[]` (OAuth removed)
  - `login()` — throws (OAuth not supported in SDK mode)

### 2. ModelRegistry (`packages/claude-code-adapter/src/types/model.ts`)

**Before:** All methods threw `"Not implemented"` errors.

**After:** Static registry of Claude model family:
- `claude-opus-4-6` (200K context, 32K output, reasoning)
- `claude-sonnet-4-6` (200K context, 16K output, reasoning)
- `claude-haiku-4-5-20251001` (200K context, 8K output)

Constructor accepts `authStorage` and `modelsJsonPath` for interface compatibility but ignores both. All query methods work: `find()`, `getAvailable()`, `getAll()`, `getLoadError()`.

### 3. Onboarding (`src/onboarding.ts`)

**Before:** 935-line multi-provider wizard with OAuth flows, web search setup, Discord/Slack/Telegram remote questions, and tool API key prompts.

**After:** 130-line single-purpose flow:
- `shouldRunOnboarding()` returns `false` if `ANTHROPIC_API_KEY` is set, Claude Code native auth detected, or any credentials exist
- `runOnboarding()` prompts only for Anthropic API key with `sk-ant-` prefix validation

**Removed sections** (marked with `REMOVED` comments):
- Multi-provider selection (OAuth, GitHub Copilot, Google, OpenAI, etc.)
- Web search provider selection (Brave, Tavily)
- Remote questions setup (Discord, Slack, Telegram)
- Tool API keys (Context7, Jina, Groq)
- Custom OpenAI-compatible endpoint flow

## Interface Compatibility

All existing call sites in `cli.ts`, `wizard.ts`, and `pi-migration.ts` remain compatible:
- `AuthStorage.create(authFilePath)` — works (param accepted, ignored)
- `authStorage.list()`, `.has()`, `.get()`, `.set()` — all functional
- `authStorage.hasAuth()` — used by `shouldRunOnboarding()` and extensions
- `new ModelRegistry(authStorage, modelsJsonPath)` — works (params accepted for compat)
- `modelRegistry.getAvailable()`, `.getAll()`, `.find()` — all functional

## TypeScript Verification

- `packages/claude-code-adapter/` compiles cleanly with `tsc --noEmit`
- `src/onboarding.ts` errors are all pre-existing (missing `@types/node`, unresolved `@gsd/pi-coding-agent` module alias) — no new errors introduced

## TODOs Left

- `FileAuthStorageBackend` — implement if persistent auth storage needed
- `ModelRegistry.registerProvider()` — implement if third-party models needed
- OAuth login flow — implement if browser-based auth needed in adapter mode
- Tool API key prompts — re-add if extensions need them
- `modelsJsonPath` loading — implement if custom model configs needed
