/**
 * Subagent adapter — documents the CLI argument and event mapping
 * from GSD's subagent extension to Claude Code CLI.
 *
 * The actual spawning is done in src/resources/extensions/subagent/index.ts,
 * which now spawns `claude` CLI directly. This module provides:
 * 1. Type definitions for the spawn options and results
 * 2. CLI argument mapping reference
 * 3. Event format mapping reference
 */

// ============================================================================
// CLI Argument Mapping Reference
// ============================================================================
//
// GSD (old)                          → Claude Code (new)
// --mode json                        → --output-format stream-json
// -p                                 → -p (--print, same)
// --no-session                       → --no-session-persistence
// --model X                          → --model X (same)
// --tools tool1,tool2                → --allowedTools tool1,tool2
// --append-system-prompt /path       → --append-system-prompt /path (same)
// --extension /path                  → (removed, Claude Code uses plugins differently)
// process.execPath + GSD_BIN_PATH    → claude (or CLAUDE_BIN_PATH env var)
//
// ============================================================================
// Event Format Mapping Reference
// ============================================================================
//
// GSD event.type        → Claude Code event.type
// "message_end"         → "assistant" (with event.message containing the full message)
// "tool_result_end"     → "tool_result" (with event.message)
// (none)                → "result" (final summary with usage, cost, model, stop_reason)
//
// Claude Code "result" event fields:
//   event.usage.input_tokens          → UsageStats.input
//   event.usage.output_tokens         → UsageStats.output
//   event.usage.cache_read_input_tokens    → UsageStats.cacheRead
//   event.usage.cache_creation_input_tokens → UsageStats.cacheWrite
//   event.cost_usd                    → UsageStats.cost
//   event.model                       → SingleResult.model
//   event.stop_reason                 → SingleResult.stopReason

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
// Claude Code CLI argument builder
// ============================================================================

/**
 * Build CLI arguments for spawning a Claude Code subagent.
 * Used as a reference/utility; the actual spawning is in the subagent extension.
 */
export function buildClaudeArgs(options: SubagentSpawnOptions): string[] {
	const args: string[] = ["--output-format", "stream-json", "-p", "--no-session-persistence"];

	if (options.model) {
		args.push("--model", options.model);
	}

	if (options.tools && options.tools.length > 0) {
		args.push("--allowedTools", options.tools.join(","));
	}

	// System prompt is handled via temp file + --append-system-prompt in the caller

	args.push(`Task: ${options.task}`);

	return args;
}

/**
 * Get the Claude CLI binary path, respecting CLAUDE_BIN_PATH env override.
 */
export function getClaudeBinPath(): string {
	return process.env.CLAUDE_BIN_PATH || "claude";
}
