/**
 * Which shell to show first in a <Terminal>.
 *
 * Pure and dependency-injected so it can be tested without a browser, and so
 * the component can call it with the real `navigator` on mount.
 */

export type Shell = 'bash' | 'powershell'

export interface NavigatorLike {
  userAgent: string
  platform?: string
  /** High-entropy client hint. The only source that is not deprecated. */
  userAgentData?: { platform?: string }
}

const WINDOWS = /win/i

/**
 * Detection order matters: `userAgentData.platform` first because
 * `navigator.platform` is deprecated and frozen to "Win32" on some Chrome
 * builds regardless of the real OS.
 *
 * Defaults to bash. That is the safer miss: the install command is identical
 * on macOS and Linux, so a wrong guess only costs a Windows reader one click,
 * whereas defaulting to PowerShell would show the wrong command to the
 * majority of visitors.
 */
export function detectShell(nav?: NavigatorLike): Shell {
  if (!nav) return 'bash'

  const hint = nav.userAgentData?.platform
  if (hint) return WINDOWS.test(hint) ? 'powershell' : 'bash'

  if (nav.platform) return WINDOWS.test(nav.platform) ? 'powershell' : 'bash'

  if (nav.userAgent && WINDOWS.test(nav.userAgent)) return 'powershell'

  return 'bash'
}

export const SHELL_LABEL: Record<Shell, string> = {
  bash: 'bash',
  powershell: 'PowerShell',
}

/** The prompt string each shell writes. Never part of a copied command. */
export const SHELL_PROMPT: Record<Shell, string> = {
  bash: '$ ',
  powershell: 'PS> ',
}
