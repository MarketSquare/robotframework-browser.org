import { describe, expect, it } from 'vitest'

import { type NavigatorLike, type Shell, detectShell } from '../app/utils/os'

const ua = (over: Partial<NavigatorLike>): NavigatorLike => ({ userAgent: '', ...over })

describe('detectShell', () => {
  it('prefers userAgentData.platform, the only non-deprecated source', () => {
    expect(detectShell(ua({ userAgentData: { platform: 'Windows' } }))).toBe('powershell')
    expect(detectShell(ua({ userAgentData: { platform: 'macOS' } }))).toBe('bash')
    expect(detectShell(ua({ userAgentData: { platform: 'Linux' } }))).toBe('bash')
  })

  it('ignores a legacy platform string when userAgentData disagrees', () => {
    // Chrome freezes navigator.platform at "Win32" on some builds; the
    // high-entropy hint is the one to trust.
    const nav = ua({ userAgentData: { platform: 'macOS' }, platform: 'Win32' })
    expect(detectShell(nav)).toBe('bash')
  })

  it('falls back to navigator.platform where userAgentData is absent', () => {
    expect(detectShell(ua({ platform: 'Win32' }))).toBe('powershell')
    expect(detectShell(ua({ platform: 'Windows' }))).toBe('powershell')
    expect(detectShell(ua({ platform: 'MacIntel' }))).toBe('bash')
    expect(detectShell(ua({ platform: 'Linux x86_64' }))).toBe('bash')
  })

  it('falls back to the user agent string as a last resort', () => {
    expect(detectShell(ua({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64)' }))).toBe('powershell')
    expect(detectShell(ua({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' }))).toBe('bash')
  })

  it('defaults to bash when nothing is knowable', () => {
    // Server-side render and locked-down browsers land here. bash is the
    // safer default: the install command is identical on macOS and Linux,
    // and a Windows reader still sees a working tab one click away.
    expect(detectShell(ua({}))).toBe('bash')
    expect(detectShell(undefined)).toBe('bash')
  })

  it('is case insensitive', () => {
    expect(detectShell(ua({ platform: 'win32' }))).toBe('powershell')
    expect(detectShell(ua({ userAgentData: { platform: 'WINDOWS' } }))).toBe('powershell')
  })

  it('only ever returns a known shell', () => {
    const shells: Shell[] = ['bash', 'powershell']
    for (const p of ['Android', 'iPhone', 'CrOS', '', 'BeOS']) {
      expect(shells).toContain(detectShell(ua({ platform: p })))
    }
  })
})
