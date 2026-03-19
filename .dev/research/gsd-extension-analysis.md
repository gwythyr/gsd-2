# GSD Extension Analysis

Analysis of `/home/user/gsd-2/src/resources/extensions/gsd/index.ts` and related files.

---

## 1. Registration with ExtensionAPI (`pi` parameter)

The extension exports a default function receiving `pi: ExtensionAPI`:

```ts
export default function (pi: ExtensionAPI) {
  registerGSDCommand(pi);
  registerWorktreeCommand(pi);
  registerExitCommand(pi);
  // ... tool registrations, event listeners, shortcuts
}
```

The `pi` object is the sole integration surface. It is used for:
- `pi.registerCommand()` — slash commands
- `pi.registerTool()` — LLM-callable tools
- `pi.registerShortcut()` — keyboard shortcuts
- `pi.on()` — event hooks
- `pi.sendMessage()` — injecting messages into the conversation
- `pi.setModel()` — switching the active LLM model

---

## 2. Commands Registered (`registerCommand`)

### Direct in `index.ts`:

```ts
pi.registerCommand("kill", {
  description: "Exit GSD immediately (no cleanup)",
  handler: async (_args: string, _ctx: ExtensionCommandContext) => {
    process.exit(0);
  },
});
```

### Via `commands.ts` (`registerGSDCommand`):

```ts
// commands.ts
pi.registerCommand("gsd", {
  description: "GSD -- Get Shit Done: /gsd help|start|templates|next|auto|stop|...",
  getArgumentCompletions: (prefix: string) => { /* tab completion logic */ },
  async handler(args: string, ctx: ExtensionCommandContext) {
    await handleGSDCommand(args, ctx, pi);
  },
});
```

The `/gsd` command is a mega-router. `handleGSDCommand` dispatches on the first argument to ~40+ subcommands:
- `help`, `status`, `visualize`, `mode`, `prefs`, `init`, `keys`, `setup`
- `doctor`, `logs`, `forensics`, `next`, `auto`, `stop`, `pause`
- `history`, `undo`, `skip`, `export`, `parallel`
- `cleanup`, `queue`, `discuss`, `park`, `unpark`, `new-milestone`
- `capture`, `triage`, `quick`, `config`, `hooks`, `skill-health`
- `run-hook`, `steer`, `knowledge`, `migrate`, `remote`, `dispatch`
- `inspect`, `update`, `start`, `templates`, `extensions`

### Via other registration calls:
- `registerWorktreeCommand(pi)` — from `worktree-command.ts`
- `registerExitCommand(pi)` — from `exit-command.ts`

---

## 3. Tools Registered (`registerTool`)

### 3.1 Dynamic-cwd bash tool (overrides built-in)

```ts
const baseBash = createBashTool(process.cwd(), {
  spawnHook: (ctx) => ({ ...ctx, cwd: process.cwd() }),
});
const dynamicBash = {
  ...baseBash,
  execute: async (toolCallId, params, signal, onUpdate, ctx) => {
    const paramsWithTimeout = {
      ...params,
      timeout: params.timeout ?? DEFAULT_BASH_TIMEOUT_SECS,
    };
    return (baseBash as any).execute(toolCallId, paramsWithTimeout, signal, onUpdate, ctx);
  },
};
pi.registerTool(dynamicBash as any);
```

Purpose: (a) reads `process.cwd()` dynamically so worktree chdir propagates, (b) injects a default 120s timeout.

### 3.2 Dynamic-cwd file tools (write, read, edit)

Same pattern for `createWriteTool`, `createReadTool`, `createEditTool` — each wraps the base tool to create a fresh instance on every `execute()` call so `process.cwd()` is re-evaluated:

```ts
const dynamicWrite = {
  ...baseWrite,
  execute: async (toolCallId, params, signal, onUpdate, ctx) => {
    const fresh = createWriteTool(process.cwd());
    return (fresh as any).execute(toolCallId, params, signal, onUpdate, ctx);
  },
};
pi.registerTool(dynamicWrite as any);
```

### 3.3 `gsd_save_decision`

Structured tool for recording project decisions to the GSD SQLite database.

