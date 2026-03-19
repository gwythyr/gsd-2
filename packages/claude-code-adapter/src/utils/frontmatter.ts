/**
 * Frontmatter parsing — copied from @gsd/pi-coding-agent utils/frontmatter.
 * This is a pure utility function with minimal deps.
 */

type ParsedFrontmatter<T extends Record<string, unknown>> = {
	frontmatter: T;
	body: string;
};

const normalizeNewlines = (value: string): string => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const extractFrontmatter = (content: string): { yamlString: string | null; body: string } => {
	const normalized = normalizeNewlines(content);

	if (!normalized.startsWith("---")) {
		return { yamlString: null, body: normalized };
	}

	const endIndex = normalized.indexOf("\n---", 3);
	if (endIndex === -1) {
		return { yamlString: null, body: normalized };
	}

	return {
		yamlString: normalized.slice(4, endIndex),
		body: normalized.slice(endIndex + 4).trim(),
	};
};

/**
 * Simple YAML-like key:value parser for frontmatter.
 * Handles basic string/boolean/number values without full YAML dependency.
 */
function parseSimpleYaml(yamlString: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const line of yamlString.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;
		const key = trimmed.slice(0, colonIdx).trim();
		let value: unknown = trimmed.slice(colonIdx + 1).trim();
		// Try to parse as boolean/number
		if (value === "true") value = true;
		else if (value === "false") value = false;
		else if (value === "null" || value === "") value = undefined;
		else if (!isNaN(Number(value)) && value !== "") value = Number(value);
		// Strip surrounding quotes
		else if (typeof value === "string" && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
			value = value.slice(1, -1);
		}
		if (key) result[key] = value;
	}
	return result;
}

export const parseFrontmatter = <T extends Record<string, unknown> = Record<string, unknown>>(
	content: string,
): ParsedFrontmatter<T> => {
	const { yamlString, body } = extractFrontmatter(content);
	if (!yamlString) {
		return { frontmatter: {} as T, body };
	}
	const parsed = parseSimpleYaml(yamlString);
	return { frontmatter: (parsed ?? {}) as T, body };
};

export const stripFrontmatter = (content: string): string => parseFrontmatter(content).body;
