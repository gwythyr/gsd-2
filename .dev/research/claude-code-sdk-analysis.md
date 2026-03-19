# Claude Code SDK Analysis

Research for subagent adapter integration.

## CLI Flags Summary (from `claude --help`)

Key flags relevant to subagent usage:

| Flag | Description |
|------|-------------|
| `-p, --print` | Non-interactive mode. Required for programmatic use. |
| `--output-format <format>` | `text` (default), `json`, or `stream-json`. Only works with `--print`. |
| `--include-partial-messages` | Include partial message chunks as they arrive. Only with `--print` + `stream-json`. |
| `--append-system-prompt <prompt>` | Appends to the default system prompt. Confirmed exists. |
| `--system-prompt <prompt>` | Fully replaces the default system prompt. |
| `--no-session-persistence` | Confirmed exists. Sessions won't be saved to disk and cannot be resumed. Only with `--print`. |
| `--model <model>` | Accepts alias (`sonnet`, `opus`) or full name (`claude-sonnet-4-6`). |
| `--allowedTools, --allowed-tools <tools...>` | Comma or space-separated tool names. Uses permission rule syntax (e.g. `"Bash(git:*) Edit"`). |
| `--disallowedTools, --disallowed-tools <tools...>` | Deny-list counterpart. |
| `--tools <tools...>` | Specify available built-in tools. Use `""` to disable all, `"default"` for all, or names like `"Bash,Edit,Read"`. |
| `--max-budget-usd <amount>` | Spending cap. Only with `--print`. |
| `--mcp-config <configs...>` | Load MCP servers from JSON files or strings. |
| `--json-schema <schema>` | JSON Schema for structured output validation. |
| `--dangerously-skip-permissions` | Bypass all permission checks. For sandboxes only. |
| `--permission-mode <mode>` | Choices: `acceptEdits`, `bypassPermissions`, `default`, `dontAsk`, `plan`, `auto`. |
| `-c, --continue` | Continue most recent conversation. |
| `-r, --resume [value]` | Resume by session ID. |
| `--session-id <uuid>` | Use specific session ID. |
| `--verbose` | Needed for full stream-json events. |
| `--effort <level>` | `low`, `medium`, `high`, `max`. |
| `--fallback-model <model>` | Auto-fallback when default model is overloaded. Only with `--print`. |
| `--add-dir <directories...>` | Additional directories for tool access. |

## stream-json Event Types

When using `--output-format stream-json --verbose --include-partial-messages`:

### Top-Level Message Types

Each line is a JSON object with a `.type` field:

| Type | Description |
|------|-------------|
| `system` | System events (e.g., `subtype: "api_retry"` for retries) |
| `stream_event` | Raw Claude API streaming events (the main content) |
| `assistant` | Complete assistant message (emitted after stream completes) |
| `result` | Final result message |

### stream_event Subtypes (`.event.type`)

These mirror the Claude API SSE streaming protocol:

| Event Type | Description |
|------------|-------------|
| `message_start` | Start of a new message |
| `content_block_start` | Start of a text or tool_use block |
| `content_block_delta` | Incremental content update |
| `content_block_stop` | End of a content block |
| `message_delta` | Message-level updates (stop reason, usage) |
| `message_stop` | End of the message |

### Key Delta Types (inside `content_block_delta`)

- `text_delta` -- `.event.delta.text` contains the text chunk
- `input_json_delta` -- `.event.delta.partial_json` contains tool input chunks

### Extracting Streaming Text

```bash
claude -p "prompt" --output-format stream-json --verbose --include-partial-messages | \
  jq -rj 'select(.type == "stream_event" and .event.delta.type? == "text_delta") | .event.delta.text'
```

### system/api_retry Event Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"system"` | message type |
| `subtype` | `"api_retry"` | retry event |
| `attempt` | integer | current attempt (starts at 1) |
| `max_retries` | integer | total retries permitted |
| `retry_delay_ms` | integer | ms until next attempt |
| `error_status` | integer/null | HTTP status code |
| `error` | string | error category |
| `uuid` | string | unique event ID |
| `session_id` | string | session ID |

## Answers to Key Questions

### Does `--append-system-prompt` work?
Yes. Confirmed in CLI help and documentation. Appends to the default system prompt.

### Does `--no-session-persistence` exist?
Yes. Confirmed. Disables saving sessions to disk. Only works with `--print`.

### What's the `--tools` flag format?
Space or comma-separated built-in tool names: `"Bash,Edit,Read"`. Use `""` to disable all, `"default"` for all tools.

### Does it support `--allowedTools`?
Yes. Both `--allowedTools` and `--allowed-tools` work. Uses permission rule syntax with prefix matching: `"Bash(git diff *)"` allows any command starting with `git diff `.

### What does `--model` accept?
Aliases like `sonnet`, `opus`, or full model names like `claude-sonnet-4-6`.

### Is there a programmatic Node.js API?
Yes. The `@anthropic-ai/claude-code` npm package is now deprecated for programmatic use. The replacement is `@anthropic-ai/claude-agent-sdk`:

```bash
npm install @anthropic-ai/claude-agent-sdk
```

TypeScript usage:
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "your prompt",
  options: {
    includePartialMessages: true,
    allowedTools: ["Bash", "Read", "Edit"]
  }
})) {
  if (message.type === "stream_event") {
    const event = message.event;
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
}
```

Message types from the SDK: `StreamEvent`, `AssistantMessage`, `ResultMessage`, `SystemMessage`, `CompactBoundaryMessage`.

### Streaming Limitations
- Extended thinking (when `maxThinkingTokens` is set): `StreamEvent` messages are NOT emitted
- Structured output: JSON result only in final `ResultMessage.structured_output`, not streamed

## Subagent Adapter Implications

For a CLI-based subagent adapter using `claude -p`:

1. **Spawn**: `claude -p "prompt" --output-format stream-json --verbose --include-partial-messages --no-session-persistence --model sonnet`
2. **Stream parsing**: Read stdout line-by-line, parse JSON, filter for `.type == "stream_event"` with `.event.delta.type == "text_delta"`
3. **Tool control**: Use `--allowedTools` and `--tools` to restrict capabilities
4. **System prompt**: Use `--append-system-prompt` to inject role/context
5. **Permissions**: Use `--dangerously-skip-permissions` or `--permission-mode` for unattended operation
6. **Budget**: Use `--max-budget-usd` for cost control

For a programmatic adapter, prefer `@anthropic-ai/claude-agent-sdk` which provides native async iterators and typed message objects.
