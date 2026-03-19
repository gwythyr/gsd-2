/**
 * Subagent adapter — stub for spawning `claude` CLI instead of `gsd`.
 *
 * In the real implementation, this will:
 * 1. Replace `process.execPath + GSD_BIN_PATH` with `claude` CLI invocation
 * 2. Map `--mode json -p --no-session` to Claude Code equivalents
 * 3. Parse JSONL output from the subprocess
 */

// ============================================================================
// Types
// ============================================================================

export interface SubagentSpawnOptions {
	/** The task/prompt to send to the subagent */
	task: string;
	/** Working directory */
	cwd?: string;
	/** Model to use */
	model?: string;
	/** Tools to enable */
	tools?: string[];
	/** System prompt to append */
	systemPrompt?: string;
	/** Abort signal */
	signal?: AbortSignal;
	/** Update callback for streaming results */
	onUpdate?: (result: SubagentUpdate) => void;
}

export interface SubagentUpdate {
	content: Array<{ type: "text"; text: string }>;
	details: unknown;
}

export interface SubagentResult {
	exitCode: number;
	messages: unknown[];
	usage: {
		input: number;
		output: number;
		cacheRead: number;
		cacheWrite: number;
		cost: number;
		contextTokens: number;
		turns: number;
	};
	model?: string;
	stopReason?: string;
	errorMessage?: string;
}

// ============================================================================
// Spawn function
// ============================================================================

export function spawnSubagent(_options: SubagentSpawnOptions): Promise<SubagentResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}
