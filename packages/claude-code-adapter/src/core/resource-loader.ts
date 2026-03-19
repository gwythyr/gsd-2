/**
 * Resource loader stub — from @gsd/pi-coding-agent resource-loader.
 */

// ============================================================================
// Types
// ============================================================================

export interface ResourceDiagnostic {
	type: string;
	message: string;
	path?: string;
}

export interface ResourceCollision {
	name: string;
	paths: string[];
}

export interface ResourceLoader {
	reload(): Promise<void>;
	getExtensionPaths(): string[];
	getSkillDirs(): string[];
	getPromptDirs(): string[];
	getThemePaths(): string[];
}

// ============================================================================
// DefaultResourceLoader
// ============================================================================

export class DefaultResourceLoader implements ResourceLoader {
	constructor(_options?: {
		agentDir?: string;
		additionalExtensionPaths?: string[];
		appendSystemPrompt?: string;
	}) {
		// Stub
	}

	async reload(): Promise<void> {
		// Stub
	}

	getExtensionPaths(): string[] {
		return [];
	}

	getSkillDirs(): string[] {
		return [];
	}

	getPromptDirs(): string[] {
		return [];
	}

	getThemePaths(): string[] {
		return [];
	}
}
