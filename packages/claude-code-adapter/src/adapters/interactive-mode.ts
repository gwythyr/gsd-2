/**
 * Interactive mode adapter — stubs for the TUI and non-interactive modes.
 */

// ============================================================================
// Interactive Mode
// ============================================================================

export interface InteractiveModeOptions {
	session: any;
	extensionsResult?: any;
}

export class InteractiveMode {
	constructor(_session: any, _options?: InteractiveModeOptions) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	async run(): Promise<void> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// Print Mode
// ============================================================================

export interface PrintModeOptions {
	mode?: string;
	messages?: any[];
	prompt?: string;
	model?: any;
	tools?: string[];
	appendSystemPrompt?: string;
	noSession?: boolean;
}

export async function runPrintMode(_session: any, _options: PrintModeOptions): Promise<void> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// RPC Mode
// ============================================================================

export async function runRpcMode(_session: any): Promise<void> {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

// ============================================================================
// RPC Client
// ============================================================================

export interface RpcClientOptions {
	command?: string;
	args?: string[];
	cwd?: string;
}

export interface RpcEventListener {
	onMessage?: (message: any) => void;
	onToolResult?: (result: any) => void;
	onError?: (error: any) => void;
	onClose?: () => void;
}

export type RpcCommand = {
	type: string;
	[key: string]: unknown;
};

export type RpcResponse = {
	type: string;
	[key: string]: unknown;
};

export type RpcSessionState = {
	id: string;
	cwd: string;
	model?: string;
	[key: string]: unknown;
};

export class RpcClient {
	constructor(_options?: RpcClientOptions) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	async connect(): Promise<void> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	async send(_command: RpcCommand): Promise<RpcResponse> {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	close(): void {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// JSONL utilities
// ============================================================================

export function attachJsonlLineReader(
	_stream: any,
	_handler: (line: any) => void,
): void {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function serializeJsonLine(data: unknown): string {
	return JSON.stringify(data) + "\n";
}