```ts
pi.registerTool({
  name: "gsd_save_decision",
  label: "Save Decision",
  description: "Record a project decision to the GSD database and regenerate DECISIONS.md...",
  promptSnippet: "Record a project decision to the GSD database...",
  promptGuidelines: [...],
  parameters: Type.Object({
    scope: Type.String(...),
    decision: Type.String(...),
    choice: Type.String(...),
    rationale: Type.String(...),
    revisable: Type.Optional(Type.String(...)),
    when_context: Type.Optional(Type.String(...)),
  }),
  async execute(_toolCallId, params, _signal, _onUpdate, _ctx) { ... },
});
```

### 3.4 `gsd_update_requirement`

Updates an existing requirement by ID. Verifies it exists before updating.

```ts
pi.registerTool({
  name: "gsd_update_requirement",
  label: "Update Requirement",
  parameters: Type.Object({
    id: Type.String(...),
    status: Type.Optional(Type.String(...)),
    validation: Type.Optional(Type.String(...)),
    notes: Type.Optional(Type.String(...)),
    description: Type.Optional(Type.String(...)),
    primary_owner: Type.Optional(Type.String(...)),
    supporting_slices: Type.Optional(Type.String(...)),
  }),
  ...
});
```

### 3.5 `gsd_save_summary`

Saves artifact (SUMMARY, RESEARCH, CONTEXT, ASSESSMENT) to DB and disk. Computes file path from milestone/slice/task IDs.

```ts
pi.registerTool({
  name: "gsd_save_summary",
  label: "Save Summary",
  parameters: Type.Object({
    milestone_id: Type.String(...),
    slice_id: Type.Optional(Type.String(...)),
    task_id: Type.Optional(Type.String(...)),
    artifact_type: Type.String(...),
    content: Type.String(...),
  }),
  ...
});
```

### 3.6 `gsd_generate_milestone_id`

Generates the next milestone ID respecting `unique_milestone_ids` preference. Maintains a reservation set to prevent duplicates across calls in the same session.

```ts
pi.registerTool({
  name: "gsd_generate_milestone_id",
  label: "Generate Milestone ID",
  parameters: Type.Object({}),
  async execute(...) {
    const existingIds = findMilestoneIds(basePath);
    const uniqueEnabled = !!loadEffectiveGSDPreferences()?.preferences?.unique_milestone_ids;
    const allIds = [...new Set([...existingIds, ...reservedMilestoneIds])];
    const newId = nextMilestoneId(allIds, uniqueEnabled);
    reservedMilestoneIds.add(newId);
    ...
  },
});
```

---

## 4. ExtensionCommandContext Usage

`ExtensionCommandContext` (aliased as `ctx` in command handlers) provides:

### 4.1 `ctx.ui.*` — UI interactions

Used extensively across `commands.ts` and `index.ts`:

```ts
ctx.ui.notify(message, level)          // "info" | "warning" | "error"
ctx.ui.setHeader(renderFn)             // branded GSD header
ctx.ui.setStatus("gsd-auto", status)   // "auto" | "paused" | "next" | undefined
ctx.ui.setWidget("gsd-progress", ...)  // progress widget
ctx.ui.setFooter(renderFn | undefined) // hide/show footer
ctx.ui.custom<T>(factory, opts)        // custom overlays (dashboard, visualizer)
ctx.ui.theme                           // theming (fg, bold, etc.)
```

### 4.2 `ctx.newSession()` — session management

Critical for auto-mode. Each unit of work gets a fresh session:

```ts
// auto-loop.ts runUnit()
const sessionPromise = s.cmdCtx!.newSession().finally(() => {
  s.sessionSwitchInFlight = false;
});
```

Returns `{ cancelled: boolean }`. Used with a timeout race:

```ts
const timeoutPromise = new Promise<{ cancelled: true }>((resolve) => {
  sessionTimeoutHandle = setTimeout(() => resolve({ cancelled: true }), NEW_SESSION_TIMEOUT_MS);
});
sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
```

### 4.3 `ctx.hasUI` — TUI availability check

```ts
if (!ctx.hasUI) {
  ctx.ui.notify("Visualizer requires an interactive terminal.", "warning");
  return;
}
```

### 4.4 `ctx.getContextUsage()` — context window monitoring

```ts
const contextUsage = s.cmdCtx.getContextUsage();
if (contextUsage && contextUsage.percent !== null && contextUsage.percent >= contextThreshold) {
  // pause auto-mode
}
```

### 4.5 `ctx.model` / `ctx.modelRegistry` — model access

```ts
const currentModelId = ctx.model?.id;
const currentProvider = ctx.model?.provider;
const availableModels = ctx.modelRegistry.getAvailable();
const original = ctx.modelRegistry.find(provider, id);
```

