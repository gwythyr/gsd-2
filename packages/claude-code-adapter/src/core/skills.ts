/**
 * Skills system stubs — from @gsd/pi-coding-agent skills.
 */

// ============================================================================
// Types
// ============================================================================

export interface SkillFrontmatter {
	name?: string;
	description?: string;
	"disable-model-invocation"?: boolean;
	[key: string]: unknown;
}

export interface Skill {
	name: string;
	description: string;
	filePath: string;
	baseDir: string;
	source: string;
	disableModelInvocation: boolean;
}

export interface LoadSkillsResult {
	skills: Skill[];
	diagnostics: Array<{ type: string; message: string; path?: string }>;
}

export interface LoadSkillsFromDirOptions {
	dir: string;
	source: string;
	baseDir?: string;
}

// ============================================================================
// Functions
// ============================================================================

export function loadSkills(_dirs: string[], _source?: string): LoadSkillsResult {
	return { skills: [], diagnostics: [] };
}

export function loadSkillsFromDir(_options: LoadSkillsFromDirOptions): LoadSkillsResult {
	return { skills: [], diagnostics: [] };
}

export function formatSkillsForPrompt(_skills: Skill[]): string {
	return "";
}
