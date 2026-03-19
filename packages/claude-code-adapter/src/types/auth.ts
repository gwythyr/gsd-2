/**
 * Auth storage types — shimmed from @gsd/pi-coding-agent auth-storage.
 */

// ============================================================================
// Credential Types
// ============================================================================

export type ApiKeyCredential = {
	type: "api_key";
	key: string;
};

export type OAuthCredential = {
	type: "oauth";
	access: string;
	refresh?: string;
	expires?: number;
	[key: string]: unknown;
};

export type AuthCredential = ApiKeyCredential | OAuthCredential;

export type AuthStorageData = Record<string, AuthCredential | AuthCredential[]>;

// ============================================================================
// Auth Storage Backend
// ============================================================================

export interface AuthStorageBackend {
	withLock<T>(fn: (current: string | undefined) => { result: T; next?: string }): T;
	withLockAsync<T>(fn: (current: string | undefined) => Promise<{ result: T; next?: string }>): Promise<T>;
}

export class FileAuthStorageBackend implements AuthStorageBackend {
	constructor(private authPath?: string) {}

	withLock<T>(_fn: (current: string | undefined) => { result: T; next?: string }): T {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	async withLockAsync<T>(_fn: (current: string | undefined) => Promise<{ result: T; next?: string }>): Promise<T> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

export class InMemoryAuthStorageBackend implements AuthStorageBackend {
	private data: string | undefined = undefined;

	withLock<T>(fn: (current: string | undefined) => { result: T; next?: string }): T {
		const { result, next } = fn(this.data);
		if (next !== undefined) this.data = next;
		return result;
	}

	async withLockAsync<T>(fn: (current: string | undefined) => Promise<{ result: T; next?: string }>): Promise<T> {
		const { result, next } = await fn(this.data);
		if (next !== undefined) this.data = next;
		return result;
	}
}

// ============================================================================
// AuthStorage
// ============================================================================

export class AuthStorage {
	private constructor() {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static create(_authPath?: string): AuthStorage {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getApiKey(_provider: string): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	setApiKey(_provider: string, _key: string): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	removeApiKey(_provider: string): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getCredentials(_provider: string): AuthCredential[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	hasCredentials(_provider: string): boolean {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	setFallbackResolver(_resolver: (provider: string) => string | undefined): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}
