/**
 * UI component stubs — no-op versions of all UI components from pi-coding-agent.
 * These are used for interactive mode rendering and are all stubs in the adapter.
 */

// ============================================================================
// Component stubs — all return undefined or are no-ops
// ============================================================================

export function AssistantMessageComponent(..._args: any[]): any { return undefined; }
export function BashExecutionComponent(..._args: any[]): any { return undefined; }
export function FooterComponent(..._args: any[]): any { return undefined; }
export function ToolExecutionComponent(..._args: any[]): any { return undefined; }
export function UserMessageComponent(..._args: any[]): any { return undefined; }
export function ModelSelectorComponent(..._args: any[]): any { return undefined; }
export function SessionSelectorComponent(..._args: any[]): any { return undefined; }
export function ArminComponent(..._args: any[]): any { return undefined; }
export function BorderedLoader(..._args: any[]): any { return undefined; }
export function BranchSummaryMessageComponent(..._args: any[]): any { return undefined; }
export function CompactionSummaryMessageComponent(..._args: any[]): any { return undefined; }
export function CustomMessageComponent(..._args: any[]): any { return undefined; }
export function DynamicBorder(..._args: any[]): any { return undefined; }
export function ExtensionEditorComponent(..._args: any[]): any { return undefined; }
export function ExtensionInputComponent(..._args: any[]): any { return undefined; }
export function ExtensionSelectorComponent(..._args: any[]): any { return undefined; }
export function LoginDialogComponent(..._args: any[]): any { return undefined; }
export function OAuthSelectorComponent(..._args: any[]): any { return undefined; }
export function ProviderManagerComponent(..._args: any[]): any { return undefined; }
export function SettingsSelectorComponent(..._args: any[]): any { return undefined; }
export function ShowImagesSelectorComponent(..._args: any[]): any { return undefined; }
export function SkillInvocationMessageComponent(..._args: any[]): any { return undefined; }
export function ThemeSelectorComponent(..._args: any[]): any { return undefined; }
export function ThinkingSelectorComponent(..._args: any[]): any { return undefined; }
export function TreeSelectorComponent(..._args: any[]): any { return undefined; }
export function UserMessageSelectorComponent(..._args: any[]): any { return undefined; }

// ============================================================================
// Custom Editor base class stub
// ============================================================================

export class CustomEditor {
	constructor(..._args: any[]) {
		// Stub
	}

	handleInput(_data: string): void {
		// Stub
	}
}

// ============================================================================
// Utility functions
// ============================================================================

export function appKey(_action: string): string { return ""; }
export function appKeyHint(_action: string): string { return ""; }
export function editorKey(_action: string): string { return ""; }
export function keyHint(_key: string, _label: string): string { return ""; }
export function rawKeyHint(_key: string, _label: string): string { return ""; }

export function renderDiff(_oldContent: string, _newContent: string, _options?: RenderDiffOptions): any {
	return undefined;
}

export function truncateToVisualLines(_text: string, _maxLines: number): VisualTruncateResult {
	return { text: _text, truncated: false, lineCount: _text.split("\n").length };
}

// ============================================================================
// Types
// ============================================================================

export interface RenderDiffOptions {
	contextLines?: number;
	expanded?: boolean;
}

export interface SettingsCallbacks {
	onSave?: () => void;
	onCancel?: () => void;
}

export interface SettingsConfig {
	title: string;
	settings: any[];
}

export interface ToolExecutionOptions {
	expanded?: boolean;
	isPartial?: boolean;
}

export interface VisualTruncateResult {
	text: string;
	truncated: boolean;
	lineCount: number;
}
