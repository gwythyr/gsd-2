/**
 * Extension system types — shimmed from @gsd/pi-coding-agent.
 *
 * These interfaces mirror the exact shapes from pi-coding-agent's
 * extension system so that all extension imports can resolve from
 * @gsd/claude-code-adapter instead.
 */

import type { TSchema } from "@sinclair/typebox";

// ============================================================================
// Forward-declared lightweight types (avoid heavy external deps)
// ============================================================================

/** Minimal Model type matching @gsd/pi-ai's Model<TApi> */
export interface Model<TApi = any> {
	id: string;
	name: string;
	provider: string;
	api: TApi;
	baseUrl?: string;
	reasoning?: boolean;
	input?: ("text" | "image")[];
	cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
	contextWindow: number;
	maxTokens: number;
	headers?: Record<string, string>;
	compat?: unknown;
}

export interface TextContent {
	type: "text";
	text: string;
	textSignature?: string;
}

export interface ImageContent {
	type: "image";
	data: string;
	mimeType: string;
}

export interface ThinkingContent {
	type: "thinking";
	thinking: string;
	thinkingSignature?: string;
	redacted?: boolean;
}

export interface ToolCall {
	type: "toolCall";
	id: string;
	name: string;
	arguments: Record<string, any>;
}

export interface Usage {
	input: number;
	output: number;
	cacheRead?: number;
	cacheWrite?: number;
	totalTokens?: number;
	cost?: { input: number; output: number; total: number };
}

export type StopReason = "stop" | "length" | "toolUse" | "error" | "aborted";

export interface UserMessage {
	role: "user";
	content: string | (TextContent | ImageContent)[];
	timestamp: number;
}

export interface AssistantMessage {
	role: "assistant";
	content: (TextContent | ThinkingContent | ToolCall)[];
	model?: string;
	usage?: Usage;
	stopReason?: StopReason;
	errorMessage?: string;
	timestamp?: number;
}

export interface ToolResultMessage<TDetails = unknown> {
	role: "toolResult";
	toolCallId: string;
	toolName: string;
	content: (TextContent | ImageContent)[];
	details?: TDetails;
	isError?: boolean;
	timestamp?: number;
}

export type Message = UserMessage | AssistantMessage | ToolResultMessage;

/** Agent message (may include custom message types via declaration merging) */
export type AgentMessage = Message | Record<string, unknown>;

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

// ============================================================================
// AgentToolResult and AgentToolUpdateCallback
// ============================================================================

export interface AgentToolResult<T = unknown> {
	content: (TextContent | ImageContent)[];
	details: T;
}

export type AgentToolUpdateCallback<T = unknown> = (partialResult: AgentToolResult<T>) => void;

// ============================================================================
// ExecOptions / ExecResult
// ============================================================================

export interface ExecOptions {
	signal?: AbortSignal;
	timeout?: number;
	cwd?: string;
}

export interface ExecResult {
	stdout: string;
	stderr: string;
	code: number;
	killed: boolean;
}

// ============================================================================
// AppAction
// ============================================================================

export type AppAction =
	| "interrupt"
	| "clear"
	| "exit"
	| "suspend"
	| "cycleThinkingLevel"
	| "cycleModelForward"
	| "cycleModelBackward"
	| "selectModel"
	| "expandTools"
	| "toggleThinking"
	| "toggleSessionNamedFilter"
	| "externalEditor"
	| "followUp"
	| "dequeue"
	| "pasteImage"
	| "newSession"
	| "tree"
	| "fork"
	| "resume";

// ============================================================================
// KeybindingsManager
// ============================================================================

export interface KeybindingsManager {
	getKeyForAction(action: AppAction): string | string[] | undefined;
	isMatch(data: string, action: AppAction): boolean;
}

// ============================================================================
// UI Context
// ============================================================================

export interface ExtensionUIDialogOptions {
	signal?: AbortSignal;
	timeout?: number;
	allowMultiple?: boolean;
}

