/**
 * Settings manager types — shimmed from @gsd/pi-coding-agent settings-manager.
 */

// ============================================================================
// Settings Types
// ============================================================================

export interface CompactionSettings {
	enabled?: boolean;
	reserveTokens?: number;
	keepRecentTokens?: number;
}

export interface RetrySettings {
	enabled?: boolean;
	maxRetries?: number;
	baseDelayMs?: number;
	maxDelayMs?: number;
}

export interface ImageSettings {
	autoResize?: boolean;
	blockImages?: boolean;
}

export interface MemorySettings {
	enabled?: boolean;
	maxRolloutsPerStartup?: number;
	maxRolloutAgeDays?: number;
	minRolloutIdleHours?: number;
	stage1Concurrency?: number;
	summaryInjectionTokenLimit?: number;
}

export interface AsyncSettings {
	enabled?: boolean;
	maxJobs?: number;
}

export interface TaskIsolationSettings {
	mode?: "none" | "worktree" | "fuse-overlay";
	merge?: "patch" | "branch";
}

/**
 * Package source for npm/git packages.
 */
export type PackageSource =
	| string
	| {
			source: string;
			extensions?: string[];
			skills?: string[];
			prompts?: string[];
			themes?: string[];
	  };

// ============================================================================
// SettingsManager
// ============================================================================

export class SettingsManager {
	private constructor() {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static create(_cwd?: string, _agentDir?: string): SettingsManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static inMemory(_settings?: Record<string, unknown>): SettingsManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getDefaultProvider(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getDefaultModel(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	setDefaultModelAndProvider(_provider: string, _model: string): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getEnabledModels(): string[] | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getCompactionSettings(): CompactionSettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getRetrySettings(): RetrySettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getImageSettings(): ImageSettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getMemorySettings(): MemorySettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getAsyncSettings(): AsyncSettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getTaskIsolationSettings(): TaskIsolationSettings {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getShellPath(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getTheme(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getPackages(): PackageSource[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getErrors(): Array<{ scope: string; error: Error }> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}
