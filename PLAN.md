# GSD v2 → Claude Code SDK: Adapter Architecture Specification

**Author:** Viktor (HebronSoft)
**Date:** March 19, 2026
**Status:** Draft / Proposal
**Base repo:** `gsd-build/gsd-2` (fork)

---

## 1. Executive Summary

GSD v2 ("Get Shit Done") is a powerful spec-driven development framework built on the Pi SDK that provides context engineering, autonomous execution, and verification-driven workflows for AI coding agents. While the workflow design is excellent, the Pi SDK dependency introduces friction: legal ambiguity around Claude Max subscription usage via OAuth, module resolution issues with the Pi ecosystem, and an unnecessary abstraction layer between GSD and Claude Code.

This document proposes **replacing the Pi SDK integration with Claude Code SDK** while keeping everything else intact — the TUI, state machine, git strategy, verification model, prompt builders, and all `.gsd/` file handling. The approach uses an **adapter pattern**: implementing the same interfaces that GSD's extensions and core expect from Pi SDK, but delegating to Claude Code SDK primitives underneath.

### Why This Matters

- **Subscription legitimacy**: Running inside Claude Code's own SDK eliminates ToS gray areas around OAuth token extraction
- **Reduced dependency chain**: Pi SDK → Claude Code SDK removes one layer of abstraction
- **Native ecosystem access**: MCP servers, CLAUDE.md, `.claude/` conventions work as first-class citizens
- **Reliability**: No module resolution issues (`@mariozechner/*` vs `@gsd/*` package conflicts disappear)
- **Community alignment**: The original GSD v1 (35k+ stars) was Claude Code-native; this restores that alignment

---

## 2. Current Architecture Analysis

### 2.1 Pi SDK Package Dependencies

GSD v2 imports from 4 Pi SDK packages across 193 import lines:

| Package | Import Count | Role |
|---------|-------------|------|
| `@gsd/pi-coding-agent` | 148 | Core — sessions, extensions, tools, auth, settings, UI components |
| `@gsd/pi-tui` | 29 | Terminal UI — Text, Key, Editor, matchesKey, truncateToWidth |
| `@gsd/pi-ai` | 15 | Model/AI types — StringEnum, Message, AssistantMessage, Api |
| `@gsd/pi-agent-core` | 1 | AgentToolResult type only |

### 2.2 Imported Symbols from `@gsd/pi-coding-agent` (top by frequency)

| Symbol | Occurrences | Category |
|--------|------------|----------|
| `ExtensionAPI` | 70 | Extension system |
| `ExtensionCommandContext` | 39 | Extension system |
| `ExtensionContext` | 22 | Extension system |
| `Theme` | 11 | UI theming |
| `AuthStorage` | 8 | Authentication |
| `getAgentDir` | 6 | Path resolution |
| `importExtensionModule` | 5 | Extension loading |
| `ToolDefinition` | 3 | Tool registration |
| `truncateHead` | 3 | Text utilities |
| `RpcClient` | 2 | RPC communication |
| `serializeJsonLine` | 2 | JSONL serialization |
| `DefaultResourceLoader` | 1 | Resource management |
| `SettingsManager` | 1 | Settings |
| `SessionManager` | (via cli.ts) | Session lifecycle |
| `createAgentSession` | (via cli.ts) | Session factory |
| `InteractiveMode` | (via cli.ts) | TUI main loop |
| `ModelRegistry` | (via cli.ts) | Model management |

### 2.3 Imported Symbols from `@gsd/pi-tui` (all)

| Symbol | Occurrences | Category |
|--------|------------|----------|
| `truncateToWidth` | 12 | Text formatting |
| `Text` | 11 | TUI component |
| `Key` | 11 | Key handling |
| `matchesKey` | 9 | Key matching |
| `visibleWidth` | 8 | Width calculation |
| `TUI` | 3 | TUI instance type |
| `wrapTextWithAnsi` | 2 | ANSI formatting |
| `Editor` / `EditorTheme` | 2 each | Text editing |
| `CURSOR_MARKER` | 2 | Cursor rendering |
| `Container`, `Markdown`, `Spacer` | 1 each | TUI components |
| `AutocompleteItem` | 1 | Autocomplete |
| `isKeyRelease` | 1 | Input handling |

