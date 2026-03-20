/**
 * @gsd/claude-code-adapter
 *
 * Drop-in replacement for @gsd/pi-coding-agent imports.
 * Re-exports all types, stubs, and utility functions that extensions
 * and the GSD CLI depend on.
 */

// ============================================================================
// Config stubs
// ============================================================================

export const VERSION = "0.1.0";

export function getAgentDir(): string {
	return process.env.GSD_CODING_AGENT_DIR || `${process.env.HOME || process.env.USERPROFILE}/.gsd/agent`;
}

// ============================================================================
// Extension system (types + type guards + stubs)
// ============================================================================

export type {
	// Core message/content types
	AgentMessage,
	AgentToolResult,
	AgentToolUpdateCallback,
	AssistantMessage,
	ImageContent,
	Message,
	Model,
	StopReason,
	TextContent,
	ThinkingContent,
	ToolCall,
	ToolResultMessage,
	Usage,
	UserMessage,
	ThinkingLevel,
	// Extension API
	ExtensionAPI,
	ExtensionCommandContext,
	ExtensionCommandContextActions,
	ExtensionContext,
	ExtensionContextActions,
	ExtensionUIContext,
	ExtensionUIDialogOptions,
	ExtensionWidgetOptions,
	// Extension lifecycle
	Extension,
	ExtensionActions,
	ExtensionError,
	ExtensionEvent,
	ExtensionFactory,
	ExtensionFlag,
	ExtensionHandler,
	ExtensionRuntime,
	ExtensionRuntimeState,
	ExtensionShortcut,
	LoadExtensionsResult,
	// Tools
	ToolDefinition,
	ToolInfo,
	ToolRenderResultOptions,
	RegisteredCommand,
	RegisteredTool,
	// Events - Session
	SessionStartEvent,
	SessionShutdownEvent,
	SessionSwitchEvent,
	SessionBeforeSwitchEvent,
	SessionBeforeSwitchResult,
	SessionBeforeForkEvent,
	SessionBeforeForkResult,
	SessionForkEvent,
	SessionBeforeCompactEvent,
	SessionBeforeCompactResult,
	SessionCompactEvent,
	SessionBeforeTreeEvent,
	SessionBeforeTreeResult,
	SessionTreeEvent,
	SessionDirectoryEvent,
	SessionDirectoryResult,
	SessionDirectoryHandler,
	SessionEvent,
	TreePreparation,
	// Events - Agent
	AgentStartEvent,
	AgentEndEvent,
	BeforeAgentStartEvent,
	BeforeAgentStartEventResult,
	BeforeProviderRequestEvent,
	BeforeProviderRequestEventResult,
	ContextEvent,
	ContextEventResult,
	ContextUsage,
	CompactOptions,
	// Events - Turn
	TurnStartEvent,
	TurnEndEvent,
	// Events - Message
	MessageStartEvent,
	MessageUpdateEvent,
	MessageEndEvent,
	// Events - Tool Execution
	ToolExecutionStartEvent,
	ToolExecutionUpdateEvent,
	ToolExecutionEndEvent,
	// Events - Tool Call
	ToolCallEvent,
	ToolCallEventResult,
	ToolResultEvent,
	ToolResultEventResult,
	BashToolCallEvent,
	BashToolResultEvent,
	ReadToolCallEvent,
	ReadToolResultEvent,
	EditToolCallEvent,
	EditToolResultEvent,
	WriteToolCallEvent,
	WriteToolResultEvent,
	GrepToolCallEvent,
	GrepToolResultEvent,
	FindToolCallEvent,
	FindToolResultEvent,
	LsToolCallEvent,
	LsToolResultEvent,
	CustomToolCallEvent,
	CustomToolResultEvent,
	// Events - Model
	ModelSelectEvent,
	ModelSelectSource,
	// Events - User Bash
	UserBashEvent,
	UserBashEventResult,
	// Events - Input
	InputEvent,
	InputEventResult,
	InputSource,
	// Events - Resources
	ResourcesDiscoverEvent,
	ResourcesDiscoverResult,
	// UI
	WidgetPlacement,
	TerminalInputHandler,
	MessageRenderer,
	MessageRenderOptions,
	// Commands
	SlashCommandInfo,
	SlashCommandLocation,
	SlashCommandSource,
	// Exec
	ExecOptions,
	ExecResult,
	// Keybindings
	AppAction,
	KeybindingsManager,
	// Provider
	ProviderConfig,
	ProviderModelConfig,
	// Footer
	ReadonlyFooterDataProvider,
	// Event Bus
	EventBus,
	EventBusController,
} from "./types/extension-api.js";

