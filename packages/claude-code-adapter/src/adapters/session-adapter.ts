/**
 * Session adapter — stub for creating agent sessions via Claude Code.
 */

import type { LoadExtensionsResult } from "../types/extension-api.js";

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
	session: any;
	extensionsResult: LoadExtensionsResult;
	modelFallbackMessage?: string;
}

// ============================================================================
// Factory
// ============================================================================

export function createAgentSession(_options: CreateAgentSessionOptions): Promise<CreateAgentSessionResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}
