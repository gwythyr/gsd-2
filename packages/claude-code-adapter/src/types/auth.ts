/**
 * Auth storage — simplified for Claude Code SDK migration.
 *
 * When running inside Claude Code (Max subscription), auth is handled natively
 * by the SDK. This implementation provides a thin layer that:
 * - Checks ANTHROPIC_API_KEY env var
 * - Returns a no-op credential when Claude Code handles auth
 * - Stores credentials in-memory for the session
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
		// TODO: Implement file-based locking if persistent auth is needed
		throw new Error("Not implemented: FileAuthStorageBackend not needed for Claude Code SDK");
	}

	async withLockAsync<T>(_fn: (current: string | undefined) => Promise<{ result: T; next?: string }>): Promise<T> {
		// TODO: Implement file-based locking if persistent auth is needed
		throw new Error("Not implemented: FileAuthStorageBackend not needed for Claude Code SDK");
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
// AuthStorage — working implementation for Claude Code SDK
// ============================================================================

/** No-op credential used when Claude Code handles auth natively (Max subscription) */
const CLAUDE_CODE_NATIVE_CREDENTIAL: ApiKeyCredential = {
	type: "api_key",
	key: "__claude_code_native__",
};

export class AuthStorage {
	private credentials: Map<string, AuthCredential> = new Map();
	private fallbackResolver?: (provider: string) => string | undefined;

	private constructor() {
		// Seed from ANTHROPIC_API_KEY env var if available
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (apiKey) {
			this.credentials.set("anthropic", { type: "api_key", key: apiKey });
		}

		// If running inside Claude Code (detected by env), register native credential
		if (this.isClaudeCodeNative()) {
			this.credentials.set("anthropic", CLAUDE_CODE_NATIVE_CREDENTIAL);
		}
	}

	/**
	 * Create a simplified AuthStorage.
	 * The authPath parameter is accepted for interface compatibility but
	 * ignored — credentials are held in-memory for the session.
	 */
	static create(_authPath?: string): AuthStorage {
		return new AuthStorage();
	}

	/** Check if we're running inside Claude Code (Max subscription) */
	private isClaudeCodeNative(): boolean {
		// Claude Code sets these env vars when running as a native tool
		return !!(
			process.env.CLAUDE_CODE ||
			process.env.CLAUDE_CODE_ENTRYPOINT
		);
	}

	// ── Credential access ──────────────────────────────────────────────────

	/** Get the API key for a provider, checking stored creds then fallback resolver */
	getApiKey(provider: string): string | undefined {
		const cred = this.credentials.get(provider);
		if (cred?.type === "api_key" && cred.key) {
			return cred.key;
		}
		// Try fallback resolver (e.g. env var resolver)
		return this.fallbackResolver?.(provider);
	}

	/** Get the stored credential for a provider */
	getCredential(provider: string): AuthCredential | undefined {
		return this.credentials.get(provider);
	}

	/** Get all credentials for a provider (returns array for interface compat) */
	getCredentials(provider: string): AuthCredential[] {
		const cred = this.credentials.get(provider);
		return cred ? [cred] : [];
	}

	/** Check if any credentials exist for a provider */
	hasCredentials(provider: string): boolean {
		return this.credentials.has(provider) || !!this.fallbackResolver?.(provider);
	}

	/** Check if any credentials are stored at all */
	hasAnyCredentials(): boolean {
		return this.credentials.size > 0;
	}

	// ── Methods used by onboarding / wizard / pi-migration ────────────────

	/** Get a credential by provider id (alias for getCredential) */
	get(provider: string): AuthCredential | undefined {
		return this.credentials.get(provider);
	}

	/** Store a credential for a provider */
	set(provider: string, credential: AuthCredential): void {
		this.credentials.set(provider, credential);
	}

	/** Check if a provider has a stored credential */
	has(provider: string): boolean {
		return this.credentials.has(provider);
	}

	/** Check if a provider has auth (credentials or env-based) */
	hasAuth(provider: string): boolean {
		if (this.credentials.has(provider)) return true;
		if (this.fallbackResolver?.(provider)) return true;
		// Check common env var patterns
		const envKey = this.getEnvVarForProvider(provider);
		return envKey ? !!process.env[envKey] : false;
	}

	/** List all provider ids that have stored credentials */
	list(): string[] {
		return Array.from(this.credentials.keys());
	}

	/** Set an API key for a provider */
	setApiKey(provider: string, key: string): void {
		this.credentials.set(provider, { type: "api_key", key });
	}

	/** Remove an API key for a provider */
	removeApiKey(provider: string): void {
		this.credentials.delete(provider);
	}

	/** Set a fallback resolver for provider keys (e.g. env var lookup) */
	setFallbackResolver(resolver: (provider: string) => string | undefined): void {
		this.fallbackResolver = resolver;
	}

	/**
	 * Get OAuth providers — returns empty array since Claude Code SDK
	 * handles auth natively and doesn't need OAuth flows.
	 * TODO: Re-implement if OAuth providers are needed in adapter mode.
	 */
	getOAuthProviders(): Array<{ id: string; name?: string; usesCallbackServer?: boolean }> {
		return [];
	}

	/**
	 * Login via OAuth — no-op in Claude Code SDK mode.
	 * TODO: Re-implement if OAuth login is needed in adapter mode.
	 */
	async login(_providerId: string, _options?: unknown): Promise<void> {
		// OAuth flows are not supported in Claude Code SDK mode
		throw new Error("OAuth login not available — use ANTHROPIC_API_KEY or Claude Code native auth");
	}

	// ── Private helpers ────────────────────────────────────────────────────

	/** Map provider id to its conventional env var name */
	private getEnvVarForProvider(provider: string): string | undefined {
		const map: Record<string, string> = {
			anthropic: "ANTHROPIC_API_KEY",
			openai: "OPENAI_API_KEY",
			google: "GOOGLE_API_KEY",
			groq: "GROQ_API_KEY",
			xai: "XAI_API_KEY",
			openrouter: "OPENROUTER_API_KEY",
			mistral: "MISTRAL_API_KEY",
		};
		return map[provider];
	}
}
