/**
 * Blob store and artifact manager stubs.
 */

// ============================================================================
// BlobStore
// ============================================================================

export class BlobStore {
	constructor(_blobsDir?: string) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	store(_data: string | Buffer): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	retrieve(_ref: string): string | Buffer | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

export function isBlobRef(value: string): boolean {
	return value.startsWith("blob:");
}

export function parseBlobRef(ref: string): { hash: string } | undefined {
	if (!isBlobRef(ref)) return undefined;
	return { hash: ref.slice(5) };
}

export function externalizeImageData(_data: string, _blobStore: BlobStore): string {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function resolveImageData(_data: string, _blobStore: BlobStore): string {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// ArtifactManager
// ============================================================================

export class ArtifactManager {
	constructor() {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}