### 2.4 Imported Symbols from `@gsd/pi-ai`

| Symbol | Occurrences | Category |
|--------|------------|----------|
| `StringEnum` | 10 | Schema/validation |
| `AssistantMessage` | 2 | Message types |
| `Message` | 1 | Message types |
| `Api` | 1 | API abstraction |
| `Model` | 1 | Model type |
| `AssistantMessageEvent` | 1 | Event types |
| `getEnvApiKey` | 1 | Auth utility |

### 2.5 Key Integration Points

#### Session Lifecycle (Critical Path)

```
cli.ts:
  AuthStorage.create() → auth credentials
  ModelRegistry → model selection
  SettingsManager → configuration
  SessionManager.create()/continueRecent() → session persistence
  createAgentSession({auth, models, settings, session, resources}) → session object
  InteractiveMode(session).run() → main TUI loop

Auto mode dispatch:
  ctx.newSession() → fresh context (clears accumulated state)
  pi.sendMessage({content: prompt}, {triggerTurn: true}) → dispatch prompt

Subagent spawning:
  spawn(process.execPath, [process.env.GSD_BIN_PATH, ...extensions, ...args])
  → child_process running `gsd --print --mode json "Task: ..."` 
  → reads JSON events from stdout (message_end, tool_result_end)
  → collects messages, usage stats, stop reason
```

#### Extension Registration Pattern

Every GSD extension follows this pattern:

```typescript
import type { ExtensionAPI, ExtensionCommandContext } from "@gsd/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  // Register commands
  pi.registerCommand({
    name: "/gsd auto",
    description: "...",
    handler: async (ctx: ExtensionCommandContext) => {
      // ctx.ui.notify() — show notifications
      // ctx.ui.setStatus() — update status bar
      // ctx.ui.setWidget() — dashboard overlays
      // ctx.newSession() — fresh context
      // pi.sendMessage() — dispatch prompt
      // pi.setModel() — switch model
      // ctx.modelRegistry — available models
    }
  });

  // Register tools
  pi.registerTool({
    name: "tool_name",
    description: "...",
    input_schema: { ... },
    handler: async (input, ctx) => {
      return { result: "..." };
    }
  });
}
```

### 2.6 What Does NOT Touch Pi SDK (Zero Changes Needed)

These components are pure file I/O and logic — completely SDK-agnostic:

- **State machine**: `deriveState()`, `resolveDispatch()`, phase transitions — all read `.gsd/` files
- **File system**: All `.gsd/` file handling — `STATE.md`, `DECISIONS.md`, roadmaps, slice/task plans, summaries
- **Prompt builders**: `auto-prompts.ts` — `buildResearchSlicePrompt()`, `buildExecuteTaskPrompt()`, etc.
- **Path resolution**: `paths.ts` — `resolveMilestoneFile()`, `resolveSliceFile()`, etc.
- **Roadmap parsing**: `files.ts` — `parseRoadmap()`, `loadFile()`, frontmatter parsing
- **Git strategy**: Branch-per-slice, squash merge, atomic commits
- **Preferences**: `.gsd/preferences.md`, model routing, budget ceilings
- **Verification model**: Must-haves (truths, artifacts, key links), UAT scripts
- **Metrics/cost tracking**: Token usage, cost ledger, projections
- **Stuck detection**: Retry logic, diagnostic generation
- **Crash recovery**: Lock files, session forensics
- **Migration tooling**: v1 `.planning/` → v2 `.gsd/` converter

---

## 3. Adapter Architecture

### 3.1 Design Principle

Create a `@gsd/claude-code-adapter` package that **re-exports the same interface shapes** as `@gsd/pi-coding-agent` but delegates to Claude Code SDK. GSD's extensions and core code continue importing from the same paths — only the underlying implementation changes.

```
Before:
  GSD extensions → @gsd/pi-coding-agent → Pi SDK → (spawns pi process)

After:
  GSD extensions → @gsd/claude-code-adapter → Claude Code SDK → (spawns claude process)
```

### 3.2 Package Mapping

