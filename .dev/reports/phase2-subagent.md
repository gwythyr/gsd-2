# Phase 2: Subagent Adapter Implementation

## Summary

Modified `src/resources/extensions/subagent/index.ts` to spawn `claude` CLI instead of the `gsd`/Pi CLI. Updated `packages/claude-code-adapter/src/adapters/subagent-adapter.ts` with the mapping reference and utility functions.

## Changes Made

### 1. Spawn Command (`index.ts`)

**Before:**
```typescript
const proc = spawn(
    process.execPath,
    [process.env.GSD_BIN_PATH!, ...extensionArgs, ...args],
    { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] }
);
```

**After:**
```typescript
const proc = spawn(
    claudeBin,  // "claude" or CLAUDE_BIN_PATH env var
    [...args],
    { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] }
);
```

- Removed `GSD_BUNDLED_EXTENSION_PATHS` and `--extension` forwarding (Claude Code uses plugins differently)
- Added `CLAUDE_BIN_PATH` env var override (defaults to `"claude"`)

### 2. CLI Argument Mapping

| GSD (old) | Claude Code (new) |
|-----------|-------------------|
| `--mode json` | `--output-format stream-json` |
| `-p` | `-p` (unchanged) |
| `--no-session` | `--no-session-persistence` |
| `--model X` | `--model X` (unchanged) |
| `--tools X` | `--allowedTools X` |
| `--append-system-prompt /path` | `--append-system-prompt /path` (unchanged) |
| `--extension /path` | Removed |

### 3. Event Format Mapping

Added handlers for Claude Code `--output-format stream-json` event types:

- **`assistant`** event: Maps to the old `message_end` handler. Extracts message, usage stats, model, stopReason, errorMessage.
- **`result`** event: New Claude Code-specific final event. Extracts `usage.input_tokens`, `usage.output_tokens`, `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens`, `cost_usd`, `model`, `stop_reason`.
- **`tool_result`** event: Maps to old `tool_result_end` handler.

Legacy `message_end` and `tool_result_end` handlers are retained for backward compatibility during migration.

### 4. Import Changes

- Removed `import type { AgentToolResult } from "@gsd/pi-agent-core"` dependency
- Defined `AgentToolResult<T>` interface locally in the file
- All other imports (`@gsd/pi-ai`, `@gsd/pi-coding-agent`, `@gsd/pi-tui`, `@sinclair/typebox`) kept unchanged

### 5. Subagent Adapter Stub (`subagent-adapter.ts`)

Updated from a bare stub to include:
- CLI argument mapping reference documentation
- Event format mapping reference documentation
- `buildClaudeArgs()` utility function
- `getClaudeBinPath()` utility function

## What Was NOT Changed

- NDJSON line parsing (buffer + split on newline)
- Process lifecycle management (`liveSubagentProcesses` Set)
- Abort signal handling
- Parallel execution (`MAX_PARALLEL_TASKS`, `MAX_CONCURRENCY`)
- Filesystem isolation (worktree mode)
- Chain mode with `{previous}` placeholder
- Worker registry for dashboard
- Temp file system prompt injection
- All rendering code (`renderCall`, `renderResult`)
- Agent discovery (`agents.ts`)
- Isolation modes (`isolation.ts`)

## TypeScript Compilation

Verified with `npx tsc --noEmit`. No new errors introduced in `subagent/index.ts`. Pre-existing errors in other files (missing `@types/node`, etc.) are unrelated.

## Files Modified

- `/home/user/gsd-2/src/resources/extensions/subagent/index.ts` -- main subagent extension
- `/home/user/gsd-2/packages/claude-code-adapter/src/adapters/subagent-adapter.ts` -- adapter reference

## TODOs / Follow-up

- **TODO**: Verify Claude Code's exact `--output-format stream-json` event schema at runtime. The `assistant` and `result` event type mappings are based on Claude Code SDK documentation; field names may need adjustment based on actual CLI output.
- **TODO**: Confirm `--allowedTools` is the correct flag name (vs `--tools`) in the installed Claude Code CLI version.
- **TODO**: Test end-to-end with a real `claude` CLI invocation to validate event parsing.
- **TODO**: Remove legacy `message_end`/`tool_result_end` handlers once migration is complete and GSD events are no longer emitted.