// Type guards (value exports)
export {
	isBashToolResult,
	isEditToolResult,
	isFindToolResult,
	isGrepToolResult,
	isLsToolResult,
	isReadToolResult,
	isToolCallEventType,
	isWriteToolResult,
} from "./types/extension-api.js";

// ============================================================================
// Event Bus (real implementation)
// ============================================================================

export { createEventBus } from "./types/events.js";

// ============================================================================
// Tool types
// ============================================================================

export type {
	BashToolInput,
	BashToolDetails,
	BashToolOptions,
	ReadToolInput,
	ReadToolDetails,
	ReadToolOptions,
	EditToolInput,
	EditToolDetails,
	EditToolOptions,
	WriteToolInput,
	WriteToolOptions,
	GrepToolInput,
	GrepToolDetails,
	GrepToolOptions,
	FindToolInput,
	FindToolDetails,
	FindToolOptions,
	LsToolInput,
	LsToolDetails,
	LsToolOptions,
	ToolsOptions,
	TruncationOptions,
	TruncationResult,
	BashInterceptorRule,
	CompiledInterceptor,
	BashOperations,
	BashSpawnContext,
	BashSpawnHook,
	EditOperations,
	ReadOperations,
	FindOperations,
	GrepOperations,
	LsOperations,
	WriteOperations,
	HashlineEditInput,
	HashlineEditToolDetails,
	HashlineEditToolOptions,
	HashlineReadToolDetails,
	HashlineReadToolInput,
	HashlineReadToolOptions,
} from "./types/tools.js";

export { DEFAULT_MAX_BYTES, DEFAULT_MAX_LINES } from "./types/tools.js";

// ============================================================================
// Session Management
// ============================================================================

export {
	SessionManager,
	buildSessionContext,
	parseSessionEntries,
	migrateSessionEntries,
	getLatestCompactionEntry,
	CURRENT_SESSION_VERSION,
} from "./types/session.js";

export type {
	SessionHeader,
	SessionEntry,
	SessionEntryBase,
	SessionMessageEntry,
	SessionContext,
	SessionInfo,
	FileEntry,
	ModelChangeEntry,
	CompactionEntry,
	BranchSummaryEntry,
	CustomEntry,
	CustomMessageEntry,
	LabelEntry,
	SessionInfoEntry,
	ThinkingLevelChangeEntry,
	NewSessionOptions,
	ReadonlySessionManager,
	SessionTreeNode,
	SessionUsageTotals,
} from "./types/session.js";

// ============================================================================
// Auth
// ============================================================================

export {
	AuthStorage,
	FileAuthStorageBackend,
	InMemoryAuthStorageBackend,
} from "./types/auth.js";

export type {
	ApiKeyCredential,
	AuthCredential,
	OAuthCredential,
	AuthStorageBackend,
} from "./types/auth.js";

// ============================================================================
// Model Registry
// ============================================================================

export {
	ModelRegistry,
	ModelDiscoveryCache,
	getDiscoverableProviders,
	getDiscoveryAdapter,
} from "./types/model.js";

export type {
	ModelInfo,
	DiscoveredModel,
	DiscoveryResult,
	ProviderDiscoveryAdapter,
} from "./types/model.js";

// ============================================================================
// Settings
// ============================================================================

export { SettingsManager } from "./types/settings.js";

export type {
	AsyncSettings,
	CompactionSettings,
	ImageSettings,
	MemorySettings,
	PackageSource,
	RetrySettings,
	TaskIsolationSettings,
} from "./types/settings.js";

// ============================================================================
// Theme
// ============================================================================

