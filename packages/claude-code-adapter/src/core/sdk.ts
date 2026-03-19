/**
 * SDK stubs — tool factories and session creation from @gsd/pi-coding-agent sdk.
 */

// ============================================================================
// Re-export session adapter
// ============================================================================

export {
	createAgentSession,
	type CreateAgentSessionOptions,
	type CreateAgentSessionResult,
} from "../adapters/session-adapter.js";

// ============================================================================
// Prompt Template
// ============================================================================

export interface PromptTemplate {
	name: string;
	content: string;
	filePath: string;
	source: string;
}

// ============================================================================
// Tool factories — stubs that throw
// ============================================================================

export function createBashTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createCodingTools(_options?: any): any[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createEditTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createFindTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createGrepTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createLsTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createReadTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createWriteTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createReadOnlyTools(_options?: any): any[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createHashlineEditTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createHashlineReadTool(_options?: any): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function createHashlineCodingTools(_options?: any): any[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// Pre-built tools (these would normally use process.cwd())
// ============================================================================

export const readOnlyTools: any[] = [];
export const bashTool: any = null;
export const editTool: any = null;
export const readTool: any = null;
export const writeTool: any = null;
export const grepTool: any = null;
export const findTool: any = null;
export const lsTool: any = null;
export const codingTools: any[] = [];
export const hashlineEditTool: any = null;
export const hashlineReadTool: any = null;
export const hashlineCodingTools: any[] = [];
