/**
 * Model registry types — shimmed from @gsd/pi-coding-agent model-registry.
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
// ModelRegistry
// ============================================================================

export class ModelRegistry {
	constructor(
		readonly authStorage: any,
		private modelsJsonPath?: string,
	) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	find(_provider: string, _modelId: string): Model<any> | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getAvailable(): Model<any>[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getAll(): Model<any>[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getLoadError(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	registerProvider(_name: string, _config: any): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	unregisterProvider(_name: string): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// Discovery helpers
// ============================================================================

export function getDiscoverableProviders(): string[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getDiscoveryAdapter(_provider: string): ProviderDiscoveryAdapter | undefined {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}