export {
	Theme,
	initTheme,
	getMarkdownTheme,
	highlightCode,
	getLanguageFromPath,
	getSelectListTheme,
	getSettingsListTheme,
} from "./types/theme.js";

export type { ThemeColor } from "./types/theme.js";

// ============================================================================
// SDK / Session Factory
// ============================================================================

export {
	createAgentSession,
	createBashTool,
	createCodingTools,
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadTool,
	createWriteTool,
	createReadOnlyTools,
	createHashlineEditTool,
	createHashlineReadTool,
	createHashlineCodingTools,
	readOnlyTools,
	bashTool,
	editTool,
	readTool,
	writeTool,
	grepTool,
	findTool,
	lsTool,
	codingTools,
	hashlineEditTool,
	hashlineReadTool,
	hashlineCodingTools,
} from "./core/sdk.js";

export type {
	CreateAgentSessionOptions,
	CreateAgentSessionResult,
	PromptTemplate,
} from "./core/sdk.js";

// ============================================================================
// Extension Runtime
// ============================================================================

export {
	createExtensionRuntime,
	discoverAndLoadExtensions,
	ExtensionRunner,
	importExtensionModule,
	loadExtensionFromFactory,
	loadExtensions,
	getUntrustedExtensionPaths,
	isProjectTrusted,
	trustProject,
} from "./adapters/extension-runtime.js";

// Wrapper stubs
export function wrapRegisteredTool(_tool: any, _extensions: any[]): any { return _tool; }
export function wrapRegisteredTools(_tools: any[], _extensions: any[]): any[] { return _tools; }
export function wrapToolsWithExtensions(_tools: any[], _extensions: any[]): any[] { return _tools; }
export function wrapToolWithExtensions(_tool: any, _extensions: any[]): any { return _tool; }

// ============================================================================
// Interactive / Print / RPC Modes
// ============================================================================

export {
	InteractiveMode,
	runPrintMode,
	runRpcMode,
	RpcClient,
	attachJsonlLineReader,
	serializeJsonLine,
} from "./adapters/interactive-mode.js";

export type {
	InteractiveModeOptions,
	PrintModeOptions,
	RpcClientOptions,
	RpcEventListener,
	RpcCommand,
	RpcResponse,
	RpcSessionState,
} from "./adapters/interactive-mode.js";

// ============================================================================
// Compaction
// ============================================================================

export {
	compact,
	shouldCompact,
	estimateTokens,
	calculateContextTokens,
	findCutPoint,
	findTurnStartIndex,
	collectEntriesForBranchSummary,
	generateBranchSummary,
	generateSummary,
	serializeConversation,
	prepareBranchEntries,
	getLastAssistantUsage,
	DEFAULT_COMPACTION_SETTINGS,
} from "./core/compaction.js";

export type {
	CompactionResult,
	CompactionPreparation,
	CutPointResult,
	CollectEntriesResult,
	BranchPreparation,
	BranchSummaryResult,
	GenerateBranchSummaryOptions,
	FileOperations,
} from "./core/compaction.js";

// ============================================================================
// Blob Store & Artifacts
// ============================================================================

export {
	BlobStore,
	isBlobRef,
	parseBlobRef,
	externalizeImageData,
	resolveImageData,
	ArtifactManager,
} from "./core/blob-store.js";

// ============================================================================
// Skills
// ============================================================================

export {
	loadSkills,
	loadSkillsFromDir,
	formatSkillsForPrompt,
} from "./core/skills.js";

export type {
	Skill,
	SkillFrontmatter,
	LoadSkillsResult,
	LoadSkillsFromDirOptions,
} from "./core/skills.js";

// ============================================================================
// Package Manager
// ============================================================================

export { DefaultPackageManager } from "./core/package-manager.js";

export type {
	PackageManager,
	PathMetadata,
	ProgressCallback,
	ProgressEvent,
	ResolvedPaths,
	ResolvedResource,
} from "./core/package-manager.js";

// ============================================================================
// Resource Loader
// ============================================================================

export { DefaultResourceLoader } from "./core/resource-loader.js";

