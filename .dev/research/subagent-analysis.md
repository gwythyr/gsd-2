# Subagent Extension -- Deep Analysis

Source: `/home/user/gsd-2/src/resources/extensions/subagent/index.ts`
Related files:
- `agents.ts` -- agent discovery and config parsing
- `isolation.ts` -- git worktree / FUSE overlay isolation
- `worker-registry.ts` -- parallel worker tracking for dashboard
- `extension-manifest.json` -- extension metadata

---

## 1. The Exact `spawn()` Call and Its Arguments

The spawn happens inside `runSingleAgent()` (line 337). The CLI arguments are assembled first, then the process is spawned:

```ts
// Lines 295-296: Base args -- always present
const args: string[] = ["--mode", "json", "-p", "--no-session"];
if (agent.model) args.push("--model", agent.model);
if (agent.tools && agent.tools.length > 0) args.push("--tools", agent.tools.join(","));
```

System prompt injection (lines 324-329):
```ts
if (agent.systemPrompt.trim()) {
    const tmp = writePromptToTempFile(agent.name, agent.systemPrompt);
    tmpPromptDir = tmp.dir;
    tmpPromptPath = tmp.filePath;
    args.push("--append-system-prompt", tmpPromptPath);
}
```

Task appended as final positional arg (line 331):
```ts
args.push(`Task: ${task}`);
```

The actual spawn call (lines 335-341):
```ts
const bundledPaths = (process.env.GSD_BUNDLED_EXTENSION_PATHS ?? "")
    .split(path.delimiter).map(s => s.trim()).filter(Boolean);
const extensionArgs = bundledPaths.flatMap(p => ["--extension", p]);
const proc = spawn(
    process.execPath,             // Node binary (same Node that's running the parent)
    [process.env.GSD_BIN_PATH!,   // Path to the `pi` CLI entry point
     ...extensionArgs,            // --extension <path> for each bundled extension
     ...args],                    // --mode json -p --no-session [--model X] [--tools X] [--append-system-prompt /tmp/...] "Task: ..."
    {
        cwd: cwd ?? defaultCwd,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"]   // stdin=ignore, stdout=pipe, stderr=pipe
    },
);
```

**Key observations:**
- Uses `process.execPath` (the current Node binary) as the executable, NOT a shell command.
- `process.env.GSD_BIN_PATH!` is the first argument -- this is the path to the `pi` CLI script.
- Bundled extensions from `GSD_BUNDLED_EXTENSION_PATHS` are forwarded via `--extension` flags.
- `stdin` is `"ignore"` -- the subprocess cannot read from stdin.
- `stdout` and `stderr` are piped back to the parent.
- `shell: false` -- no shell interpolation.

**Final assembled command equivalent:**
```
node /path/to/pi --extension /ext1 --extension /ext2 --mode json -p --no-session --model <model> --tools tool1,tool2 --append-system-prompt /tmp/pi-subagent-XXXX/prompt-agentName.md "Task: <task text>"
```

---

## 2. How It Reads JSON Events from stdout

Line-delimited JSON (NDJSON) parsing. The subprocess emits one JSON object per line on stdout.

```ts
// Line 343
let buffer = "";

// Lines 382-387: Accumulate data, split on newlines, process complete lines
proc.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";          // Keep incomplete last line in buffer
    for (const line of lines) processLine(line);
});

// Lines 393-397: On process close, flush any remaining buffer
proc.on("close", (code) => {
    liveSubagentProcesses.delete(proc);
    if (buffer.trim()) processLine(buffer);  // Process final incomplete line
    resolve(code ?? 0);
});
```

The `processLine` function (lines 345-379):
```ts
const processLine = (line: string) => {
    if (!line.trim()) return;            // Skip empty lines
    let event: any;
    try {
        event = JSON.parse(line);        // Parse each line as JSON
    } catch {
        return;                          // Silently ignore non-JSON lines
    }
    // ... process event based on event.type
};
```

**Key points:**
- Uses newline-delimited JSON (each line is a complete JSON object).
- Handles partial reads correctly via buffering.
- Non-JSON lines are silently ignored (no error propagation).
- Remaining buffer is flushed on process close.

---

## 3. What Events It Processes

Only **two** event types are handled:

### `message_end`

```ts
if (event.type === "message_end" && event.message) {
    const msg = event.message as Message;
    currentResult.messages.push(msg);

    if (msg.role === "assistant") {
        currentResult.usage.turns++;
        const usage = msg.usage;
        if (usage) {
            currentResult.usage.input += usage.input || 0;
            currentResult.usage.output += usage.output || 0;
            currentResult.usage.cacheRead += usage.cacheRead || 0;
            currentResult.usage.cacheWrite += usage.cacheWrite || 0;
            currentResult.usage.cost += usage.cost?.total || 0;
            currentResult.usage.contextTokens = usage.totalTokens || 0;
        }
        if (!currentResult.model && msg.model) currentResult.model = msg.model;
        if (msg.stopReason) currentResult.stopReason = msg.stopReason;
        if (msg.errorMessage) currentResult.errorMessage = msg.errorMessage;
    }
    emitUpdate();
}
```