| Current Package | Adapter Strategy |
|----------------|-----------------|
| `@gsd/pi-coding-agent` | **Replace** with `@gsd/claude-code-adapter` — implements same interfaces |
| `@gsd/pi-tui` | **Keep as-is** — TUI layer is SDK-agnostic |
| `@gsd/pi-ai` | **Thin shim** — re-export types, map model/message types to Claude SDK equivalents |
| `@gsd/pi-agent-core` | **Trivial** — only `AgentToolResult` type, define locally |

### 3.3 Interface Contracts to Implement

#### 3.3.1 ExtensionAPI (70 usages — highest priority)

The `ExtensionAPI` interface is what every extension receives on initialization. Key methods used by GSD:

```typescript
interface ExtensionAPI {
  // Message dispatch — CRITICAL for auto mode
  sendMessage(message: { customType?: string; content: string; display?: boolean }, 
              options?: { triggerTurn?: boolean }): void;
  
  // Model management
  setModel(model: ModelInfo): Promise<void>;
  
  // Command registration
  registerCommand(cmd: {
    name: string;
    description: string;
    handler: (ctx: ExtensionCommandContext) => Promise<void>;
    argHint?: string;
  }): void;
  
  // Tool registration
  registerTool(tool: ToolDefinition): void;
  
  // Event listeners
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}
```

**Claude Code SDK mapping:**
- `sendMessage()` → pipe content into Claude Code session via SDK's message API
- `setModel()` → Claude Code SDK model selection (or `--model` flag on subprocess)
- `registerCommand()` → Claude Code slash command registration
- `registerTool()` → MCP tool registration or Claude Code native tool API

#### 3.3.2 ExtensionCommandContext (39 usages)

```typescript
interface ExtensionCommandContext {
  // Session lifecycle — CRITICAL for fresh contexts
  newSession(): Promise<{ cancelled: boolean }>;
  
  // UI namespace
  ui: {
    notify(message: string, level: "info" | "warning" | "error"): void;
    setStatus(key: string, value: string | undefined): void;
    setWidget(key: string, widget: any | undefined): void;
    setFooter(content: any | undefined): void;
  };
  
  // Model access
  modelRegistry: {
    find(provider: string, id: string): ModelInfo | undefined;
    getAvailable(): ModelInfo[];
  };
  
  // Arguments
  args?: string;
}
```

**Claude Code SDK mapping:**
- `newSession()` → spawn new `claude` subprocess (exactly what subagent already does)
- `ui.notify()` → stderr output with chalk formatting (already how GSD does non-TUI notifications)
- `ui.setStatus()` / `setWidget()` / `setFooter()` → TUI layer (kept from pi-tui, no change needed)
- `modelRegistry` → hardcoded Claude model list or read from Claude Code SDK config

#### 3.3.3 ExtensionContext (22 usages)

```typescript
interface ExtensionContext {
  // Subset of ExtensionCommandContext — used for lifecycle hooks
  ui: ExtensionUIContext;
  session: SessionInfo;
}
```

#### 3.3.4 Session Lifecycle (cli.ts)

```typescript
// Current Pi SDK flow:
const { session } = await createAgentSession({
  authStorage, modelRegistry, settingsManager, sessionManager, resourceLoader
});
const interactiveMode = new InteractiveMode(session);
await interactiveMode.run();

// Claude Code SDK equivalent:
// Auth: handled by Claude Code subscription (no AuthStorage needed)
// Models: Claude's own model list
// Settings: reuse GSD's SettingsManager (file-based, SDK-agnostic)
// Sessions: reuse GSD's SessionManager (JSONL files, SDK-agnostic)
// Resources: reuse GSD's ResourceLoader (markdown files, SDK-agnostic)
```

#### 3.3.5 Subagent Spawning (the real execution engine)

Current implementation in `src/resources/extensions/subagent/index.ts`:

```typescript
// Current: spawns GSD itself as a child process
const proc = spawn(
  process.execPath,
  [process.env.GSD_BIN_PATH!, ...extensionArgs, ...args],
  { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] }
);
// Reads JSON events from stdout: message_end, tool_result_end
```

**Claude Code SDK equivalent:**

