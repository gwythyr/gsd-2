/**
 * Extension runtime adapter — stubs for extension loading and running.
 */

import type {
	Extension,
	ExtensionFactory,
	ExtensionRuntime,
	ExtensionRuntimeState,
	LoadExtensionsResult,
	ProviderConfig,
} from "../types/extension-api.js";

// ============================================================================
// Extension Runner
// ============================================================================

export class ExtensionRunner {
	constructor() {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	initialize(_actions: any): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	async emit(_event: string, _data: any, _ctx?: any): Promise<any> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// Extension Loading
// ============================================================================

export function createExtensionRuntime(): ExtensionRuntime {
	const state: ExtensionRuntimeState = {
		flagValues: new Map(),
		pendingProviderRegistrations: [],
		registerProvider: (_name: string, _config: ProviderConfig) => {
			throw new Error("Not implemented: use claude-code-adapter implementation");
		},
		unregisterProvider: (_name: string) => {
			throw new Error("Not implemented: use claude-code-adapter implementation");
		},
	};

	return {
		...state,
		sendMessage: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		sendUserMessage: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		retryLastTurn: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		appendEntry: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		setSessionName: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		getSessionName: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		setLabel: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		getActiveTools: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		getAllTools: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		setActiveTools: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		refreshTools: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		getCommands: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		setModel: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		getThinkingLevel: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
		setThinkingLevel: () => { throw new Error("Not implemented: use claude-code-adapter implementation"); },
	} as ExtensionRuntime;
}

export async function discoverAndLoadExtensions(
	_extensionPaths: string[],
	_runtime?: ExtensionRuntime,
): Promise<LoadExtensionsResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export async function importExtensionModule(_path: string): Promise<ExtensionFactory> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function loadExtensionFromFactory(
	_factory: ExtensionFactory,
	_path: string,
	_runtime?: ExtensionRuntime,
): Promise<Extension> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function loadExtensions(
	_paths: string[],
	_runtime?: ExtensionRuntime,
): Promise<LoadExtensionsResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getUntrustedExtensionPaths(_paths: string[]): string[] {
	return [];
}

export function isProjectTrusted(_projectDir: string): boolean {
	return true;
}

export function trustProject(_projectDir: string): void {
	// No-op stub
}