export type {
	ResourceCollision,
	ResourceDiagnostic,
	ResourceLoader,
} from "./core/resource-loader.js";

// ============================================================================
// UI Components
// ============================================================================

export {
	AssistantMessageComponent,
	BashExecutionComponent,
	FooterComponent,
	ToolExecutionComponent,
	UserMessageComponent,
	ModelSelectorComponent,
	SessionSelectorComponent,
	ArminComponent,
	BorderedLoader,
	BranchSummaryMessageComponent,
	CompactionSummaryMessageComponent,
	CustomEditor,
	CustomMessageComponent,
	DynamicBorder,
	ExtensionEditorComponent,
	ExtensionInputComponent,
	ExtensionSelectorComponent,
	LoginDialogComponent,
	OAuthSelectorComponent,
	ProviderManagerComponent,
	SettingsSelectorComponent,
	ShowImagesSelectorComponent,
	SkillInvocationMessageComponent,
	ThemeSelectorComponent,
	ThinkingSelectorComponent,
	TreeSelectorComponent,
	UserMessageSelectorComponent,
	appKey,
	appKeyHint,
	editorKey,
	keyHint,
	rawKeyHint,
	renderDiff,
	truncateToVisualLines,
} from "./ui/components.js";

export type {
	RenderDiffOptions,
	SettingsCallbacks,
	SettingsConfig,
	ToolExecutionOptions,
	VisualTruncateResult,
} from "./ui/components.js";

// ============================================================================
// Utilities
// ============================================================================

export { parseFrontmatter, stripFrontmatter } from "./utils/frontmatter.js";
export { getShellConfig, sanitizeCommand } from "./utils/shell.js";
export { truncateHead, truncateLine, truncateTail, formatSize } from "./utils/text.js";
export { StringEnum } from "./utils/typebox-helpers.js";

// ============================================================================
// Path utilities
// ============================================================================

export function toPosixPath(p: string): string {
	return p.split(/[\\/]/).join("/");
}

export function copyToClipboard(_text: string): Promise<void> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// Messages utility
// ============================================================================

export function convertToLlm(_messages: any[]): any[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// Models JSON Writer
// ============================================================================

export class ModelsJsonWriter {
	constructor(_path?: string) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// Agent Session — re-export from session adapter
// ============================================================================

export { AgentSessionProxy as AgentSession } from "./adapters/session-adapter.js";

export type AgentSessionConfig = Record<string, unknown>;
export type AgentSessionEvent = Record<string, unknown>;
export type AgentSessionEventListener = (event: AgentSessionEvent) => void;
export type ModelCycleResult = { model: any; thinkingLevel?: string } | undefined;
export type ParsedSkillBlock = { name: string; args: string };
export type PromptOptions = Record<string, unknown>;
export type SessionStats = Record<string, unknown>;

export function parseSkillBlock(_text: string): ParsedSkillBlock | undefined {
	return undefined;
}

// ============================================================================
// Main entry stub
// ============================================================================

export async function main(): Promise<void> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// Bash interceptor
// ============================================================================

export const DEFAULT_BASH_INTERCEPTOR_RULES: any[] = [];

export function checkBashInterception(_command: string, _rules?: any[]): { blocked: boolean; message?: string } {
	return { blocked: false };
}

export function compileInterceptor(_rule: any): any {
	return _rule;
}

export function rewriteBackgroundCommand(_command: string): string {
	return _command;
}

// ============================================================================
// Re-exports from @sinclair/typebox (pi-ai re-exports these)
// ============================================================================

export { Type } from "@sinclair/typebox";
export type { Static, TSchema } from "@sinclair/typebox";

// ============================================================================
// Re-exports from @gsd/pi-tui (TUI primitives used by extensions)
// ============================================================================

export {
	Container,
	CURSOR_MARKER,
	Editor,
	isKeyRelease,
	Key,
	matchesKey,
	Markdown,
	Spacer,
	Text,
	truncateToWidth,
	visibleWidth,
	wrapTextWithAnsi,
} from "@gsd/pi-tui";

export type {
	AutocompleteItem,
	EditorTheme,
	TUI,
} from "@gsd/pi-tui";