```typescript
// New: spawns `claude` CLI in print mode
const proc = spawn(
  "claude",
  ["--print", "--model", model, "--output-format", "json", task],
  { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] }
);
// Claude Code SDK outputs JSON events in compatible format
```

This is the **single most impactful change** — swapping the subprocess binary from `gsd` (Pi-based) to `claude` (native). The event parsing logic (reading JSONL from stdout) likely needs minor adjustments for Claude Code's output format vs Pi's, but the architecture is identical.

### 3.4 Auth Layer Simplification

Current Pi SDK auth flow:
```
AuthStorage.create() → reads ~/.gsd/auth.json
→ supports 20+ providers (Anthropic, OpenAI, Google, OpenRouter, ...)
→ OAuth flow for Max/Copilot subscriptions
→ API key storage for others
```

Claude Code SDK auth:
```
Claude Code handles auth natively
→ Max subscription: already authenticated
→ API key: ANTHROPIC_API_KEY env var
→ No AuthStorage needed
→ No onboarding wizard for provider selection
```

This eliminates: `onboarding.ts` (34K), `wizard.ts`, `pi-migration.ts`, provider selection UI, OAuth flow handling, and the entire multi-provider architecture. For multi-model support (using different models for research vs execution), Claude Code SDK's `--model` flag handles it.

---

## 4. Implementation Plan

### Phase 1: Adapter Package Skeleton

**Goal:** Create `@gsd/claude-code-adapter` with interface stubs that match Pi SDK signatures.

1. Define TypeScript interfaces matching all imported types from `@gsd/pi-coding-agent`
2. Create stub implementations that throw "not implemented" errors
3. Update `tsconfig.json` path mappings: `@gsd/pi-coding-agent` → `@gsd/claude-code-adapter`
4. Verify the project compiles with stubs (all existing code resolves imports)

**Files to create:**
```
packages/claude-code-adapter/
  src/
    index.ts              — re-exports everything
    types/
      extension-api.ts    — ExtensionAPI, ExtensionContext, ExtensionCommandContext
      tools.ts            — ToolDefinition, AgentToolResult
      session.ts          — SessionManager, SessionInfo, SessionEntry types
      model.ts            — ModelRegistry, ModelInfo
      auth.ts             — AuthStorage (simplified or no-op)
      settings.ts         — SettingsManager (reuse existing, SDK-agnostic)
      theme.ts            — Theme, ThemeColor (pass-through to pi-tui)
    adapters/
      session-adapter.ts  — createAgentSession() → Claude Code SDK
      subagent-adapter.ts — spawn claude subprocess instead of gsd
      extension-runtime.ts — Extension loading and command registration
      interactive-mode.ts — InteractiveMode wrapping Claude Code session
    utils/
      frontmatter.ts      — parseFrontmatter (copy from pi-coding-agent, pure util)
      shell.ts            — getShellConfig, sanitizeCommand (copy, pure util)
      text.ts             — truncateHead, formatSize, DEFAULT_MAX_BYTES/LINES
  package.json
  tsconfig.json
```

### Phase 2: Subagent Adapter (Highest Value)

**Goal:** Replace Pi subprocess spawning with Claude Code CLI subprocess.

This is where 80% of the value lives. The subagent extension spawns child processes for every task — this is the fresh-context-per-task mechanism.

1. Map Pi's `--print --mode json` output format to Claude Code's `--output-format json` format
2. Adapt event parsing (message_end, tool_result_end) for Claude Code's JSON output schema
3. Map `--append-system-prompt` to Claude Code's system prompt injection mechanism
4. Handle `--model` flag passthrough
5. Keep usage/token tracking by parsing Claude Code's usage output

**Key decision:** Does Claude Code SDK's subprocess mode emit JSONL events with the same granularity as Pi? If not, what's the minimal event stream needed for GSD's progress tracking?

### Phase 3: Session Lifecycle Adapter

**Goal:** Implement `createAgentSession()` and `InteractiveMode` against Claude Code SDK.

1. `createAgentSession()` → initialize Claude Code session (auth handled natively)
2. `InteractiveMode` → wrap Claude Code's interactive REPL or implement custom TUI loop using pi-tui
3. `ctx.newSession()` → clear context / start fresh Claude Code session
4. `pi.sendMessage()` → inject message into current Claude Code session

