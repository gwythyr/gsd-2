/**
 * Tool types — shimmed from @gsd/pi-coding-agent tools module.
 */

import type {
	AgentToolResult,
	AgentToolUpdateCallback,
	BashToolCallEvent,
	BashToolResultEvent,
	CustomToolCallEvent,
	CustomToolResultEvent,
	EditToolCallEvent,
	EditToolResultEvent,
	FindToolCallEvent,
	FindToolResultEvent,
	GrepToolCallEvent,
	GrepToolResultEvent,
	LsToolCallEvent,
	LsToolResultEvent,
	ReadToolCallEvent,
	ReadToolResultEvent,
	TextContent,
	ImageContent,
	ToolCallEvent,
	ToolResultEvent,
	WriteToolCallEvent,
	WriteToolResultEvent,
} from "./extension-api.js";

// Re-export the tool call/result event types from extension-api
export type {
	AgentToolResult,
	AgentToolUpdateCallback,
	BashToolCallEvent,
	BashToolResultEvent,
	CustomToolCallEvent,
	CustomToolResultEvent,
	EditToolCallEvent,
	EditToolResultEvent,
	FindToolCallEvent,
	FindToolResultEvent,
	GrepToolCallEvent,
	GrepToolResultEvent,
	LsToolCallEvent,
	LsToolResultEvent,
	ReadToolCallEvent,
	ReadToolResultEvent,
	ToolCallEvent,
	ToolResultEvent,
	WriteToolCallEvent,
	WriteToolResultEvent,
};

// ============================================================================
// Tool Input Types
// ============================================================================

export interface BashToolInput {
	command: string;
	timeout?: number;
	description?: string;
}

export interface ReadToolInput {
	file_path: string;
	offset?: number;
	limit?: number;
}

export interface EditToolInput {
	file_path: string;
	old_string: string;
	new_string: string;
	replace_all?: boolean;
}

export interface WriteToolInput {
	file_path: string;
	content: string;
}

export interface GrepToolInput {
	pattern: string;
	path?: string;
	include?: string;
}

export interface FindToolInput {
	pattern: string;
	path?: string;
	type?: string;
}

export interface LsToolInput {
	path?: string;
}

// ============================================================================
// Tool Detail Types
// ============================================================================

export interface BashToolDetails {
	command: string;
	exitCode: number;
	stdout: string;
	stderr: string;
	durationMs: number;
}

export interface ReadToolDetails {
	filePath: string;
	lineCount: number;
	truncated: boolean;
}

export interface EditToolDetails {
	filePath: string;
	matchCount: number;
	diff: string;
}

export interface FindToolDetails {
	pattern: string;
	matchCount: number;
}

export interface GrepToolDetails {
	pattern: string;
	matchCount: number;
}

export interface LsToolDetails {
	path: string;
	entryCount: number;
}

// ============================================================================
// Tool Options Types
// ============================================================================

export interface BashToolOptions {
	cwd?: string;
	timeout?: number;
}

export interface ReadToolOptions {
	cwd?: string;
	maxBytes?: number;
	maxLines?: number;
}

export interface EditToolOptions {
	cwd?: string;
}

export interface WriteToolOptions {
	cwd?: string;
}

export interface GrepToolOptions {
	cwd?: string;
}

export interface FindToolOptions {
	cwd?: string;
}

export interface LsToolOptions {
	cwd?: string;
}

export interface ToolsOptions {
	cwd?: string;
}

// ============================================================================
// Truncation
// ============================================================================

export interface TruncationOptions {
	maxBytes?: number;
	maxLines?: number;
}

export interface TruncationResult {
	content: string;
	truncated: boolean;
	originalSize: number;
}

export const DEFAULT_MAX_BYTES = 128 * 1024; // 128KB
export const DEFAULT_MAX_LINES = 5000;

// ============================================================================
// Bash Interceptor
// ============================================================================

export interface BashInterceptorRule {
	pattern: string;
	message: string;
	allowOverride?: boolean;
}

export interface CompiledInterceptor {
	regex: RegExp;
	message: string;
	allowOverride: boolean;
}

export interface BashOperations {
	spawn: (command: string, options?: any) => any;
}

export interface BashSpawnContext {
	command: string;
	cwd: string;
}

export type BashSpawnHook = (ctx: BashSpawnContext) => BashSpawnContext | undefined;

// ============================================================================
// Hashline types
// ============================================================================

export interface HashlineEditInput {
	file_path: string;
	hash: string;
	old_string: string;
	new_string: string;
}

export interface HashlineEditToolDetails {
	filePath: string;
	diff: string;
}

export interface HashlineEditToolOptions {
	cwd?: string;
}

export interface HashlineReadToolDetails {
	filePath: string;
	lineCount: number;
	truncated: boolean;
}

export interface HashlineReadToolInput {
	file_path: string;
	offset?: number;
	limit?: number;
}

export interface HashlineReadToolOptions {
	cwd?: string;
}

// ============================================================================
// Edit Operations
// ============================================================================

export interface EditOperations {
	readFile: (path: string) => string;
	writeFile: (path: string, content: string) => void;
	fileExists: (path: string) => boolean;
}

export interface ReadOperations {
	readFile: (path: string) => string;
	fileExists: (path: string) => boolean;
	stat: (path: string) => { size: number };
}

export interface FindOperations {
	find: (pattern: string, path: string) => string[];
}

export interface GrepOperations {
	grep: (pattern: string, path: string, include?: string) => string[];
}

export interface LsOperations {
	readdir: (path: string) => string[];
	stat: (path: string) => { isDirectory: () => boolean; size: number };
}

export interface WriteOperations {
	writeFile: (path: string, content: string) => void;
	mkdirp: (path: string) => void;
}