export type WidgetPlacement = "aboveEditor" | "belowEditor";

export interface ExtensionWidgetOptions {
	placement?: WidgetPlacement;
}

export type TerminalInputHandler = (data: string) => { consume?: boolean; data?: string } | undefined;

export interface ExtensionUIContext {
	select(title: string, options: string[], opts?: ExtensionUIDialogOptions): Promise<string | string[] | undefined>;
	confirm(title: string, message: string, opts?: ExtensionUIDialogOptions): Promise<boolean>;
	input(title: string, placeholder?: string, opts?: ExtensionUIDialogOptions): Promise<string | undefined>;
	notify(message: string, type?: "info" | "warning" | "error" | "success"): void;
	onTerminalInput(handler: TerminalInputHandler): () => void;
	setStatus(key: string, text: string | undefined): void;
	setWorkingMessage(message?: string): void;
	setWidget(key: string, content: string[] | undefined, options?: ExtensionWidgetOptions): void;
	setWidget(key: string, content: unknown | undefined, options?: ExtensionWidgetOptions): void;
	setFooter(factory: unknown | undefined): void;
	setHeader(factory: unknown | undefined): void;
	setTitle(title: string): void;
	custom<T>(factory: unknown, options?: unknown): Promise<T>;
	pasteToEditor(text: string): void;
	setEditorText(text: string): void;
	getEditorText(): string;
	editor(title: string, prefill?: string): Promise<string | undefined>;
	setEditorComponent(factory: unknown | undefined): void;
	readonly theme: any;
	getAllThemes(): { name: string; path: string | undefined }[];
	getTheme(name: string): any | undefined;
	setTheme(theme: string | any): { success: boolean; error?: string };
	getToolsExpanded(): boolean;
	setToolsExpanded(expanded: boolean): void;
}

// ============================================================================
// Context Usage / Compact Options
// ============================================================================

export interface ContextUsage {
	tokens: number | null;
	contextWindow: number;
	percent: number | null;
}

export interface CompactOptions {
	customInstructions?: string;
	onComplete?: (result: any) => void;
	onError?: (error: Error) => void;
}

// ============================================================================
// Extension Contexts
// ============================================================================

export interface ExtensionContext {
	ui: ExtensionUIContext;
	hasUI: boolean;
	cwd: string;
	sessionManager: any;
	modelRegistry: any;
	model: Model<any> | undefined;
	isIdle(): boolean;
	abort(): void;
	hasPendingMessages(): boolean;
	shutdown(): void;
	getContextUsage(): ContextUsage | undefined;
	compact(options?: CompactOptions): void;
	getSystemPrompt(): string;
}

