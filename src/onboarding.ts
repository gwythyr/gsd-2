/**
 * Simplified onboarding for Claude Code SDK migration.
 *
 * Key simplifications vs. the original multi-provider wizard:
 * - If ANTHROPIC_API_KEY is set OR running inside Claude Code, skip entirely
 * - If no auth available, just prompt for ANTHROPIC_API_KEY
 * - Removed: multi-provider selection (OAuth, GitHub Copilot, Google, etc.)
 * - Removed: web search provider selection step
 * - Removed: remote questions (Discord/Slack/Telegram) setup step
 * - Removed: tool API keys step (Context7, Jina, Groq)
 * - Removed: custom OpenAI-compatible endpoint flow
 *
 * All removed sections are marked with REMOVED comments below.
 */

import type { AuthStorage } from '@gsd/claude-code-adapter'

// ─── Types ────────────────────────────────────────────────────────────────────

type ClackModule = typeof import('@clack/prompts')
type PicoModule = {
  cyan: (s: string) => string
  green: (s: string) => string
  yellow: (s: string) => string
  dim: (s: string) => string
  bold: (s: string) => string
  red: (s: string) => string
  reset: (s: string) => string
}

// ─── Dynamic imports ──────────────────────────────────────────────────────────

async function loadClack(): Promise<ClackModule> {
  try {
    return await import('@clack/prompts')
  } catch {
    throw new Error('[gsd] @clack/prompts not found — onboarding wizard requires this dependency')
  }
}

async function loadPico(): Promise<PicoModule> {
  try {
    const mod = await import('picocolors')
    return mod.default ?? mod
  } catch {
    const identity = (s: string) => s
    return { cyan: identity, green: identity, yellow: identity, dim: identity, bold: identity, red: identity, reset: identity }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Determine if the onboarding wizard should run.
 *
 * Returns false (skip wizard) when:
 * - ANTHROPIC_API_KEY env var is set
 * - Running inside Claude Code (native auth)
 * - A default provider is already configured in settings
 * - Any provider has stored credentials
 * - Not a TTY (piped input, subagent, CI)
 *
 * Returns true only when no auth is available at all.
 */
export function shouldRunOnboarding(authStorage: AuthStorage, settingsDefaultProvider?: string): boolean {
  if (!process.stdin.isTTY) return false
  if (settingsDefaultProvider) return false

  // Claude Code SDK handles auth natively
  if (process.env.ANTHROPIC_API_KEY) return false
  if (process.env.CLAUDE_CODE || process.env.CLAUDE_CODE_ENTRYPOINT) return false

  // Check if any provider has credentials
  const hasAnyAuth = authStorage.hasAnyCredentials?.() ?? authStorage.list?.().length > 0
  return !hasAnyAuth
}

/**
 * Run the simplified onboarding wizard.
 *
 * Only prompts for ANTHROPIC_API_KEY — all other provider flows have been
 * removed for the Claude Code SDK migration.
 */
export async function runOnboarding(authStorage: AuthStorage): Promise<void> {
  let p: ClackModule
  let pc: PicoModule
  try {
    ;[p, pc] = await Promise.all([loadClack(), loadPico()])
  } catch (err) {
    process.stderr.write(`[gsd] Onboarding wizard unavailable: ${err instanceof Error ? err.message : String(err)}\n`)
    return
  }

  // ── Intro ─────────────────────────────────────────────────────────────────
  // REMOVED: renderLogo — the logo import was from ./logo.js which may not exist in adapter
  p.intro(pc.bold('Welcome to GSD — let\'s get you set up'))

  // ── Prompt for Anthropic API key ──────────────────────────────────────────
  p.log.info('GSD uses Claude via the Anthropic API.')
  p.log.info(pc.dim('Get your API key at: https://console.anthropic.com/settings/keys'))

  const key = await p.password({
    message: 'Paste your Anthropic API key:',
    mask: '●',
  })

  if (p.isCancel(key) || !key) {
    p.cancel('Setup cancelled — set ANTHROPIC_API_KEY env var to use GSD.')
    return
  }

  const trimmed = (key as string).trim()
  if (!trimmed) {
    p.cancel('No key provided — set ANTHROPIC_API_KEY env var to use GSD.')
    return
  }

  // Basic prefix validation
  if (!trimmed.startsWith('sk-ant-')) {
    p.log.warn('Key doesn\'t start with expected prefix (sk-ant-). Saving anyway.')
  }

  // Store in auth storage and set env var for current session
  authStorage.setApiKey('anthropic', trimmed)
  process.env.ANTHROPIC_API_KEY = trimmed

  p.log.success(`Anthropic API key saved ${pc.green('✓')}`)

  // REMOVED: runLlmStep — multi-provider OAuth/API key selection wizard
  // REMOVED: runWebSearchStep — Brave/Tavily/Anthropic native search selection
  // REMOVED: runRemoteQuestionsStep — Discord/Slack/Telegram bot setup
  // REMOVED: runToolKeysStep — Context7/Jina/Groq API key prompts
  // REMOVED: runOAuthFlow — browser-based OAuth for Anthropic/GitHub/OpenAI/Google
  // REMOVED: runApiKeyFlow — generic multi-provider API key flow
  // REMOVED: runCustomOpenAIFlow — custom OpenAI-compatible endpoint setup
  // REMOVED: runDiscordChannelStep — Discord server/channel selection

  // TODO: Re-add tool key prompts if extensions need them in adapter mode

  p.outro(pc.dim('Launching GSD...'))
}