### 4.6 `ctx.sessionManager` — session file access

```ts
const sessionFile = ctx.sessionManager?.getSessionFile() ?? null;
```

---

## 5. `pi.sendMessage()` Usage

Used to inject messages into the conversation that trigger LLM turns.

### 5.1 Auto-mode unit dispatch (the primary pattern)

```ts
// auto-loop.ts runUnit()
pi.sendMessage(
  { customType: "gsd-auto", content: prompt, display: s.verbose },
  { triggerTurn: true },
);
```

### 5.2 Error recovery / retry

```ts
// index.ts — transient network error retry
pi.sendMessage(
  { customType: "gsd-auto-timeout-recovery", content: "Continue execution -- retrying after transient network error.", display: false },
  { triggerTurn: true },
);
```

### 5.3 Model fallback resume

```ts
// index.ts — after pi.setModel() succeeds with fallback
pi.sendMessage(
  { customType: "gsd-auto-timeout-recovery", content: "Continue execution.", display: false },
  { triggerTurn: true },
);
```

### 5.4 Hook dispatch

```ts
// auto.ts dispatchHookUnit()
pi.sendMessage(
  { customType: "gsd-auto", content: hookPrompt, display: true },
  { triggerTurn: true },
);
```

### 5.5 Parallel orchestration status messages

```ts
// commands.ts — parallel subcommands
pi.sendMessage({ customType: "gsd-parallel", content: report, display: false });
```

### Message shape

All messages follow: `{ customType: string, content: string, display: boolean }` with optional second arg `{ triggerTurn: true }` to start an agent turn.

---

## 6. `ctx.newSession()` Usage

Called exclusively via `s.cmdCtx!.newSession()` where `s.cmdCtx` is the stashed `ExtensionCommandContext`.

### 6.1 Auto-loop unit execution (`auto-loop.ts`)

```ts
export async function runUnit(ctx, pi, s, unitType, unitId, prompt, _prefs): Promise<UnitResult> {
  s.sessionSwitchInFlight = true;
  try {
    const sessionPromise = s.cmdCtx!.newSession().finally(() => {
      s.sessionSwitchInFlight = false;
    });
    const timeoutPromise = new Promise<{ cancelled: true }>((resolve) => {
      sessionTimeoutHandle = setTimeout(() => resolve({ cancelled: true }), NEW_SESSION_TIMEOUT_MS);
    });
    sessionResult = await Promise.race([sessionPromise, timeoutPromise]);
  } catch { ... }
  if (sessionResult.cancelled) return { status: "cancelled" };
  // ... then send prompt via pi.sendMessage
}
```

### 6.2 Hook dispatch (`auto.ts`)

```ts
const result = await s.cmdCtx!.newSession();
if (result.cancelled) {
  await stopAuto(ctx, pi);
  return false;
}
```

### Session switch tracking

The `isSessionSwitchInFlight()` flag prevents the `agent_end` handler from processing events from the old session during the switch:

```ts
// index.ts agent_end handler
if (isSessionSwitchInFlight()) {
  return; // ignore stale agent_end from previous session
}
```

---

## 7. Event Listeners (`pi.on`)

### 7.1 `session_start`

Clears per-session state, renders branded GSD header, loads tool API keys, checks remote questions status.

```ts
pi.on("session_start", async (_event, ctx) => {
  depthVerificationDone = false;
  // Render ASCII logo header
  ctx.ui.setHeader((_ui, _theme) => new Text(headerContent, 1, 0));
  // Load API keys
  loadToolApiKeys();
  // Check remote questions status
  ctx.ui.notify(status, ...);
});
```

### 7.2 `before_agent_start`

Injects GSD system context into the system prompt. This is the main prompt engineering hook.

```ts
pi.on("before_agent_start", async (event, ctx: ExtensionContext) => {
  // Only for GSD projects
  if (!existsSync(join(process.cwd(), ".gsd"))) return;

  const systemContent = loadPrompt("system");
  // ... loads preferences, knowledge, memories, skills, agent instructions, worktree context

  const fullSystem = `${event.systemPrompt}\n\n[SYSTEM CONTEXT -- GSD]\n\n${systemContent}${preferenceBlock}...`;

  return {
    systemPrompt: fullSystem,
    ...(injection ? {
      message: {
        customType: "gsd-guided-context",
        content: injection,
        display: false,
      },
    } : {}),
  };
});
```