export interface ExtensionCommandContext extends ExtensionContext {
	waitForIdle(): Promise<void>;
	newSession(options?: {
		parentSession?: string;
		setup?: (sessionManager: any) => Promise<void>;
	}): Promise<{ cancelled: boolean }>;
	fork(entryId: string): Promise<{ cancelled: boolean }>;
	navigateTree(
		targetId: string,
		options?: { summarize?: boolean; customInstructions?: string; replaceInstructions?: boolean; label?: string },
	): Promise<{ cancelled: boolean }>;
	switchSession(sessionPath: string): Promise<{ cancelled: boolean }>;
	reload(): Promise<void>;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface ToolRenderResultOptions {
	expanded: boolean;
	isPartial: boolean;
}

export interface ToolDefinition<TParams extends TSchema = TSchema, TDetails = unknown> {
	name: string;
	label: string;
	description: string;
	promptSnippet?: string;
	promptGuidelines?: string[];
	parameters: TParams;
	execute(
		toolCallId: string,
		params: any,
		signal: AbortSignal | undefined,
		onUpdate: AgentToolUpdateCallback<TDetails> | undefined,
		ctx: ExtensionContext,
	): Promise<AgentToolResult<TDetails>>;
	renderCall?: (args: any, theme: any) => any | undefined;
	renderResult?: (result: AgentToolResult<TDetails>, options: ToolRenderResultOptions, theme: any) => any | undefined;
}

export type ToolInfo = Pick<ToolDefinition, "name" | "description" | "parameters">;

// ============================================================================
// Resource Events
// ============================================================================

export interface ResourcesDiscoverEvent {
	type: "resources_discover";
	cwd: string;
	reason: "startup" | "reload";
}

export interface ResourcesDiscoverResult {
	skillPaths?: string[];
	promptPaths?: string[];
	themePaths?: string[];
}

// ============================================================================
// Session Events
// ============================================================================

export interface SessionDirectoryEvent {
	type: "session_directory";
	cwd: string;
}

export interface SessionStartEvent {
	type: "session_start";
}

export interface SessionBeforeSwitchEvent {
	type: "session_before_switch";
	reason: "new" | "resume";
	targetSessionFile?: string;
}

export interface SessionSwitchEvent {
	type: "session_switch";
	reason: "new" | "resume";
	previousSessionFile: string | undefined;
}

export interface SessionBeforeForkEvent {
	type: "session_before_fork";
	entryId: string;
}

export interface SessionForkEvent {
	type: "session_fork";
	previousSessionFile: string | undefined;
}

export interface SessionBeforeCompactEvent {
	type: "session_before_compact";
	preparation: any;
	branchEntries: any[];
	customInstructions?: string;
	signal: AbortSignal;
}

export interface SessionCompactEvent {
	type: "session_compact";
	compactionEntry: any;
	fromExtension: boolean;
}

export interface SessionShutdownEvent {
	type: "session_shutdown";
}

export interface TreePreparation {
	targetId: string;
	oldLeafId: string | null;
	commonAncestorId: string | null;
	entriesToSummarize: any[];
	userWantsSummary: boolean;
	customInstructions?: string;
	replaceInstructions?: boolean;
	label?: string;
}

export interface SessionBeforeTreeEvent {
	type: "session_before_tree";
	preparation: TreePreparation;
	signal: AbortSignal;
}

export interface SessionTreeEvent {
	type: "session_tree";
	newLeafId: string | null;
	oldLeafId: string | null;
	summaryEntry?: any;
	fromExtension?: boolean;
}

export type SessionEvent =
	| SessionDirectoryEvent
	| SessionStartEvent
	| SessionBeforeSwitchEvent
	| SessionSwitchEvent
	| SessionBeforeForkEvent
	| SessionForkEvent
	| SessionBeforeCompactEvent
	| SessionCompactEvent
	| SessionShutdownEvent
	| SessionBeforeTreeEvent
	| SessionTreeEvent;

// ============================================================================
// Agent Events
// ============================================================================

export interface ContextEvent {
	type: "context";
	messages: AgentMessage[];
}

export interface BeforeProviderRequestEvent {
	type: "before_provider_request";
	payload: unknown;
	model?: { provider: string; id: string };
}

export type BeforeProviderRequestEventResult = unknown;

export interface BeforeAgentStartEvent {
	type: "before_agent_start";
	prompt: string;
	images?: ImageContent[];
	systemPrompt: string;
}

export interface BeforeAgentStartEventResult {
	message?: { customType: string; content: string | (TextContent | ImageContent)[]; display?: boolean; details?: unknown };
	systemPrompt?: string;
}

export interface AgentStartEvent {
	type: "agent_start";
}

export interface AgentEndEvent {
	type: "agent_end";
	messages: AgentMessage[];
}

export interface TurnStartEvent {
	type: "turn_start";
	turnIndex: number;
	timestamp: number;
}

export interface TurnEndEvent {
	type: "turn_end";
	turnIndex: number;
	message: AgentMessage;
	toolResults: ToolResultMessage[];
}

export interface MessageStartEvent {
	type: "message_start";
	message: AgentMessage;
}

export interface MessageUpdateEvent {
	type: "message_update";
	message: AgentMessage;
	assistantMessageEvent: any;
}

export interface MessageEndEvent {
	type: "message_end";
	message: AgentMessage;
}

export interface ToolExecutionStartEvent {
	type: "tool_execution_start";
	toolCallId: string;
	toolName: string;
	args: any;
}

export interface ToolExecutionUpdateEvent {
	type: "tool_execution_update";
	toolCallId: string;
	toolName: string;
	args: any;
	partialResult: any;
}

export interface ToolExecutionEndEvent {
	type: "tool_execution_end";
	toolCallId: string;
	toolName: string;
	result: any;
	isError: boolean;
}

// ============================================================================
// Model Events
// ============================================================================

export type ModelSelectSource = "set" | "cycle" | "restore";

export interface ModelSelectEvent {
	type: "model_select";
	model: Model<any>;
	previousModel: Model<any> | undefined;
	source: ModelSelectSource;
}

// ============================================================================
// User Bash Events
// ============================================================================

export interface UserBashEvent {
	type: "user_bash";
	command: string;
	excludeFromContext: boolean;
	cwd: string;
}

export interface UserBashEventResult {
	operations?: any;
	result?: any;
}

// ============================================================================
// Input Events
// ============================================================================

export type InputSource = "interactive" | "rpc" | "extension";

export interface InputEvent {
	type: "input";
	text: string;
	images?: ImageContent[];
	source: InputSource;
}

export type InputEventResult =
	| { action: "continue" }
	| { action: "transform"; text: string; images?: ImageContent[] }
	| { action: "handled" };

// ============================================================================
// Tool Call Events
// ============================================================================

interface ToolCallEventBase {
	type: "tool_call";
	toolCallId: string;
}

export interface BashToolCallEvent extends ToolCallEventBase {
	toolName: "bash";
	input: { command: string; timeout?: number; description?: string };
}

export interface ReadToolCallEvent extends ToolCallEventBase {
	toolName: "read";
	input: { file_path: string; offset?: number; limit?: number };
}

export interface EditToolCallEvent extends ToolCallEventBase {
	toolName: "edit";
	input: { file_path: string; old_string: string; new_string: string; replace_all?: boolean };
}

export interface WriteToolCallEvent extends ToolCallEventBase {
	toolName: "write";
	input: { file_path: string; content: string };
}

export interface GrepToolCallEvent extends ToolCallEventBase {
	toolName: "grep";
	input: { pattern: string; path?: string; include?: string };
}

export interface FindToolCallEvent extends ToolCallEventBase {
	toolName: "find";
	input: { pattern: string; path?: string; type?: string };
}

export interface LsToolCallEvent extends ToolCallEventBase {
	toolName: "ls";
	input: { path?: string };
}

export interface CustomToolCallEvent extends ToolCallEventBase {
	toolName: string;
	input: Record<string, unknown>;
}

export type ToolCallEvent =
	| BashToolCallEvent
	| ReadToolCallEvent
	| EditToolCallEvent
	| WriteToolCallEvent
	| GrepToolCallEvent
	| FindToolCallEvent
	| LsToolCallEvent
	| CustomToolCallEvent;

// ============================================================================
// Tool Result Events
// ============================================================================

interface ToolResultEventBase {
	type: "tool_result";
	toolCallId: string;
	input: Record<string, unknown>;
	content: (TextContent | ImageContent)[];
	isError: boolean;
}

export interface BashToolResultEvent extends ToolResultEventBase {
	toolName: "bash";
	details: any | undefined;
}

export interface ReadToolResultEvent extends ToolResultEventBase {
	toolName: "read";
	details: any | undefined;
}

export interface EditToolResultEvent extends ToolResultEventBase {
	toolName: "edit";
	details: any | undefined;
}

export interface WriteToolResultEvent extends ToolResultEventBase {
	toolName: "write";
	details: undefined;
}

export interface GrepToolResultEvent extends ToolResultEventBase {
	toolName: "grep";
	details: any | undefined;
}

export interface FindToolResultEvent extends ToolResultEventBase {
	toolName: "find";
	details: any | undefined;
}

export interface LsToolResultEvent extends ToolResultEventBase {
	toolName: "ls";
	details: any | undefined;
}

export interface CustomToolResultEvent extends ToolResultEventBase {
	toolName: string;
	details: unknown;
}

export type ToolResultEvent =
	| BashToolResultEvent
	| ReadToolResultEvent
	| EditToolResultEvent
	| WriteToolResultEvent
	| GrepToolResultEvent
	| FindToolResultEvent
	| LsToolResultEvent
	| CustomToolResultEvent;

// Type guards
export function isBashToolResult(e: ToolResultEvent): e is BashToolResultEvent {
	return e.toolName === "bash";
}
export function isReadToolResult(e: ToolResultEvent): e is ReadToolResultEvent {
	return e.toolName === "read";
}
export function isEditToolResult(e: ToolResultEvent): e is EditToolResultEvent {
	return e.toolName === "edit";
}
export function isWriteToolResult(e: ToolResultEvent): e is WriteToolResultEvent {
	return e.toolName === "write";
}
export function isGrepToolResult(e: ToolResultEvent): e is GrepToolResultEvent {
	return e.toolName === "grep";
}
export function isFindToolResult(e: ToolResultEvent): e is FindToolResultEvent {
	return e.toolName === "find";
}
export function isLsToolResult(e: ToolResultEvent): e is LsToolResultEvent {
	return e.toolName === "ls";
}

export function isToolCallEventType(toolName: "bash", event: ToolCallEvent): event is BashToolCallEvent;
export function isToolCallEventType(toolName: "read", event: ToolCallEvent): event is ReadToolCallEvent;
export function isToolCallEventType(toolName: "edit", event: ToolCallEvent): event is EditToolCallEvent;
export function isToolCallEventType(toolName: "write", event: ToolCallEvent): event is WriteToolCallEvent;
export function isToolCallEventType(toolName: "grep", event: ToolCallEvent): event is GrepToolCallEvent;
export function isToolCallEventType(toolName: "find", event: ToolCallEvent): event is FindToolCallEvent;
export function isToolCallEventType(toolName: "ls", event: ToolCallEvent): event is LsToolCallEvent;
export function isToolCallEventType<TName extends string, TInput extends Record<string, unknown>>(
	toolName: TName,
	event: ToolCallEvent,
): event is ToolCallEvent & { toolName: TName; input: TInput };
export function isToolCallEventType(toolName: string, event: ToolCallEvent): boolean {
	return event.toolName === toolName;
}

// ============================================================================
// Event Union
// ============================================================================

export type ExtensionEvent =
	| ResourcesDiscoverEvent
	| SessionEvent
	| ContextEvent
	| BeforeProviderRequestEvent
	| BeforeAgentStartEvent
	| AgentStartEvent
	| AgentEndEvent
	| TurnStartEvent
	| TurnEndEvent
	| MessageStartEvent
	| MessageUpdateEvent
	| MessageEndEvent
	| ToolExecutionStartEvent
	| ToolExecutionUpdateEvent
	| ToolExecutionEndEvent
	| ModelSelectEvent
	| UserBashEvent
	| InputEvent
	| ToolCallEvent
	| ToolResultEvent;

// ============================================================================
// Event Results
// ============================================================================

export interface ContextEventResult {
	messages?: AgentMessage[];
}

export interface ToolCallEventResult {
	block?: boolean;
	reason?: string;
}

export interface ToolResultEventResult {
	content?: (TextContent | ImageContent)[];
	details?: unknown;
	isError?: boolean;
}

export interface SessionDirectoryResult {
	sessionDir?: string;
}

export type SessionDirectoryHandler = (
	event: SessionDirectoryEvent,
) => Promise<SessionDirectoryResult | undefined> | SessionDirectoryResult | undefined;

export interface SessionBeforeSwitchResult {
	cancel?: boolean;
}

export interface SessionBeforeForkResult {
	cancel?: boolean;
	skipConversationRestore?: boolean;
}

export interface SessionBeforeCompactResult {
	cancel?: boolean;
	compaction?: any;
}

export interface SessionBeforeTreeResult {
	cancel?: boolean;
	summary?: { summary: string; details?: unknown };
	customInstructions?: string;
	replaceInstructions?: boolean;
	label?: string;
}

// ============================================================================
// Message Rendering
// ============================================================================

export interface MessageRenderOptions {
	expanded: boolean;
}

export type MessageRenderer<T = unknown> = (message: any, options: MessageRenderOptions, theme: any) => any | undefined;

// ============================================================================
// Command Registration
// ============================================================================

export interface RegisteredCommand {
	name: string;
	description?: string;
	getArgumentCompletions?: (argumentPrefix: string) => any[] | null;
	handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>;
}

// ============================================================================
// Extension Handler
// ============================================================================

// biome-ignore lint/suspicious/noConfusingVoidType: void allows bare return statements
export type ExtensionHandler<E, R = undefined> = (event: E, ctx: ExtensionContext) => Promise<R | void> | R | void;

// ============================================================================
// ExtensionAPI
// ============================================================================

export interface ExtensionAPI {
	// Event Subscription
	on(event: "resources_discover", handler: ExtensionHandler<ResourcesDiscoverEvent, ResourcesDiscoverResult>): void;
	on(event: "session_directory", handler: SessionDirectoryHandler): void;
	on(event: "session_start", handler: ExtensionHandler<SessionStartEvent>): void;
	on(event: "session_before_switch", handler: ExtensionHandler<SessionBeforeSwitchEvent, SessionBeforeSwitchResult>): void;
	on(event: "session_switch", handler: ExtensionHandler<SessionSwitchEvent>): void;
	on(event: "session_before_fork", handler: ExtensionHandler<SessionBeforeForkEvent, SessionBeforeForkResult>): void;
	on(event: "session_fork", handler: ExtensionHandler<SessionForkEvent>): void;
	on(event: "session_before_compact", handler: ExtensionHandler<SessionBeforeCompactEvent, SessionBeforeCompactResult>): void;
	on(event: "session_compact", handler: ExtensionHandler<SessionCompactEvent>): void;
	on(event: "session_shutdown", handler: ExtensionHandler<SessionShutdownEvent>): void;
	on(event: "session_before_tree", handler: ExtensionHandler<SessionBeforeTreeEvent, SessionBeforeTreeResult>): void;
	on(event: "session_tree", handler: ExtensionHandler<SessionTreeEvent>): void;
	on(event: "context", handler: ExtensionHandler<ContextEvent, ContextEventResult>): void;
	on(event: "before_provider_request", handler: ExtensionHandler<BeforeProviderRequestEvent, BeforeProviderRequestEventResult>): void;
	on(event: "before_agent_start", handler: ExtensionHandler<BeforeAgentStartEvent, BeforeAgentStartEventResult>): void;
	on(event: "agent_start", handler: ExtensionHandler<AgentStartEvent>): void;
	on(event: "agent_end", handler: ExtensionHandler<AgentEndEvent>): void;
	on(event: "turn_start", handler: ExtensionHandler<TurnStartEvent>): void;
	on(event: "turn_end", handler: ExtensionHandler<TurnEndEvent>): void;
	on(event: "message_start", handler: ExtensionHandler<MessageStartEvent>): void;
	on(event: "message_update", handler: ExtensionHandler<MessageUpdateEvent>): void;
	on(event: "message_end", handler: ExtensionHandler<MessageEndEvent>): void;
	on(event: "tool_execution_start", handler: ExtensionHandler<ToolExecutionStartEvent>): void;
	on(event: "tool_execution_update", handler: ExtensionHandler<ToolExecutionUpdateEvent>): void;
	on(event: "tool_execution_end", handler: ExtensionHandler<ToolExecutionEndEvent>): void;
	on(event: "model_select", handler: ExtensionHandler<ModelSelectEvent>): void;
	on(event: "tool_call", handler: ExtensionHandler<ToolCallEvent, ToolCallEventResult>): void;
	on(event: "tool_result", handler: ExtensionHandler<ToolResultEvent, ToolResultEventResult>): void;
	on(event: "user_bash", handler: ExtensionHandler<UserBashEvent, UserBashEventResult>): void;
	on(event: "input", handler: ExtensionHandler<InputEvent, InputEventResult>): void;

