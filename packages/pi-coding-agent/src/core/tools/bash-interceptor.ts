/**
 * Bash command interceptor — blocks shell commands that duplicate dedicated tools.
 *
 * Each rule defines a regex pattern, a suggested replacement tool, and a message.
 * A command is only blocked when the suggested tool exists in the session's active tool list.
 */

export interface BashInterceptorRule {
	pattern: string;
	flags?: string;
	tool: string;
	message: string;
}

export const DEFAULT_BASH_INTERCEPTOR_RULES: BashInterceptorRule[] = [
	{
		pattern: "^\\s*(cat|head|tail|less|more)\\s+",
		tool: "read",
		message: "Use the read tool to view file contents instead of shell commands.",
	},
	{
		pattern: "^\\s*(grep|rg|ripgrep|ag|ack)\\s+",
		tool: "grep",
		message: "Use the grep tool for searching file contents instead of shell commands.",
	},
	{
		pattern: "^\\s*(find|fd|locate)\\s+.*(-name|-iname|-type|--type|-glob)",
		tool: "find",
		message: "Use the find tool for locating files by name/type instead of shell commands.",
	},
	{
		pattern: "^\\s*sed\\s+(-i|--in-place)",
		tool: "edit",
		message: "Use the edit tool for in-place file modifications instead of sed.",
	},
	{
		pattern: "^\\s*perl\\s+.*-[pn]?i",
		tool: "edit",
		message: "Use the edit tool for in-place file modifications instead of perl.",
	},
	{
		pattern: "^\\s*awk\\s+.*-i\\s+inplace",
		tool: "edit",
		message: "Use the edit tool for in-place file modifications instead of awk.",
	},
	{
		pattern: "^\\s*(echo|printf|cat\\s*<<)\\s+.*[^|]>\\s*\\S",
		tool: "write",
		message: "Use the write tool to create/overwrite files instead of shell redirects.",
	},
];

export interface InterceptionResult {
	block: boolean;
	message?: string;
	suggestedTool?: string;
}

/**
 * Compile rules into regex objects, silently skipping invalid patterns.
 */
function compileRules(rules: BashInterceptorRule[]): Array<{ regex: RegExp; rule: BashInterceptorRule }> {
	return rules.flatMap((rule) => {
		try {
			return [{ regex: new RegExp(rule.pattern, rule.flags), rule }];
		} catch {
			return []; // skip invalid regex
		}
	});
}

/**
 * Check whether a bash command should be intercepted.
 *
 * @param command - The shell command to check
 * @param availableTools - Tool names present in the current session
 * @param rules - Override the default rule set (optional)
 */
export function checkBashInterception(
	command: string,
	availableTools: string[],
	rules?: BashInterceptorRule[],
): InterceptionResult {
	const effectiveRules = rules ?? DEFAULT_BASH_INTERCEPTOR_RULES;
	const compiled = compileRules(effectiveRules);
	const trimmed = command.trim();

	for (const { regex, rule } of compiled) {
		if (regex.test(trimmed) && availableTools.includes(rule.tool)) {
			return {
				block: true,
				message: `Blocked: ${rule.message}\n\nOriginal command: ${command}`,
				suggestedTool: rule.tool,
			};
		}
	}

	return { block: false };
}
