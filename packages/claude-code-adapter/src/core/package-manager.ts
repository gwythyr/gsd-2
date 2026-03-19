/**
 * Package manager stub — from @gsd/pi-coding-agent package-manager.
 */

// ============================================================================
// Types
// ============================================================================

export interface PathMetadata {
	source: string;
	packageName: string;
}

export interface ResolvedResource {
	path: string;
	metadata: PathMetadata;
}

export interface ResolvedPaths {
	extensions: ResolvedResource[];
	skills: ResolvedResource[];
	prompts: ResolvedResource[];
	themes: ResolvedResource[];
}

export interface ProgressEvent {
	type: "install" | "resolve" | "complete" | "error";
	package: string;
	message?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export interface PackageManager {
	resolve(packages: any[], onProgress?: ProgressCallback): Promise<ResolvedPaths>;
}

// ============================================================================
// DefaultPackageManager
// ============================================================================

export class DefaultPackageManager implements PackageManager {
	constructor(_cacheDir?: string) {
		// Stub
	}

	async resolve(_packages: any[], _onProgress?: ProgressCallback): Promise<ResolvedPaths> {
		return { extensions: [], skills: [], prompts: [], themes: [] };
	}
}