	// Tool Registration
	registerTool<TParams extends TSchema = TSchema, TDetails = unknown>(tool: ToolDefinition<TParams, TDetails>): void;

	// Command, Shortcut, Flag Registration
	registerCommand(name: string, options: Omit<RegisteredCommand, "name">): void;
	registerShortcut(shortcut: string, options: { description?: string; handler: (ctx: ExtensionContext) => Promise<void> | void }): void;
	registerFlag(name: string, options: { description?: string; type: "boolean" | "string"; default?: boolean | string }): void;
	getFlag(name: string): boolean | string | undefined;

	// Message Rendering
	registerMessageRenderer<T = unknown>(customType: string, renderer: MessageRenderer<T>): void;

	// Actions
	sendMessage<T = unknown>(
		message: { customType: string; content: string | (TextContent | ImageContent)[]; display?: boolean; details?: T },
		options?: { triggerTurn?: boolean; deliverAs?: "steer" | "followUp" | "nextTurn" },
	): void;
	sendUserMessage(
		content: string | (TextContent | ImageContent)[],
		options?: { deliverAs?: "steer" | "followUp" },
	): void;
	retryLastTurn(): void;
	appendEntry<T = unknown>(customType: string, data?: T): void;

	// Session Metadata
	setSessionName(name: string): void;
	getSessionName(): string | undefined;
	setLabel(entryId: string, label: string | undefined): void;

