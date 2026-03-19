/**
 * Settings manager — file-backed implementation for Claude Code adapter.
 *
 * Reads/writes settings.json from the agent directory (~/.gsd/agent/).
 * This is SDK-agnostic and works identically to the Pi SDK version.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

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
// SettingsManager — file-backed implementation
// ============================================================================

export class SettingsManager {
	private settings: Record<string, unknown>;
	private settingsPath: string | undefined;

	private constructor(settingsPath?: string, initialSettings?: Record<string, unknown>) {
		this.settingsPath = settingsPath;
		this.settings = initialSettings ?? {};

		if (settingsPath && existsSync(settingsPath)) {
			try {
				const raw = readFileSync(settingsPath, "utf-8");
				this.settings = JSON.parse(raw);
			} catch {
				// Start with defaults if settings.json is corrupt
			}
		}
	}

	/**
	 * Create a file-backed SettingsManager.
	 * Accepts either (agentDir) or (cwd, agentDir) for interface compatibility.
	 */
	static create(cwdOrAgentDir?: string, agentDir?: string): SettingsManager {
		// If two args, second is agentDir; if one arg, it IS the agentDir
		const dir = agentDir ?? cwdOrAgentDir;
		const settingsPath = dir ? join(dir, "settings.json") : undefined;
		return new SettingsManager(settingsPath);
	}

	/**
	 * Create an in-memory SettingsManager (for tests / print mode).
	 */
	static inMemory(settings?: Record<string, unknown>): SettingsManager {
		return new SettingsManager(undefined, settings ?? {});
	}

	// ── Private helpers ──────────────────────────────────────────────────

	private save(): void {
		if (!this.settingsPath) return;
		try {
			mkdirSync(dirname(this.settingsPath), { recursive: true });
			writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), "utf-8");
		} catch {
			// Non-fatal — settings are best-effort
		}
	}

	private get<T>(key: string, defaultValue?: T): T | undefined {
		return (this.settings[key] as T) ?? defaultValue;
	}

	private set(key: string, value: unknown): void {
		this.settings[key] = value;
		this.save();
	}

	// ── Provider / Model ─────────────────────────────────────────────────

	getDefaultProvider(): string | undefined {
		return this.get<string>("defaultProvider");
	}

	getDefaultModel(): string | undefined {
		return this.get<string>("defaultModel");
	}

	setDefaultModelAndProvider(provider: string, model: string): void {
		this.settings["defaultProvider"] = provider;
		this.settings["defaultModel"] = model;
		this.save();
	}

	getEnabledModels(): string[] | undefined {
		return this.get<string[]>("enabledModels");
	}

	// ── Thinking level ────────────────────────────────────────────────────

	getDefaultThinkingLevel(): string {
		return this.get<string>("defaultThinkingLevel") ?? "off";
	}

	setDefaultThinkingLevel(level: string): void {
		this.set("defaultThinkingLevel", level);
	}

	// ── UI preferences ────────────────────────────────────────────────────

	getQuietStartup(): boolean {
		return this.get<boolean>("quietStartup") ?? false;
	}

	setQuietStartup(value: boolean): void {
		this.set("quietStartup", value);
	}

	getCollapseChangelog(): boolean {
		return this.get<boolean>("collapseChangelog") ?? false;
	}

	setCollapseChangelog(value: boolean): void {
		this.set("collapseChangelog", value);
	}

	// ── Feature settings ─────────────────────────────────────────────────

	getCompactionSettings(): CompactionSettings {
		return this.get<CompactionSettings>("compaction") ?? {};
	}

	getRetrySettings(): RetrySettings {
		return this.get<RetrySettings>("retry") ?? {};
	}

	getImageSettings(): ImageSettings {
		return this.get<ImageSettings>("image") ?? {};
	}

	getMemorySettings(): MemorySettings {
		return this.get<MemorySettings>("memory") ?? {};
	}

	getAsyncSettings(): AsyncSettings {
		return this.get<AsyncSettings>("async") ?? {};
	}

	getTaskIsolationSettings(): TaskIsolationSettings {
		return this.get<TaskIsolationSettings>("taskIsolation") ?? {};
	}

	getShellPath(): string | undefined {
		return this.get<string>("shellPath");
	}

	getTheme(): string | undefined {
		return this.get<string>("theme");
	}

	getPackages(): PackageSource[] {
		return this.get<PackageSource[]>("packages") ?? [];
	}

	getErrors(): Array<{ scope: string; error: Error }> {
		return [];
	}
}
