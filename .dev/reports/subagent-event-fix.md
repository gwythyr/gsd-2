# Subagent Event Parsing Fix

## Problem

The `processLine` function in `src/resources/extensions/subagent/index.ts` was incorrectly handling Claude Code's `--output-format stream-json` events. Two issues:

### 1. `assistant` event: raw cast without field mapping

The handler did `const msg = event.message as Message`, treating the Claude Code API message as a GSD `Message` directly. But the formats differ:

| Field | Claude Code (Anthropic API) | GSD `Message` |
|-------|----------------------------|---------------|
| Content blocks | `{type: "tool_use", id, name, input}` | `{type: "toolCall", id, name, arguments}` |
| Token usage | `{input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens}` | `{input, output, cacheRead, cacheWrite, totalTokens, cost}` |
| Stop reason | `"end_turn"`, `"tool_use"`, `"max_tokens"` | `"stop"`, `"toolUse"`, `"length"` |
| Stop field | `stop_reason` (snake_case) | `stopReason` (camelCase) |

Result: all usage stats were 0, tool call content blocks were invisible, stop reasons were wrong.

### 2. `result` event: double-counting via accumulation

The handler accumulated `event.usage.*` tokens on top of already-accumulated `assistant` event tokens, and added `event.cost_usd` on top of per-message costs. The `result` event provides authoritative totals, not deltas.

## Fix

### Added: `mapClaudeMessageToGSD(claudeMsg)` helper (line ~188)

Transforms a Claude Code API message to GSD format:
- Maps `tool_use` content blocks to `toolCall` blocks
- Maps snake_case usage fields to camelCase
- Maps stop reasons (`end_turn` -> `stop`, `tool_use` -> `toolUse`, `max_tokens` -> `length`)
- Handles both Anthropic snake_case and GSD camelCase field names for resilience

### Fixed: `assistant` event handler (line ~427)

- Calls `mapClaudeMessageToGSD(event.message)` instead of raw `as Message` cast
- Uses mapped message for all downstream processing
- Removed the redundant `if (msg.role === "assistant")` guard since mapped messages always have `role: "assistant"`

### Fixed: `result` event handler (line ~451)

- `cost_usd` now **replaces** (not adds to) `usage.cost` — it's the authoritative total
- `total_turns` now **replaces** (not ignored) `usage.turns`
- Removed duplicate token accumulation from `event.usage` (already captured from `assistant` events)

### Preserved: backward compatibility

- Legacy `message_end` handler unchanged
- Legacy `tool_result` / `tool_result_end` handlers unchanged
- All existing rendering, display, and aggregation code unmodified

## Verification

TypeScript compiles with zero new errors (confirmed via `npx tsc --noEmit`).