	// Shell execution
	exec(command: string, args: string[], options?: ExecOptions): Promise<ExecResult>;

	// Tool management
	getActiveTools(): string[];
	getAllTools(): ToolInfo[];
	setActiveTools(toolNames: string[]): void;
	getCommands(): SlashCommandInfo[];

	// Model and Thinking Level
	setModel(model: Model<any>, options?: { persist?: boolean }): Promise<boolean>;
	getThinkingLevel(): ThinkingLevel;
	setThinkingLevel(level: ThinkingLevel): void;

	// Provider Registration
	registerProvider(name: string, config: ProviderConfig): void;
	unregisterProvider(name: string): void;

	// Event bus
	events: EventBus;
}

// ============================================================================
// Provider Registration Types
// ============================================================================

export interface ProviderConfig {
	baseUrl?: string;
	apiKey?: string;
	api?: string;
	streamSimple?: (...args: any[]) => any;
	headers?: Record<string, string>;
	authHeader?: boolean;
	models?: ProviderModelConfig[];
	oauth?: {
		name: string;
		login(callbacks: any): Promise<any>;
		refreshToken(credentials: any): Promise<any>;
		getApiKey(credentials: any): string;
		modifyModels?(models: Model<any>[], credentials: any): Model<any>[];
	};
}

export interface ProviderModelConfig {
	id: string;
	name: string;
	api?: string;
	reasoning: boolean;
	input: ("text" | "image")[];
	cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
	contextWindow: number;
	maxTokens: number;
	headers?: Record<string, string>;
	compat?: unknown;
}

// ============================================================================
// Extension Factory & Loaded Extension
// ============================================================================

export type ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>;

export interface RegisteredTool {
	definition: ToolDefinition;
	extensionPath: string;
}

export interface ExtensionFlag {
	name: string;
	description?: string;
	type: "boolean" | "string";
	default?: boolean | string;
	extensionPath: string;
}

export interface ExtensionShortcut {
	shortcut: string;
	description?: string;
	handler: (ctx: ExtensionContext) => Promise<void> | void;
	extensionPath: string;
}

export interface Extension {
	path: string;
	resolvedPath: string;
	handlers: Map<string, ((...args: unknown[]) => Promise<unknown>)[]>;
	tools: Map<string, RegisteredTool>;
	messageRenderers: Map<string, MessageRenderer>;
	commands: Map<string, RegisteredCommand>;
	flags: Map<string, ExtensionFlag>;
	shortcuts: Map<string, ExtensionShortcut>;
}

export interface LoadExtensionsResult {
	extensions: Extension[];
	errors: Array<{ path: string; error: string }>;
	runtime: ExtensionRuntime;
}

export interface ExtensionError {
	extensionPath: string;
	event: string;
	error: string;
	stack?: string;
}

// ============================================================================
// Extension Runtime
// ============================================================================

export interface ExtensionRuntimeState {
	flagValues: Map<string, boolean | string>;
	pendingProviderRegistrations: Array<{ name: string; config: ProviderConfig }>;
	registerProvider: (name: string, config: ProviderConfig) => void;
	unregisterProvider: (name: string) => void;
}

export interface ExtensionActions {
	sendMessage: <T = unknown>(
		message: { customType: string; content: string | (TextContent | ImageContent)[]; display?: boolean; details?: T },
		options?: { triggerTurn?: boolean; deliverAs?: "steer" | "followUp" | "nextTurn" },
	) => void;
	sendUserMessage: (content: string | (TextContent | ImageContent)[], options?: { deliverAs?: "steer" | "followUp" }) => void;
	retryLastTurn: () => void;
	appendEntry: <T = unknown>(customType: string, data?: T) => void;
	setSessionName: (name: string) => void;
	getSessionName: () => string | undefined;
	setLabel: (entryId: string, label: string | undefined) => void;
	getActiveTools: () => string[];
	getAllTools: () => ToolInfo[];
	setActiveTools: (toolNames: string[]) => void;
	refreshTools: () => void;
	getCommands: () => SlashCommandInfo[];
	setModel: (model: Model<any>, options?: { persist?: boolean }) => Promise<boolean>;
	getThinkingLevel: () => ThinkingLevel;
	setThinkingLevel: (level: ThinkingLevel) => void;
}

export interface ExtensionContextActions {
	getModel: () => Model<any> | undefined;
	isIdle: () => boolean;
	abort: () => void;
	hasPendingMessages: () => boolean;
	shutdown: () => void;
	getContextUsage: () => ContextUsage | undefined;
	compact: (options?: CompactOptions) => void;
	getSystemPrompt: () => string;
}

export interface ExtensionCommandContextActions {
	waitForIdle: () => Promise<void>;
	newSession: (options?: { parentSession?: string; setup?: (sessionManager: any) => Promise<void> }) => Promise<{ cancelled: boolean }>;
	fork: (entryId: string) => Promise<{ cancelled: boolean }>;
	navigateTree: (
		targetId: string,
		options?: { summarize?: boolean; customInstructions?: string; replaceInstructions?: boolean; label?: string },
	) => Promise<{ cancelled: boolean }>;
	switchSession: (sessionPath: string) => Promise<{ cancelled: boolean }>;
	reload: () => Promise<void>;
}

export interface ExtensionRuntime extends ExtensionRuntimeState, ExtensionActions {}

// ============================================================================
// Slash Commands
// ============================================================================

export type SlashCommandSource = "extension" | "prompt" | "skill";
export type SlashCommandLocation = "user" | "project" | "path";

export interface SlashCommandInfo {
	name: string;
	description?: string;
	source: SlashCommandSource;
	location?: SlashCommandLocation;
	path?: string;
}

// ============================================================================
// EventBus
// ============================================================================

export interface EventBus {
	emit(channel: string, data: unknown): void;
	on(channel: string, handler: (data: unknown) => void): () => void;
}

export interface EventBusController extends EventBus {
	clear(): void;
}

// ============================================================================
// ReadonlyFooterDataProvider
// ============================================================================

export interface ReadonlyFooterDataProvider {
	getGitBranch(): string | undefined;
	getExtensionStatuses(): Map<string, string>;
}
