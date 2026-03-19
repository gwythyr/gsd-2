/**
 * Session adapter — creates agent sessions for Claude Code SDK.
 *
 * This is the core lifecycle adapter that replaces Pi SDK's createAgentSession.
 * It creates a session object that holds all the state needed for interactive
 * and print modes, and loads extensions via the resource loader.
 */

import type { LoadExtensionsResult, ExtensionRuntime, Model } from "../types/extension-api.js";

// ============================================================================
// Types
// ============================================================================

export interface CreateAgentSessionOptions {
	cwd?: string;
	agentDir?: string;
	authStorage?: any;
	modelRegistry?: any;
	model?: any;
	thinkingLevel?: string;
	scopedModels?: Array<{ model: any; thinkingLevel?: string }>;
	tools?: any[];
	customTools?: any[];
	resourceLoader?: any;
	sessionManager?: any;
	settingsManager?: any;
}

export interface CreateAgentSessionResult {
	session: AgentSessionProxy;
	extensionsResult: LoadExtensionsResult;
	modelFallbackMessage?: string;
}

// ============================================================================
// AgentSessionProxy — minimal session object for the CLI
// ============================================================================

/**
 * Proxy session object that wraps the Claude Code SDK interaction.
 *
 * This object holds the state that cli.ts, InteractiveMode, and extensions
 * expect from an "AgentSession". The actual LLM communication will be
 * delegated to the Claude Code SDK subprocess.
 */
export class AgentSessionProxy {
	private _model: Model<any> | undefined;
	private _scopedModels: Array<{ model: Model<any>; thinkingLevel?: string }> = [];
	private _thinkingLevel: string = "off";

	/** The agent state bag — extensions read session.agent.state.tools, etc. */
	readonly agent: {
		state: {
			tools: any[];
			extensions: any[];
			systemPrompt: string;
		};
	};

	constructor(
		readonly authStorage: any,
		readonly modelRegistry: any,
		readonly settingsManager: any,
		readonly sessionManager: any,
		readonly resourceLoader: any,
		options?: { model?: Model<any>; thinkingLevel?: string },
	) {
		this._model = options?.model;
		this._thinkingLevel = options?.thinkingLevel ?? "off";
		this.agent = {
			state: {
				tools: [],
				extensions: [],
				systemPrompt: "",
			},
		};
	}

	/** Get the current model */
	getModel(): Model<any> | undefined {
		return this._model;
	}

	/** Set the active model */
	setModel(model: Model<any>): void {
		this._model = model;
	}

	/** Get scoped models (for Ctrl+P cycling) */
	getScopedModels(): Array<{ model: Model<any>; thinkingLevel?: string }> {
		return this._scopedModels;
	}

	/** Set scoped models (for Ctrl+P cycling) */
	setScopedModels(models: Array<{ model: Model<any>; thinkingLevel?: string }>): void {
		this._scopedModels = models;
	}

	/** Get thinking level */
	getThinkingLevel(): string {
		return this._thinkingLevel;
	}

	/** Set thinking level */
	setThinkingLevel(level: string): void {
		this._thinkingLevel = level;
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an agent session backed by the Claude Code SDK.
 *
 * This replaces the Pi SDK's createAgentSession. It:
 * 1. Picks the default model from settingsManager or falls back to claude-sonnet-4-6
 * 2. Creates a session proxy object holding all needed state
 * 3. Loads extensions via resourceLoader (if available)
 * 4. Returns the session and extension loading results
 */
export async function createAgentSession(
	options: CreateAgentSessionOptions,
): Promise<CreateAgentSessionResult> {
	const {
		authStorage,
		modelRegistry,
		settingsManager,
		sessionManager,
		resourceLoader,
	} = options;

	// Determine the model to use
	let model: Model<any> | undefined = options.model;
	if (!model && modelRegistry && settingsManager) {
		const provider = settingsManager.getDefaultProvider?.();
		const modelId = settingsManager.getDefaultModel?.();
		if (provider && modelId) {
			model = modelRegistry.find(provider, modelId);
		}
		// Fallback to claude-sonnet-4-6
		if (!model) {
			model = modelRegistry.find("anthropic", "claude-sonnet-4-6");
		}
		// Fallback to first available
		if (!model) {
			const available = modelRegistry.getAvailable();
			if (available.length > 0) model = available[0];
		}
	}

	const thinkingLevel = options.thinkingLevel ?? settingsManager?.getDefaultThinkingLevel?.() ?? "off";

	// Create the session proxy
	const session = new AgentSessionProxy(
		authStorage,
		modelRegistry,
		settingsManager,
		sessionManager,
		resourceLoader,
		{ model, thinkingLevel },
	);

	// Load extensions via resourceLoader
	// TODO: Wire up actual extension loading from resourceLoader paths
	const stubRuntime = {
		flagValues: new Map(),
		pendingProviderRegistrations: [],
		registerProvider: () => {},
		unregisterProvider: () => {},
		sendMessage: () => {},
		sendUserMessage: () => {},
		retryLastTurn: () => {},
		appendEntry: () => {},
		setSessionName: () => {},
		getSessionName: () => undefined,
		setLabel: () => {},
		getActiveTools: () => [] as string[],
		getAllTools: () => [] as any[],
		setActiveTools: () => {},
		refreshTools: () => {},
		getCommands: () => [] as any[],
		setModel: async () => true,
		getThinkingLevel: () => "off" as const,
		setThinkingLevel: () => {},
	} satisfies ExtensionRuntime;
	const extensionsResult: LoadExtensionsResult = {
		extensions: [],
		errors: [],
		runtime: stubRuntime,
	};

	if (resourceLoader) {
		try {
			// The resource loader has already been reloaded by cli.ts before this call.
			// Extensions will be loaded by the Claude Code SDK subprocess.
			// For now, just report success.
		} catch (err) {
			extensionsResult.errors.push({
				path: "unknown",
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return {
		session,
		extensionsResult,
	};
}