### Phase 4: Extension System Adapter

**Goal:** Make GSD extensions loadable with Claude Code adapter.

1. Implement extension discovery and loading (reuse existing `extension-registry.ts` logic)
2. Implement `registerCommand()` → map to Claude Code slash commands
3. Implement `registerTool()` → map to Claude Code tool definitions or MCP
4. Wire event bus for tool_call, turn_end, session events

### Phase 5: Auth Simplification

**Goal:** Remove multi-provider complexity, use Claude Code native auth.

1. Make `AuthStorage` a no-op or thin wrapper over Claude Code's auth
2. Remove onboarding wizard provider selection
3. Keep API key reading for optional services (Brave Search, Context7, Jina)
4. Simplify model registry to Claude model family only

### Phase 6: Testing and Validation

1. Run GSD's existing 125 regression tests for deriveState → resolveDispatch chain
2. Smoke test: `/gsd` wizard → new project → discuss → plan → auto for a simple project
3. Verify subagent fresh-context isolation works with `claude` subprocess
4. Verify crash recovery with Claude Code subprocess
5. Verify git strategy (branch-per-slice, squash merge) unchanged

---

## 5. Risk Analysis

### 5.1 Claude Code SDK Output Format

**Risk:** Claude Code's JSON output may not match Pi's event stream format exactly.
**Mitigation:** Build a thin event translator in the subagent adapter. The events GSD actually needs are limited: message completion, tool results, usage stats, stop reason.

### 5.2 Claude Code SDK Interactive Session Control

**Risk:** Pi SDK gives programmatic control over the interactive session (inject messages, switch models mid-conversation). Claude Code SDK may not expose the same level of control.
**Mitigation:** Investigate Claude Code SDK's `@anthropic-ai/claude-code` npm package API surface. If insufficient, fall back to subprocess mode for all dispatch (which is already how subagents work).

### 5.3 Anthropic Ships Native Orchestration

**Risk:** Anthropic builds GSD-like orchestration directly into Claude Code within 3-6 months, making this project redundant.
**Mitigation:** The defensible value is in the workflow methodology (spec-driven development, verification model, discuss-plan-execute lifecycle), not the plumbing. Even if Anthropic ships orchestration primitives, the GSD workflow layer on top remains valuable.

### 5.4 Multi-Model Support Loss

**Risk:** Pi SDK supports 20+ providers. Claude Code SDK is Anthropic-only.
**Mitigation:** For most GSD users, Claude models are sufficient (Opus for planning, Sonnet for execution). For users who need multi-provider, the original GSD v2 on Pi SDK remains available. This fork targets Claude Code users specifically.

### 5.5 pi-tui Dependency on Pi Internals

**Risk:** pi-tui may have internal dependencies on pi-coding-agent that create circular references.
**Mitigation:** Audit pi-tui imports. Based on current analysis, pi-tui exports are self-contained terminal primitives (Text, Key, Editor, truncation). If any coupling exists, extract the needed TUI components into a standalone package.

---

## 6. Claude Code SDK Investigation Checklist

Before implementation, these questions need answers:

- [ ] Does `@anthropic-ai/claude-code` SDK expose a programmatic session API (not just CLI subprocess)?
- [ ] What is the JSON output format of `claude --print --output-format json`? What events are emitted?
- [ ] Can you inject a system prompt programmatically per-session?
- [ ] Can you switch models mid-session or per-subprocess?
- [ ] Does `claude` subprocess support `--append-system-prompt` or equivalent?
- [ ] How does Claude Code SDK handle tool registration programmatically?
- [ ] Is there an extension/plugin API for Claude Code comparable to Pi's extension system?
- [ ] What's the subprocess spawning overhead (cold start time) for `claude --print` vs Pi's `gsd --print`?
- [ ] Does Claude Code SDK support JSONL streaming events for progress tracking?
- [ ] How does Claude Code handle concurrent subprocesses (rate limiting, session isolation)?

---

## 7. File-Level Change Impact

### Files That Need Changes

| File | Change Type | Scope |
|------|-----------|-------|
| `src/cli.ts` | *
