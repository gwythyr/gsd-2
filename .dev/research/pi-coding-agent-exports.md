# pi-coding-agent Full Export Map

Source: `/home/user/gsd-2/packages/pi-coding-agent/src/index.ts` (375 lines)

## Categories of Exports

### 1. Core Session Management
- `AgentSession`, `AgentSessionConfig`, `AgentSessionEvent`, `AgentSessionEventListener`
- `ModelCycleResult`, `ParsedSkillBlock`, `PromptOptions`, `parseSkillBlock`, `SessionStats`
- Source: `./core/agent-session.js`

### 2. Auth & Models
- `AuthStorage`, `AuthStorageBackend`, `FileAuthStorageBackend`, `InMemoryAuthStorageBackend`
- `ApiKeyCredential`, `AuthCredential`, `OAuthCredential`
- Source: `./core/auth-storage.js`
- `ModelRegistry` from `./core/model-registry.js`
- `ModelDiscoveryCache`, `DiscoveredModel`, `DiscoveryResult`, `ProviderDiscoveryAdapter`
- `getDiscoverableProviders`, `getDiscoveryAdapter`

### 3. Extension System (CRITICAL - 70+ usages of ExtensionAPI)
Types: `Extension`, `ExtensionAPI`, `ExtensionCommandContext`, `ExtensionContext`, `ExtensionFactory`, `ExtensionRuntime`, `ExtensionActions`, `ExtensionContextActions`, `ExtensionCommandContextActions`, `ExtensionUIContext`, `ExtensionUIDialogOptions`, `ExtensionWidgetOptions`, `ExtensionError`, `ExtensionEvent`, `ExtensionFlag`, `ExtensionHandler`, `ExtensionShortcut`

Events: `AgentEndEvent`, `AgentStartEvent`, `AgentToolResult`, `AgentToolUpdateCallback`, `AppAction`, `BashToolCallEvent`, `BeforeAgentStartEvent`, `BeforeProviderRequestEvent`, `BeforeProviderRequestEventResult`, `CompactOptions`, `ContextEvent`, `ContextUsage`, `CustomToolCallEvent`, `EditToolCallEvent`, `ExecOptions`, `ExecResult`, `FindToolCallEvent`, `GrepToolCallEvent`, `InputEvent`, `InputEventResult`, `InputSource`, `LsToolCallEvent`, `ReadToolCallEvent`, `RegisteredCommand`, `RegisteredTool`, `SessionBeforeCompactEvent`, `SessionBeforeForkEvent`, `SessionBeforeSwitchEvent`, `SessionBeforeTreeEvent`, `SessionCompactEvent`, `SessionForkEvent`, `SessionShutdownEvent`, `SessionStartEvent`, `SessionSwitchEvent`, `SessionTreeEvent`, `ToolCallEvent`, `ToolDefinition`, `ToolInfo`, `ToolResultEvent`, `ToolRenderResultOptions`, `TurnEndEvent`, `TurnStartEvent`, `UserBashEvent`, `UserBashEventResult`, `WriteToolCallEvent`

Other: `KeybindingsManager`, `LoadExtensionsResult`, `MessageRenderer`, `MessageRenderOptions`, `ProviderConfig`, `ProviderModelConfig`, `SlashCommandInfo`, `SlashCommandLocation`, `SlashCommandSource`, `TerminalInputHandler`, `WidgetPlacement`

Functions: `createExtensionRuntime`, `discoverAndLoadExtensions`, `ExtensionRunner`, `importExtensionModule`, `isBashToolResult`, `isEditToolResult`, `isFindToolResult`, `isGrepToolResult`, `isLsToolResult`, `isReadToolResult`, `isToolCallEventType`, `isWriteToolResult`, `wrapRegisteredTool`, `wrapRegisteredTools`, `wrapToolsWithExtensions`, `wrapToolWithExtensions`

Source: `./core/extensions/index.js`

### 4. Compaction
- `compact`, `shouldCompact`, `estimateTokens`, `calculateContextTokens`, `findCutPoint`, `findTurnStartIndex`
- `collectEntriesForBranchSummary`, `generateBranchSummary`, `generateSummary`, `serializeConversation`
- `prepareBranchEntries`, `getLastAssistantUsage`, `DEFAULT_COMPACTION_SETTINGS`
- Source: `./core/compaction/index.js`