This event fires when the subprocess completes an assistant turn or a user message. It:
- Pushes the full `Message` object into `currentResult.messages`
- For assistant messages: increments turns, accumulates token usage, captures model/stopReason/errorMessage
- Calls `emitUpdate()` to stream partial results to the parent

### `tool_result_end`

```ts
if (event.type === "tool_result_end" && event.message) {
    currentResult.messages.push(event.message as Message);
    emitUpdate();
}
```

This event fires when a tool call completes in the subprocess. It:
- Pushes the tool result message into `currentResult.messages`
- Calls `emitUpdate()` to stream partial results

**Events NOT explicitly handled** (silently ignored):
- `message_start` / `message_delta` (streaming tokens)
- `tool_call_start` / `tool_call_delta`
- `tool_result_start`
- Any other event types

---

## 4. How It Collects Usage Stats

Usage is tracked in the `UsageStats` interface:

```ts
interface UsageStats {
    input: number;       // Input tokens
    output: number;      // Output tokens
    cacheRead: number;   // Cache read tokens
    cacheWrite: number;  // Cache write tokens
    cost: number;        // Dollar cost
    contextTokens: number; // Total context window tokens (last value, not accumulated)
    turns: number;       // Number of assistant turns
}
```

**Accumulation logic** (inside the `message_end` handler, only for `msg.role === "assistant"`):

| Field | Source | Accumulation |
|-------|--------|-------------|
| `turns` | implicit | `++` per assistant message |
| `input` | `msg.usage.input` | `+=` (summed across all turns) |
| `output` | `msg.usage.output` | `+=` (summed across all turns) |
| `cacheRead` | `msg.usage.cacheRead` | `+=` (summed across all turns) |
| `cacheWrite` | `msg.usage.cacheWrite` | `+=` (summed across all turns) |
| `cost` | `msg.usage.cost?.total` | `+=` (summed across all turns) |
| `contextTokens` | `msg.usage.totalTokens` | `=` (overwritten each turn -- last value wins) |

**Note:** `contextTokens` is assigned (`=`), not accumulated (`+=`). This means it reflects the context window size of the *last* turn, not a sum.

For parallel mode, there is also an `aggregateUsage()` function for display:
```ts
const aggregateUsage = (results: SingleResult[]) => {
    const total = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
    for (const r of results) {
        total.input += r.usage.input;
        total.output += r.usage.output;
        total.cacheRead += r.usage.cacheRead;
        total.cacheWrite += r.usage.cacheWrite;
        total.cost += r.usage.cost;
        total.turns += r.usage.turns;
    }
    return total;
};
```

---

## 5. How Models Are Passed to the Subprocess

Models come from the agent's `.md` frontmatter configuration:

In `agents.ts`, `.md` files are parsed for a `model` frontmatter field:
```ts
// agents.ts line 67
model: frontmatter.model,  // e.g., "claude-sonnet-4-20250514"
```

In `runSingleAgent()`:
```ts
// index.ts line 296
if (agent.model) args.push("--model", agent.model);
```

This passes `--model <value>` to the `pi` CLI. If no model is specified in the agent config, the flag is omitted entirely, and the subprocess uses whatever default model the `pi` CLI is configured with.

The model is also captured from the subprocess response:
```ts
// index.ts line 369
if (!currentResult.model && msg.model) currentResult.model = msg.model;
```

This means even if no `--model` flag was passed, the actual model used is captured from the first assistant `message_end` event for display purposes.

---

## 6. How System Prompts Are Injected

System prompts come from the **body** (non-frontmatter) content of the agent's `.md` file:

```ts
// agents.ts line 69
systemPrompt: body,   // Everything after the frontmatter "---" block
```

Injection into the subprocess (index.ts lines 324-329):

```ts
if (agent.systemPrompt.trim()) {
    const tmp = writePromptToTempFile(agent.name, agent.systemPrompt);
    tmpPromptDir = tmp.dir;
    tmpPromptPath = tmp.filePath;
    args.push("--append-system-prompt", tmpPromptPath);
}
```

The `writePromptToTempFile` function (lines 258-264):
```ts
function writePromptToTempFile(agentName: string, prompt: string): { dir: string; filePath: string } {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pi-subagent-"));
    const safeName = agentName.replace(/[^\w.-]+/g, "_");
    const filePath = path.join(tmpDir, `prompt-${safeName}.md`);
    fs.writeFileSync(filePath, prompt, { encoding: "utf-8", mode: 0o600 });
    return { dir: tmpDir, filePath };
}
```

