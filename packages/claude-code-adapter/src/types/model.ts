/**
 * Model registry — working implementation for Claude Code SDK migration.
 *
 * Provides a static registry of Claude model family since the Claude Code SDK
 * only uses Anthropic models. No models.json file needed.
 */

import type { Model } from "./extension-api.js";

// ============================================================================
// Model Info (from modes/index.ts)
// ============================================================================

export interface ModelInfo {
	provider: string;
	id: string;
	name: string;
	reasoning?: boolean;
	contextWindow?: number;
	maxTokens?: number;
}

// ============================================================================
// Model Discovery
// ============================================================================

export interface DiscoveredModel {
	id: string;
	name?: string;
	provider: string;
}

export interface DiscoveryResult {
	provider: string;
	models: DiscoveredModel[];
	error?: string;
}

export interface ProviderDiscoveryAdapter {
	provider: string;
	discover(apiKey: string, baseUrl?: string): Promise<DiscoveryResult>;
}

export class ModelDiscoveryCache {
	constructor() {
		// Stub
	}

	get(_provider: string): DiscoveryResult | undefined {
		return undefined;
	}

	set(_provider: string, _result: DiscoveryResult): void {
		// Stub
	}

	clear(): void {
		// Stub
	}
}

// ============================================================================
// Built-in Claude models
// ============================================================================

const CLAUDE_MODELS: Model<any>[] = [
	{
		id: "claude-opus-4-6",
		name: "Claude Opus 4.6",
		provider: "anthropic",
		api: "anthropic-messages",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 15, output: 75, cacheRead: 1.5, cacheWrite: 18.75 },
		contextWindow: 200_000,
		maxTokens: 32_000,
	},
	{
		id: "claude-sonnet-4-6",
		name: "Claude Sonnet 4.6",
		provider: "anthropic",
		api: "anthropic-messages",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
		contextWindow: 200_000,
		maxTokens: 16_000,
	},
	{
		id: "claude-haiku-4-5-20251001",
		name: "Claude Haiku 4.5",
		provider: "anthropic",
		api: "anthropic-messages",
		reasoning: false,
		input: ["text", "image"],
		cost: { input: 0.8, output: 4, cacheRead: 0.08, cacheWrite: 1 },
		contextWindow: 200_000,
		maxTokens: 8_192,
	},
];

// ============================================================================
// ModelRegistry — working implementation
// ============================================================================

export class ModelRegistry {
	private models: Model<any>[];
	private loadError?: string;

	/**
	 * Constructor accepts authStorage and modelsJsonPath for interface
	 * compatibility with the original pi-coding-agent ModelRegistry.
	 * Both are ignored — we use a static Claude model list.
	 */
	constructor(
		readonly authStorage: any,
		private modelsJsonPath?: string,
	) {
		this.models = [...CLAUDE_MODELS];
		// TODO: If modelsJsonPath is provided, consider loading additional models from it
	}

	/** Find a model by provider and id */
	find(provider: string, modelId: string): Model<any> | undefined {
		return this.models.find((m) => m.provider === provider && m.id === modelId);
	}

	/** Get available models (all models since Claude Code handles auth) */
	getAvailable(): Model<any>[] {
		return [...this.models];
	}

	/** Get all registered models */
	getAll(): Model<any>[] {
		return [...this.models];
	}

	/** Get any error from loading models config */
	getLoadError(): string | undefined {
		return this.loadError;
	}

	/**
	 * Register an additional provider's models.
	 * TODO: Implement if third-party model support is needed.
	 */
	registerProvider(_name: string, _config: any): void {
		// No-op for now — Claude Code SDK only uses Anthropic models
	}

	/**
	 * Unregister a provider.
	 * TODO: Implement if third-party model support is needed.
	 */
	unregisterProvider(_name: string): void {
		// No-op for now
	}
}

// ============================================================================
// Discovery helpers
// ============================================================================

export function getDiscoverableProviders(): string[] {
	return ["anthropic"];
}

export function getDiscoveryAdapter(_provider: string): ProviderDiscoveryAdapter | undefined {
	// TODO: Implement discovery adapter if model auto-discovery is needed
	return undefined;
}