Returns object with `systemPrompt` override and optional injected `message`.

### 7.3 `agent_end`

Handles auto-mode advancement after each agent turn completes.

```ts
pi.on("agent_end", async (event, ctx: ExtensionContext) => {
  // 1. Check if discuss phase just finished -> start auto
  if (checkAutoStartAfterDiscuss()) { ... return; }

  // 2. Skip if not in auto-mode
  if (!isAutoActive()) return;

  // 3. Skip stale events during session switch
  if (isSessionSwitchInFlight()) return;

  // 4. Handle abort (Escape pressed) -> pause
  if (lastMsg.stopReason === "aborted") { await pauseAuto(ctx, pi); return; }

  // 5. Handle errors -> network retry / model fallback / provider error pause
  if (lastMsg.stopReason === "error") {
    // Transient network retry (up to 2 retries with backoff)
    // Model fallback chain (pi.setModel + pi.sendMessage to resume)
    // Session model recovery
    // Provider error classification (transient vs permanent)
    ...
  }

  // 6. Normal completion -> resolve the autoLoop promise
  resolveAgentEnd(event);
});
```

### 7.4 `session_before_compact`

Blocks compaction during auto-mode. Saves `continue.md` if actively executing a task.

```ts
pi.on("session_before_compact", async (_event, _ctx: ExtensionContext) => {
  if (isAutoActive() || isAutoPaused()) return { cancel: true };
  // Save continue.md for active tasks
  ...
});
```

### 7.5 `session_shutdown`

Saves activity log on Ctrl+C/SIGTERM. Shuts down parallel workers if active.

```ts
pi.on("session_shutdown", async (_event, ctx: ExtensionContext) => {
  if (isParallelActive()) await shutdownParallel(process.cwd());
  if (!isAutoActive() && !isAutoPaused()) return;
  saveActivityLog(ctx, dash.basePath, dash.currentUnit.type, dash.currentUnit.id);
});
```

### 7.6 `tool_call`

Write-gate: blocks CONTEXT.md writes during discussion phase without depth verification.

```ts
pi.on("tool_call", async (event) => {
  if (!isToolCallEventType("write", event)) return;
  const result = shouldBlockContextWrite(
    event.toolName, event.input.path,
    getDiscussionMilestoneId(), isDepthVerified(), activeQueuePhase,
  );
  if (result.block) return result;
});
```

### 7.7 `tool_result`

Monitors `ask_user_questions` tool results for depth verification gate and persists discussion exchanges to DISCUSSION.md.

```ts
pi.on("tool_result", async (event) => {
  if (event.toolName !== "ask_user_questions") return;
  // Check for depth_verification question ID
  for (const q of questions) {
    if (q.id.includes("depth_verification")) {
      depthVerificationDone = true;
      break;
    }
  }
  // Persist Q&A exchange to DISCUSSION.md
  await saveFile(discussionPath, existing + newBlock);
});
```

### 7.8 `tool_execution_start` / `tool_execution_end`

Tracks in-flight tools for idle detection during auto-mode.

```ts
pi.on("tool_execution_start", async (event) => {
  if (!isAutoActive()) return;
  markToolStart(event.toolCallId);
});

pi.on("tool_execution_end", async (event) => {
  markToolEnd(event.toolCallId);
});
```

---

## 8. UI Interactions (`ctx.ui.*`)

### 8.1 Notifications

Used ubiquitously for user feedback:
```ts
ctx.ui.notify("Auto-mode stopped.", "info");
ctx.ui.notify("Budget ceiling reached.", "warning");
ctx.ui.notify("Session lock lost.", "error");
```

### 8.2 Header (branded logo)

```ts
ctx.ui.setHeader((_ui, _theme) => new Text(headerContent, 1, 0));
```

Renders the ASCII art GSD logo with version on session start.

### 8.3 Status bar

```ts
ctx.ui.setStatus("gsd-auto", "auto");     // running
ctx.ui.setStatus("gsd-auto", "paused");   // paused
ctx.ui.setStatus("gsd-auto", "next");     // step mode
ctx.ui.setStatus("gsd-auto", undefined);  // clear
```

### 8.4 Progress widget

```ts
ctx.ui.setWidget("gsd-progress", widgetData);
ctx.ui.setWidget("gsd-progress", undefined);  // clear
```

