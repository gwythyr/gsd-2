/**
 * Compaction stubs — from @gsd/pi-coding-agent compaction module.
 */

import type { CompactionSettings } from "../types/settings.js";

// ============================================================================
// Types
// ============================================================================

export interface CompactionResult {
	summary: string;
	firstKeptEntryId: string;
	tokensBefore: number;
	details?: unknown;
}

export interface CompactionPreparation {
	entries: any[];
	summary?: string;
}

export interface CutPointResult {
	cutIndex: number;
	tokensBefore: number;
}

export interface CollectEntriesResult {
	entries: any[];
	fromId: string;
	toId: string;
}

export interface BranchPreparation {
	entries: any[];
	fromId: string;
}

export interface BranchSummaryResult {
	summary: string;
	details?: unknown;
}

export interface GenerateBranchSummaryOptions {
	entries: any[];
	customInstructions?: string;
	replaceInstructions?: boolean;
	signal?: AbortSignal;
}

export interface FileOperations {
	readFile: (path: string) => string;
	writeFile: (path: string, content: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_COMPACTION_SETTINGS: CompactionSettings = {
	enabled: true,
	reserveTokens: 16384,
	keepRecentTokens: 20000,
};

// ============================================================================
// Functions
// ============================================================================

export function compact(..._args: any[]): Promise<CompactionResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function shouldCompact(_contextTokens: number, _contextWindow: number, _settings?: CompactionSettings): boolean {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function estimateTokens(_text: string): number {
	// Simple approximation: ~4 chars per token
	return Math.ceil(_text.length / 4);
}

export function calculateContextTokens(_messages: any[]): number {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function findCutPoint(..._args: any[]): CutPointResult {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function findTurnStartIndex(_entries: any[], _targetIndex: number): number {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function collectEntriesForBranchSummary(..._args: any[]): CollectEntriesResult {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function generateBranchSummary(_options: GenerateBranchSummaryOptions): Promise<BranchSummaryResult> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function generateSummary(..._args: any[]): Promise<string> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function serializeConversation(_messages: any[]): string {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function prepareBranchEntries(..._args: any[]): BranchPreparation {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getLastAssistantUsage(_messages: any[]): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}
