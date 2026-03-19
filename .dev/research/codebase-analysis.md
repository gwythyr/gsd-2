# GSD v2 Codebase Analysis Report

## 1. DIRECTORY STRUCTURE

```
/home/user/gsd-2/
├── packages/                 # Pi SDK vendor forks (workspaces)
│   ├── pi-coding-agent/     # Core agent runtime (2.33.1)
│   ├── pi-agent-core/       # Agent state machine (0.57.1)
│   ├── pi-ai/               # Unified LLM API (0.57.1)
│   ├── pi-tui/              # Terminal UI library (0.57.1)
│   └── native/              # Native bindings (grep/fd via libgit2)
├── src/
│   ├── cli.ts               # Main CLI entry point (22.3 KB, 579 lines)
│   ├── loader.ts            # Process startup loader (8.1 KB, 173 lines)
│   ├── resource-loader.ts   # Extension/resource sync (12.7 KB)
│   ├── extension-registry.ts # Extension enable/disable state (7.6 KB)
│   ├── extension-discovery.ts # Extension discovery (2.3 KB)
│   ├── headless.ts          # Headless orchestrator
│   ├── onboarding.ts        # Setup wizard
│   ├── mcp-server.ts        # MCP protocol server
│   ├── worktree-cli.ts      # Git worktree commands
│   ├── resources/
│   │   ├── extensions/      # Bundled extensions (~19 directories)
│   │   │   ├── gsd/         # Core GSD extension (55 KB, 200+ files)
│   │   │   ├── subagent/    # Subagent spawning
│   │   │   ├── bg-shell/    # Background shell sessions
│   │   │   ├── async-jobs/  # Async job execution
│   │   │   ├── browser-tools/ # Playwright integration
│   │   │   └── [11 more...]
│   │   ├── agents/          # Agent definition files
│   │   └── skills/          # Skill packs
│   └── tests/               # Integration tests
├── pkg/                     # Pi SDK config shim (piConfig)
└── native/                  # Native compilation
```

## 2. ENTRY POINT FLOW: loader.ts → cli.ts

### loader.ts (8.1 KB)
1. Fast-path for `--version`, `--help`
2. Environment setup:
   - `PI_PACKAGE_DIR = pkg/`
   - `PI_SKIP_VERSION_CHECK = 1`
   - `GSD_CODING_AGENT_DIR = ~/.gsd/agent/`
   - `GSD_VERSION = "2.33.1"`
   - `GSD_BIN_PATH = /path/to/loader.js`
   - `GSD_BUNDLED_EXTENSION_PATHS` (serialized extension paths)
3. Extension discovery → discoverExtensionEntryPaths()
4. Dynamic import of `cli.js`

### cli.ts (22.3 KB, 579 lines)
**Phase 1**: Version skew check, TTY detection, arg parsing
**Phase 2**: Subcommands (config, update, sessions, headless, worktree)
**Phase 3**: Setup (AuthStorage, ModelRegistry, SettingsManager, onboarding)
**Phase 4**: Print/RPC mode (non-TTY) → createAgentSession() → runPrintMode()
**Phase 5**: Interactive mode (TTY) → createAgentSession() → InteractiveMode().run()

### createAgentSession() signature:
```typescript
createAgentSession({
  authStorage: AuthStorage,
  modelRegistry: ModelRegistry,
  settingsManager: SettingsManager,
  sessionManager: SessionManager,
  resourceLoader: DefaultResourceLoader,
}): Promise<{ session: AgentSession, extensionsResult }>
```

## 3. SUBAGENT SPAWNING

```typescript
const proc = spawn(
  process.execPath,  // node binary
  [process.env.GSD_BIN_PATH!, ...extensionArgs, ...args],
  { cwd, shell: false, stdio: ["ignore", "pipe", "pipe"] }
);
```
- Uses `GSD_BIN_PATH` → spawns `gsd --mode json --print /task`
- Output parsing: JSONL with `message_end` and `tool_result_end` events
- Concurrency: MAX_PARALLEL_TASKS=8, MAX_CONCURRENCY=4

## 4. STATE MACHINE: deriveState()

```typescript
deriveState(basePath: string): GSDState
// Returns:
{
  roadmap: Roadmap | null,
  activeMilestone: {
    id: string, slices: Roadmap, plan: SlicePlan | null,
    currentSlice: RoadmapSliceEntry | null, nextTask: Task | null
  } | null,
  canAutoStart: boolean,
  inDiscussionPhase: boolean
}
```
- Pure file I/O — reads `.gsd/` directory
- Memoized with 100ms TTL
- **SDK-agnostic — no changes needed**

## 5. EXTENSION SYSTEM

Discovery: loader.ts → discoverExtensionEntryPaths() → serialize to env
Loading: importExtensionModule(path) via jiti → Factory(ctx) → Extension
Registration: registerCommand(), registerTool(), event listeners

## 6. ENVIRONMENT VARIABLES

Set by loader.ts: PI_PACKAGE_DIR, PI_SKIP_VERSION_CHECK, GSD_CODING_AGENT_DIR, GSD_VERSION, GSD_BIN_PATH, GSD_WORKFLOW_PATH, GSD_BUNDLED_EXTENSION_PATHS, NODE_PATH
Set by cli.ts: GSD_MILESTONE_LOCK, GSD_PARALLEL_WORKER

## 7. SESSION STORAGE

- Interactive: `~/.gsd/sessions/<safeCwd>/<timestamp>.jsonl`
- Print/RPC: SessionManager.inMemory() (transient)
- Format: JSONL

## 8. CRITICAL ADAPTER REQUIREMENTS

1. **Session Lifecycle**: Intercept createAgentSession(), wrap AgentSession
2. **Extension System**: Hook into resource discovery, extend ExtensionAPI
3. **Subagent Spawning**: Redirect from gsd binary to claude CLI
4. **Tool Wrapping**: Patch tool execution
5. **Event Streaming**: Capture JSONL events
6. **Environment Setup**: Inject custom env vars
7. **TUI Integration**: Provide display primitives