### 8.5 Footer

```ts
ctx.ui.setFooter(hideFooter);     // hide during auto-mode
ctx.ui.setFooter(undefined);      // restore default
```

### 8.6 Custom overlays (TUI)

Dashboard overlay:
```ts
await ctx.ui.custom<void>(
  (tui, theme, _kb, done) => {
    return new GSDDashboardOverlay(tui, theme, () => done());
  },
  { overlay: true, overlayOptions: { width: "90%", minWidth: 80, maxHeight: "92%", anchor: "center" } },
);
```

Visualizer overlay:
```ts
await ctx.ui.custom<void>(
  (tui, theme, _kb, done) => {
    return new GSDVisualizerOverlay(tui, theme, () => done());
  },
  { overlay: true, overlayOptions: { width: "80%", minWidth: 80, maxHeight: "90%", anchor: "center" } },
);
```

### 8.7 Theme access

```ts
const theme = ctx.ui.theme;
theme.fg("accent", line)   // colored text
theme.fg("dim", text)      // dimmed text
theme.bold("Get Shit Done") // bold text
```

### 8.8 Keyboard shortcut

```ts
pi.registerShortcut(Key.ctrlAlt("g"), {
  description: shortcutDesc("Open GSD dashboard", "/gsd status"),
  handler: async (ctx) => {
    await ctx.ui.custom<void>(...);  // opens dashboard overlay
  },
});
```

---

## 9. `pi.setModel()` Usage

Used for model switching during auto-mode:

```ts
// Model fallback on error
const ok = await pi.setModel(modelToSet, { persist: false });

// Restore original model on stop
if (original) await pi.setModel(original);

// Hook model override
await pi.setModel(match);
```

The `{ persist: false }` option prevents writing to global settings, avoiding cross-session model bleed.

---

## 10. Auto-mode Architecture Summary

### `auto.ts` — State machine + public API

- `AutoSession` class holds all mutable state (single `const s = new AutoSession()`)
- `startAuto()` — entry point, handles resume vs fresh start
- `stopAuto()` / `pauseAuto()` — cleanup and state teardown
- `getAutoDashboardData()` — read-only state snapshot for UI

### `auto-loop.ts` — Linear execution loop

- `autoLoop()` — while loop: derive state -> dispatch -> guards -> runUnit -> finalize -> repeat
- `runUnit()` — creates fresh session, sends prompt, awaits `agent_end` promise
- `resolveAgentEnd()` — bridge from `agent_end` event to loop promise resolution
- MAX_LOOP_ITERATIONS = 500 safety limit

### `auto-dispatch.ts` — Declarative dispatch table

Rule-based dispatch: first matching rule wins. Rules map GSD state phases to unit types:

| Phase | Unit Type |
|-------|-----------|
| `pre-planning` (no research) | `research-milestone` |
| `pre-planning` (has research) | `plan-milestone` |
| `planning` (no research) | `research-slice` |
| `planning` | `plan-slice` |
| `replanning-slice` | `replan-slice` |
| `executing` | `execute-task` |
| `summarizing` | `complete-slice` |
| `validating-milestone` | `validate-milestone` |
| `completing-milestone` | `complete-milestone` |
| `complete` | stop |

Plus override gates: `rewrite-docs`, `run-uat`, `reassess-roadmap`.

### `commands.ts` — Command router

Mega-router for `/gsd <subcommand>`. Pure dispatch logic -- each subcommand delegates to a dedicated handler module. Tab completion via `getArgumentCompletions` with nested subcommand support.

---

## 11. Key Integration Patterns

### Pattern: Fresh session per unit
Each auto-mode unit gets `ctx.newSession()` -> `pi.sendMessage()` -> await `agent_end`. This prevents context buildup across units.

### Pattern: Event bridge via promise
The `agent_end` event handler resolves a promise that `runUnit()` awaits. Queue handles events arriving between iterations.

### Pattern: Dynamic cwd tools
All built-in tools (bash, write, read, edit) are wrapped to re-evaluate `process.cwd()` on every call, enabling worktree switching via `process.chdir()`.

### Pattern: Write gate
The `tool_call` hook intercepts write operations to block premature CONTEXT.md writes during discussion phases.

### Pattern: System prompt injection
The `before_agent_start` hook concatenates GSD-specific context (system prompt, preferences, knowledge, memories, skills, worktree context) onto the base system prompt.
