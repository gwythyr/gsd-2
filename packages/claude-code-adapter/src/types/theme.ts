/**
 * Theme types — shimmed from @gsd/pi-coding-agent interactive theme.
 */

// ============================================================================
// ThemeColor
// ============================================================================

export type ThemeColor =
	| "accent"
	| "border"
	| "borderAccent"
	| "borderMuted"
	| "success"
	| "error"
	| "warning"
	| "muted"
	| "dim"
	| "text"
	| "thinkingText"
	| "userMessageText"
	| "customMessageText"
	| "customMessageLabel"
	| "toolTitle"
	| "toolOutput"
	| "mdHeading"
	| "mdLink"
	| "mdLinkUrl"
	| "mdCode"
	| "mdCodeBlock"
	| "mdCodeBlockBorder"
	| "mdQuote"
	| "mdQuoteBorder"
	| "mdHr"
	| "mdListBullet"
	| "toolDiffAdded"
	| "toolDiffRemoved"
	| "toolDiffContext"
	| "syntaxComment"
	| "syntaxKeyword"
	| "syntaxFunction"
	| "syntaxVariable"
	| "syntaxString"
	| "syntaxNumber"
	| "syntaxType"
	| "syntaxOperator"
	| "syntaxPunctuation"
	| "thinkingOff"
	| "thinkingMinimal"
	| "thinkingLow"
	| "thinkingMedium"
	| "thinkingHigh"
	| "thinkingXhigh"
	| "bashMode";

export type ThemeBg =
	| "selectedBg"
	| "userMessageBg"
	| "customMessageBg"
	| "toolPendingBg"
	| "toolSuccessBg"
	| "toolErrorBg";

// ============================================================================
// Theme class
// ============================================================================

export class Theme {
	readonly name?: string;
	readonly sourcePath?: string;

	constructor(
		_fgColors: Record<ThemeColor, string | number>,
		_bgColors: Record<ThemeBg, string | number>,
		_mode: "truecolor" | "256color",
		_options: { name?: string; sourcePath?: string } = {},
	) {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	fg(_color: ThemeColor, _text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	bg(_color: ThemeBg, _text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	bold(_text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	italic(_text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	underline(_text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	inverse(_text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	strikethrough(_text: string): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getFgAnsi(_color: ThemeColor): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getBgAnsi(_color: ThemeBg): string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getColorMode(): "truecolor" | "256color" {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getThinkingBorderColor(_level: "off" | "minimal" | "low" | "medium" | "high" | "xhigh"): (str: string) => string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}

	getBashModeBorderColor(): (str: string) => string {
		throw new Error("Not implemented: use claude-code-adapter implementation");
	}
}

// ============================================================================
// Theme functions
// ============================================================================

export function initTheme(_themeName?: string, _enableWatcher?: boolean): void {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getMarkdownTheme(): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function highlightCode(_code: string, _lang?: string): string[] {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getLanguageFromPath(_filePath: string): string | undefined {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getSelectListTheme(): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}

export function getSettingsListTheme(): any {
	throw new Error("Not implemented: use claude-code-adapter implementation");
}
