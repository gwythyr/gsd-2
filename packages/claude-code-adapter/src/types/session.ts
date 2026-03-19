/**
 * Session management — file-backed implementation for Claude Code adapter.
 *
 * Provides JSONL-based session storage compatible with the Pi SDK's
 * SessionManager. Sessions are stored as newline-delimited JSON files.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { join, basename } from "node:path";
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

export interface CustomMessageEntry<T = unknown> extends SessionEntryBase {
	type: "custom_message";
	customType: string;
	content: string | (TextContent | ImageContent)[];
	details?: T;
	display: boolean;
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
// SessionManager — working file-backed implementation
// ============================================================================

type SessionMode = "create" | "continue" | "open" | "in-memory";

export class SessionManager {
	private _cwd: string;
	private _sessionDir: string | undefined;
	private _sessionFile: string | undefined;
	private _sessionId: string;
	private _header: SessionHeader | undefined;
	private _entries: SessionEntry[] = [];
	private _mode: SessionMode;

	private constructor(mode: SessionMode, cwd: string, sessionDir?: string, sessionFile?: string) {
		this._mode = mode;
		this._cwd = cwd;
		this._sessionDir = sessionDir;
		this._sessionId = crypto.randomUUID();

		if (sessionFile) {
			this._sessionFile = sessionFile;
			this._loadFromFile(sessionFile);
		} else if (mode === "create" && sessionDir) {
			// Create a new session file
			mkdirSync(sessionDir, { recursive: true });
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			this._sessionFile = join(sessionDir, `${timestamp}.jsonl`);
			this._header = {
				type: "session",
				version: CURRENT_SESSION_VERSION,
				id: this._sessionId,
				timestamp: new Date().toISOString(),
				cwd,
			};
			this._writeHeader();
		}
	}

	/**
	 * Create a new session.
	 */
	static create(cwd?: string, dir?: string): SessionManager {
		return new SessionManager("create", cwd ?? process.cwd(), dir);
	}

	/**
	 * Create an in-memory session (no file persistence).
	 */
	static inMemory(): SessionManager {
		return new SessionManager("in-memory", process.cwd());
	}

	/**
	 * Continue the most recent session for a given cwd.
	 */
	static continueRecent(cwd: string, dir?: string): SessionManager {
		if (dir && existsSync(dir)) {
			const sessionDir = dir;
			try {
				const files = readdirSync(sessionDir)
					.filter((f: string) => f.endsWith(".jsonl"))
					.map((f: string) => ({
						name: f,
						path: join(sessionDir, f),
						mtime: statSync(join(sessionDir, f)).mtimeMs,
					}))
					.sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime);

				if (files.length > 0) {
					return new SessionManager("continue", cwd, sessionDir, files[0].path);
				}
			} catch {
				// Fall through to create
			}
		}
		return SessionManager.create(cwd, dir);
	}

	/**
	 * Open a specific session file.
	 */
	static open(path: string, dir?: string): SessionManager {
		const cwd = process.cwd();
		return new SessionManager("open", cwd, dir, path);
	}

	/**
	 * List sessions for a given cwd.
	 */
	static async list(cwd: string, dir?: string): Promise<SessionInfo[]> {
		if (!dir || !existsSync(dir)) return [];

		const results: SessionInfo[] = [];
		try {
			const files = readdirSync(dir).filter((f: string) => f.endsWith(".jsonl"));
			for (const file of files) {
				const filePath = join(dir, file);
				try {
					const stat = statSync(filePath);
					const content = readFileSync(filePath, "utf-8");
					const entries = parseSessionEntries(content);

					const header = entries.find((e) => e.type === "session") as SessionHeader | undefined;
					const messages = entries.filter(
						(e): e is SessionMessageEntry =>
							(e as SessionEntry).type === "message",
					);
					const firstUserMsg = messages.find(
						(m) => m.message?.role === "user",
					);
					let firstMessage = "";
					if (firstUserMsg?.message?.content) {
						const content = firstUserMsg.message.content;
						if (typeof content === "string") {
							firstMessage = content;
						} else if (Array.isArray(content)) {
							const textPart = content.find(
								(c: any) => c.type === "text",
							) as TextContent | undefined;
							if (textPart) firstMessage = textPart.text;
						}
					}

					results.push({
						path: filePath,
						id: header?.id ?? basename(file, ".jsonl"),
						cwd: header?.cwd ?? cwd,
						created: new Date(header?.timestamp ?? stat.birthtime),
						modified: stat.mtime,
						messageCount: messages.length,
						firstMessage,
						allMessagesText: "",
					});
				} catch {
					// Skip unreadable sessions
				}
			}
		} catch {
			// Directory not readable
		}

		// Sort by most recent first
		results.sort((a, b) => b.modified.getTime() - a.modified.getTime());
		return results;
	}

	// ── Instance methods ─────────────────────────────────────────────────

	getCwd(): string {
		return this._cwd;
	}

	getSessionDir(): string | undefined {
		return this._sessionDir;
	}

	getSessionId(): string {
		return this._sessionId;
	}

	getSessionFile(): string | undefined {
		return this._sessionFile;
	}

	getLeafId(): string | null {
		if (this._entries.length === 0) return null;
		return this._entries[this._entries.length - 1].id;
	}

	getLeafEntry(): SessionEntry | undefined {
		return this._entries[this._entries.length - 1];
	}

	getEntry(id: string): SessionEntry | undefined {
		return this._entries.find((e) => e.id === id);
	}

	getLabel(entryId: string): string | undefined {
		const labelEntry = this._entries.find(
			(e): e is LabelEntry => e.type === "label" && (e as LabelEntry).targetId === entryId,
		);
		return labelEntry?.label;
	}

	getBranch(_leafId?: string | null): SessionEntry[] {
		// Simplified: return all entries (no tree branching support yet)
		// TODO: Implement proper tree traversal for branching sessions
		return [...this._entries];
	}

	getHeader(): SessionHeader | undefined {
		return this._header;
	}

	getEntries(): SessionEntry[] {
		return [...this._entries];
	}

	getUsageTotals(): SessionUsageTotals {
		// TODO: Calculate from message entries' usage data
		return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
	}

	getTree(): SessionTreeNode[] {
		// Simplified flat tree
		return this._entries.map((entry) => ({
			entry,
			children: [],
		}));
	}

	getSessionName(): string | undefined {
		const infoEntry = this._entries.find(
			(e): e is SessionInfoEntry => e.type === "session_info",
		);
		return infoEntry?.name;
	}

	// ── Private helpers ──────────────────────────────────────────────────

	private _loadFromFile(filePath: string): void {
		if (!existsSync(filePath)) return;
		try {
			const content = readFileSync(filePath, "utf-8");
			const entries = parseSessionEntries(content);
			for (const entry of entries) {
				if (entry.type === "session") {
					this._header = entry as SessionHeader;
					this._sessionId = this._header.id;
				} else {
					this._entries.push(entry as SessionEntry);
				}
			}
		} catch {
			// Non-fatal
		}
	}

	private _writeHeader(): void {
		if (this._mode === "in-memory" || !this._sessionFile || !this._header) return;
		try {
			writeFileSync(this._sessionFile, JSON.stringify(this._header) + "\n", "utf-8");
		} catch {
			// Non-fatal
		}
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
	entries: SessionEntry[],
	_leafId?: string | null,
	_byId?: Map<string, SessionEntry>,
): SessionContext {
	const messages: AgentMessage[] = [];
	let thinkingLevel = "off";
	let model: { provider: string; modelId: string } | null = null;

	for (const entry of entries) {
		if (entry.type === "message") {
			messages.push((entry as SessionMessageEntry).message);
		} else if (entry.type === "thinking_level_change") {
			thinkingLevel = (entry as ThinkingLevelChangeEntry).thinkingLevel;
		} else if (entry.type === "model_change") {
			const mc = entry as ModelChangeEntry;
			model = { provider: mc.provider, modelId: mc.modelId };
		}
	}

	return { messages, thinkingLevel, model };
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
