/**
 * Text utilities — adapted from @gsd/pi-coding-agent tools module.
 */

export const DEFAULT_MAX_BYTES = 128 * 1024; // 128KB
export const DEFAULT_MAX_LINES = 5000;

/**
 * Truncate content from the head (keep the tail).
 */
export function truncateHead(
	content: string,
	options: { maxBytes?: number; maxLines?: number } = {},
): { content: string; truncated: boolean; originalSize: number } {
	const { maxBytes = DEFAULT_MAX_BYTES, maxLines = DEFAULT_MAX_LINES } = options;
	const originalSize = Buffer.byteLength(content, "utf-8");
	let result = content;
	let truncated = false;

	// Truncate by bytes
	if (Buffer.byteLength(result, "utf-8") > maxBytes) {
		const buf = Buffer.from(result, "utf-8");
		result = buf.subarray(buf.length - maxBytes).toString("utf-8");
		// Fix potential broken UTF-8 at the start
		const firstNewline = result.indexOf("\n");
		if (firstNewline > 0) {
			result = result.slice(firstNewline + 1);
		}
		truncated = true;
	}

	// Truncate by lines
	const lines = result.split("\n");
	if (lines.length > maxLines) {
		result = lines.slice(lines.length - maxLines).join("\n");
		truncated = true;
	}

	if (truncated) {
		result = `[... truncated ${formatSize(originalSize - Buffer.byteLength(result, "utf-8"))} ...]\n${result}`;
	}

	return { content: result, truncated, originalSize };
}

/**
 * Truncate a single line to maxBytes.
 */
export function truncateLine(line: string, maxBytes: number = 2048): string {
	if (Buffer.byteLength(line, "utf-8") <= maxBytes) return line;
	const buf = Buffer.from(line, "utf-8");
	return buf.subarray(0, maxBytes).toString("utf-8") + "...";
}

/**
 * Truncate content from the tail (keep the head).
 */
export function truncateTail(
	content: string,
	options: { maxBytes?: number; maxLines?: number } = {},
): { content: string; truncated: boolean; originalSize: number } {
	const { maxBytes = DEFAULT_MAX_BYTES, maxLines = DEFAULT_MAX_LINES } = options;
	const originalSize = Buffer.byteLength(content, "utf-8");
	let result = content;
	let truncated = false;

	// Truncate by lines
	const lines = result.split("\n");
	if (lines.length > maxLines) {
		result = lines.slice(0, maxLines).join("\n");
		truncated = true;
	}

	// Truncate by bytes
	if (Buffer.byteLength(result, "utf-8") > maxBytes) {
		const buf = Buffer.from(result, "utf-8");
		result = buf.subarray(0, maxBytes).toString("utf-8");
		truncated = true;
	}

	if (truncated) {
		result = `${result}\n[... truncated ${formatSize(originalSize - Buffer.byteLength(result, "utf-8"))} ...]`;
	}

	return { content: result, truncated, originalSize };
}

/**
 * Format a byte count as a human-readable string.
 */
export function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