**Flow:**
1. System prompt text is written to a temp file at `/tmp/pi-subagent-XXXX/prompt-agentName.md` with mode `0o600` (owner read/write only).
2. The `--append-system-prompt <path>` flag tells the `pi` CLI to read and append this file's contents to the system prompt.
3. After the subprocess exits (in the `finally` block), the temp file and directory are cleaned up:
   ```ts
   if (tmpPromptPath) try { fs.unlinkSync(tmpPromptPath); } catch { /* ignore */ }
   if (tmpPromptDir) try { fs.rmdirSync(tmpPromptDir); } catch { /* ignore */ }
   ```

**Note:** The flag is `--append-system-prompt`, meaning the file content is *appended* to the existing system prompt, not replacing it. The `pi` subprocess retains its own base system prompt.

---

## 7. How the Subagent Communicates Results Back

### 7a. Streaming Updates (during execution)

The `onUpdate` callback provides real-time progress to the parent:

```ts
const emitUpdate = () => {
    if (onUpdate) {
        onUpdate({
            content: [{ type: "text", text: getFinalOutput(currentResult.messages) || "(running...)" }],
            details: makeDetails([currentResult]),
        });
    }
};
```

This is called on every `message_end` and `tool_result_end` event. The `content` field contains the latest assistant text output, and `details` contains the full `SubagentDetails` with all accumulated messages and usage stats.

### 7b. Final Return Value (after completion)

The `runSingleAgent()` function returns a `SingleResult`:

```ts
interface SingleResult {
    agent: string;              // Agent name
    agentSource: "user" | "project" | "unknown";
    task: string;               // Original task text
    exitCode: number;           // Process exit code
    messages: Message[];        // All messages from the subprocess
    stderr: string;             // Captured stderr
    usage: UsageStats;          // Accumulated token usage
    model?: string;             // Model used (from first assistant message)
    stopReason?: string;        // "end_turn", "error", "aborted", etc.
    errorMessage?: string;      // Error detail from the model
    step?: number;              // Chain step index (1-based)
}
```

### 7c. Tool Result to Parent Agent

The execute function returns an `AgentToolResult<SubagentDetails>`:

```ts
return {
    content: [{ type: "text", text: outputText }],   // Final text output
    details: makeDetails("single")([result]),          // Full details for rendering
    isError?: true,                                    // Set on failure
};
```

The `content` text is what the parent agent sees as the tool result. The `details` object is used by the `renderResult` function for UI display.

### 7d. Error Detection

A result is considered an error when:
```ts
const isError = result.exitCode !== 0 || result.stopReason === "error" || result.stopReason === "aborted";
```

Error message is extracted with fallback chain:
```ts
const errorMsg = result.errorMessage || result.stderr || getFinalOutput(result.messages) || "(no output)";
```

### 7e. Chain Mode Result Passing

In chain mode, the output of each step is injected into the next step via `{previous}` placeholder:

```ts
let previousOutput = "";
for (let i = 0; i < params.chain.length; i++) {
    const step = params.chain[i];
    const taskWithContext = step.task.replace(/\{previous\}/g, previousOutput);
    // ... run agent ...
    previousOutput = getFinalOutput(result.messages);
}
```

---

## 8. Additional Mechanisms

### Process Lifecycle Management

Active subagent processes are tracked globally:
```ts
const liveSubagentProcesses = new Set<ChildProcess>();
```

On `session_shutdown`, all live subagents are killed (SIGTERM, then SIGKILL after 500ms):
```ts
pi.on("session_shutdown", async () => {
    await stopLiveSubagents();
});
```

Abort signal handling for individual subagents:
```ts
if (signal) {
    const killProc = () => {
        wasAborted = true;
        proc.kill("SIGTERM");
        setTimeout(() => {
            if (!proc.killed) proc.kill("SIGKILL");
        }, 5000);
    };
    if (signal.aborted) killProc();
    else signal.addEventListener("abort", killProc, { once: true });
}
```

### Parallel Execution

- Max parallel tasks: 8 (`MAX_PARALLEL_TASKS`)
- Max concurrency: 4 (`MAX_CONCURRENCY`) -- at most 4 subprocesses run simultaneously
- Failed tasks are auto-retried once (`MAX_RETRIES = 1`)
- Workers are tracked in the worker registry for dashboard display

### Filesystem Isolation

When `params.isolated = true` and settings have `taskIsolation.mode` configured:
- **worktree mode:** Creates a detached git worktree, copies dirty state, subagent works there, delta patches are captured and merged back.
- **fuse-overlay mode:** Uses `fuse-overlayfs` to create a copy-on-write overlay filesystem. Falls back to worktree if `fuse-overlayfs` is not available.

### Stderr Handling

Stderr is simply accumulated as a string:
```ts
proc.stderr.on("data", (data) => {
    currentResult.stderr += data.toString();
});
```

It is only used as a fallback error message if `errorMessage` is not available.
