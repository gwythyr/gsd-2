/**
 * Session management types — shimmed from @gsd/pi-coding-agent session-manager.
 */

import type { AgentMessage, TextContent, ImageContent } from "./extension-api.js";

// ============================================================================
// Session Header & Entry Types
// ============================================================================

export const CURRENT_SESSION_VERSION = 3;

export interface SessionHeader {
	type: "session";
	version?: number;
	id: string;
	timestamp: string;
	cwd: string;
	parentSession?: string;
}

export interface NewSessionOptions {
	parentSession?: string;
}

export interface SessionEntryBase {
	type: string;
	id: string;
	parentId: string | null;
	timestamp: string;
}

export interface SessionMessageEntry extends SessionEntryBase {
	type: "message";
	message: AgentMessage;
}

export interface ThinkingLevelChangeEntry extends SessionEntryBase {
	type: "thinking_level_change";
	thinkingLevel: string;
}

export interface ModelChangeEntry extends SessionEntryBase {
	type: "model_change";
	provider: string;
	modelId: string;
}

export interface CompactionEntry<T = unknown> extends SessionEntryBase {
	type: "compaction";
	summary: string;
	firstKeptEntryId: string;
	tokensBefore: number;
	details?: T;
	fromHook?: boolean;
}

export interface BranchSummaryEntry<T = unknown> extends SessionEntryBase {
	type: "branch_summary";
	fromId: string;
	summary: string;
	details?: T;
	fromHook?: boolean;
}

export interface CustomEntry<T = unknown> extends SessionEntryBase {
	type: "custom";
	customType: string;
	data?: T;
}

export interface LabelEntry extends SessionEntryBase {
	type: "label";
	targetId: string;
	label: string | undefined;
}

export interface SessionInfoEntry extends SessionEntryBase {
	type: "session_info";
	name?: string;
}

export interface CustomMessageEntry<T = unknown> extends SessionEntryBase {
	type: "custom_message";
	customType: string;
	content: string | (TextContent | ImageContent)[];
	details?: T;
	display: boolean;
}

export type SessionEntry =
	| SessionMessageEntry
	| ThinkingLevelChangeEntry
	| ModelChangeEntry
	| CompactionEntry
	| BranchSummaryEntry
	| CustomEntry
	| CustomMessageEntry
	| LabelEntry
	| SessionInfoEntry;

export type FileEntry = SessionHeader | SessionEntry;

export interface SessionTreeNode {
	entry: SessionEntry;
	children: SessionTreeNode[];
	label?: string;
}

export interface SessionContext {
	messages: AgentMessage[];
	thinkingLevel: string;
	model: { provider: string; modelId: string } | null;
}

export interface SessionInfo {
	path: string;
	id: string;
	cwd: string;
	name?: string;
	parentSessionPath?: string;
	created: Date;
	modified: Date;
	messageCount: number;
	firstMessage: string;
	allMessagesText: string;
}

export interface SessionUsageTotals {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
}

// ============================================================================
// SessionManager
// ============================================================================

export class SessionManager {
	private constructor() {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static create(_cwd?: string, _dir?: string): SessionManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static inMemory(): SessionManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static continueRecent(_cwd: string, _dir?: string): SessionManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static open(_path: string, _dir?: string): SessionManager {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	static list(_cwd: string, _dir?: string): Promise<SessionInfo[]> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getCwd(): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getSessionDir(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getSessionId(): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getSessionFile(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getLeafId(): string | null {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getLeafEntry(): SessionEntry | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getEntry(_id: string): SessionEntry | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getLabel(_entryId: string): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getBranch(_leafId?: string | null): SessionEntry[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getHeader(): SessionHeader | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getEntries(): SessionEntry[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getUsageTotals(): SessionUsageTotals {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getTree(): SessionTreeNode[] {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getSessionName(): string | undefined {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

export type ReadonlySessionManager = Pick<
	SessionManager,
	| "getCwd"
	| "getSessionDir"
	| "getSessionId"
	| "getSessionFile"
	| "getLeafId"
	| "getLeafEntry"
	| "getEntry"
	| "getLabel"
	| "getBranch"
	| "getHeader"
	| "getEntries"
	| "getUsageTotals"
	| "getTree"
	| "getSessionName"
>;

// ============================================================================
// Session Utilities
// ============================================================================

export function buildSessionContext(
	_entries: SessionEntry[],
	_leafId?: string | null,
	_byId?: Map<string, SessionEntry>,
): SessionContext {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function parseSessionEntries(content: string): FileEntry[] {
	const entries: FileEntry[] = [];
	const lines = content.trim().split("\n");
	for (const line of lines) {
		if (!line.trim()) continue;
		try {
			const entry = JSON.parse(line) as FileEntry;
			entries.push(entry);
		} catch {
			// Skip malformed lines
		}
	}
	return entries;
}

export function migrateSessionEntries(_entries: FileEntry[]): void {
	// No-op stub — migrations handled by actual session manager
}

export function getLatestCompactionEntry(entries: SessionEntry[]): CompactionEntry | null {
	for (let i = entries.length - 1; i >= 0; i--) {
		if (entries[i].type === "compaction") {
			return entries[i] as CompactionEntry;
		}
	}
	return null;
}