### 5. Session Manager
- `SessionManager`, `SessionInfo`, `SessionEntry`, `SessionHeader`, `SessionContext`
- Various entry types: `FileEntry`, `ModelChangeEntry`, `CompactionEntry`, `CustomEntry`, etc.
- `buildSessionContext`, `parseSessionEntries`, `migrateSessionEntries`
- Source: `./core/session-manager.js`

### 6. SDK / Session Factory
- `createAgentSession`, `CreateAgentSessionOptions`, `CreateAgentSessionResult`
- Tool factories: `createBashTool`, `createCodingTools`, `createEditTool`, `createFindTool`, `createGrepTool`, `createLsTool`, `createReadTool`, `createWriteTool`, `createReadOnlyTools`
- `readOnlyTools`, `PromptTemplate`
- Source: `./core/sdk.js`

### 7. Run Modes
- `InteractiveMode`, `InteractiveModeOptions`
- `runPrintMode`, `PrintModeOptions`
- `runRpcMode`
- `ModelInfo`, `RpcClient`, `RpcClientOptions`, `RpcEventListener`, `RpcCommand`, `RpcResponse`, `RpcSessionState`
- Source: `./modes/index.js`
- `attachJsonlLineReader`, `serializeJsonLine` from `./modes/rpc/jsonl.js`

### 8. Tools
- Full tool implementations: `bashTool`, `editTool`, `readTool`, `writeTool`, `findTool`, `grepTool`, `lsTool`
- Tool options/types for each
- Hashline variants
- Utilities: `truncateHead`, `truncateLine`, `truncateTail`, `formatSize`, `DEFAULT_MAX_BYTES`, `DEFAULT_MAX_LINES`
- Bash interceptors: `BashInterceptorRule`, `checkBashInterception`, `DEFAULT_BASH_INTERCEPTOR_RULES`, `compileInterceptor`
- Source: `./core/tools/index.js`

### 9. UI Components (for interactive mode)
- Many components: `AssistantMessageComponent`, `BashExecutionComponent`, `FooterComponent`, `ToolExecutionComponent`, `UserMessageComponent`, `ModelSelectorComponent`, `SessionSelectorComponent`, etc.
- `renderDiff`, `RenderDiffOptions`
- Source: `./modes/interactive/components/index.js`

### 10. Theme
- `Theme`, `ThemeColor`, `initTheme`, `getMarkdownTheme`, `highlightCode`, etc.
- Source: `./modes/interactive/theme/theme.js`

### 11. Settings
- `SettingsManager`, `AsyncSettings`, `CompactionSettings`, `ImageSettings`, `MemorySettings`, `PackageSource`, `RetrySettings`, `TaskIsolationSettings`
- Source: `./core/settings-manager.js`

### 12. Utilities
- `parseFrontmatter`, `stripFrontmatter` from `./utils/frontmatter.js`
- `getShellConfig`, `sanitizeCommand` from `./utils/shell.js`
- `toPosixPath` from `./utils/path-display.js`
- `copyToClipboard` from `./utils/clipboard.js`

### 13. Other
- `EventBus`, `EventBusController`, `createEventBus` from `./core/event-bus.js`
- `BlobStore`, `ArtifactManager` (storage)
- `DefaultResourceLoader` (resource loading)
- `DefaultPackageManager` (package management)
- Skills system: `loadSkills`, `Skill`, `SkillFrontmatter`
- `main` from `./main.js`
- `ReadonlyFooterDataProvider`
- `getAgentDir`, `VERSION` from `./config.js`

## Key Adapter Priorities

1. **ExtensionAPI + ExtensionCommandContext** — 70+39 usages, every extension depends on these
2. **createAgentSession / InteractiveMode** — session lifecycle
3. **SessionManager** — session persistence
4. **ModelRegistry / ModelInfo** — model selection
5. **Tool system** — ToolDefinition, RegisteredTool
6. **AuthStorage** — can be simplified to no-op
7. **Event system** — EventBus for tool/session events
8. **UI Components** — for interactive mode rendering
