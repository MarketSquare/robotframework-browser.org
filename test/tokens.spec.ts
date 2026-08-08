import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// Vite rewrites import.meta.url to a /@fs/ path, so resolve from the run root.
const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, 'app/assets/css/tokens.css'), 'utf8')

/** Extract the body of the first CSS block whose selector matches. */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) return ''
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}') {
      depth--
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  return ''
}

/** Every surface/ink/brand token the spec names. */
const THEMED = [
  '--paper',
  '--chrome',
  '--panel',
  '--line',
  '--line-strong',
  '--ink',
  '--dim',
  '--faint',
  '--red',
  '--red-text',
  '--red-soft',
  '--teal',
]

const PLATE = [
  '--term-bg',
  '--term-chrome',
  '--term-tab',
  '--term-line',
  '--term-ink',
  '--term-dim',
  '--term-faint',
  '--term-red',
  '--term-teal',
]

describe('token completeness', () => {
  const light = block(TOKENS, ':root {')

  it('defines the full light palette on bare :root', () => {
    // The un-stamped "system" state reads this block. A token missing here
    // is a colour that never resolves for most viewers.
    for (const token of [...THEMED, ...PLATE]) {
      expect(light, `${token} missing from :root`).toContain(`${token}:`)
    }
  })

  it('defines the type and space scale on bare :root', () => {
    for (const token of ['--font-display', '--font-sans', '--font-mono', '--measure', '--gutter']) {
      expect(light).toContain(`${token}:`)
    }
  })

  it('uses the agreed brand red', () => {
    expect(light).toContain('--red: #d63a2e')
    expect(light).toContain('--red-text: #b82e24')
  })
})

describe('theme completeness', () => {
  // Three viewer states: explicit light, explicit dark, and system (no attribute).
  const mediaDark = block(TOKENS, ":root:not([data-theme='light'])")
  const explicitDark = block(TOKENS, ":root[data-theme='dark']")

  it('redefines every themed token for a dark OS', () => {
    for (const token of THEMED) {
      expect(mediaDark, `${token} missing from the prefers-color-scheme block`).toContain(
        `${token}:`,
      )
    }
  })

  it('redefines every themed token for an explicit dark choice', () => {
    for (const token of THEMED) {
      expect(explicitDark, `${token} missing from [data-theme="dark"]`).toContain(`${token}:`)
    }
  })

  it('guards the media query so an explicit light choice beats a dark OS', () => {
    expect(TOKENS).toContain("@media (prefers-color-scheme: dark)")
    expect(TOKENS).toContain(":root:not([data-theme='light'])")
  })

  it('keeps the two dark definitions identical', () => {
    // If these drift, the toggle and the OS preference render different pages.
    const normalise = (s: string) =>
      s
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('--') || l.startsWith('color-scheme'))
        .sort()
        .join('\n')
    expect(normalise(mediaDark)).toBe(normalise(explicitDark))
  })

  it('never changes the plate tokens between themes', () => {
    // Code is dark in both themes on purpose, so the syntax palette is
    // defined once and cannot drift.
    for (const token of PLATE) {
      expect(mediaDark, `${token} must not be redefined for dark`).not.toContain(`${token}:`)
      expect(explicitDark, `${token} must not be redefined for dark`).not.toContain(`${token}:`)
    }
  })
})

describe('colour discipline', () => {
  /** Walk app/ collecting every file that can carry CSS. */
  function styleFiles(dir: string, acc: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) styleFiles(full, acc)
      else if (/\.(css|vue)$/.test(entry)) acc.push(full)
    }
    return acc
  }

  it('defines colours only in tokens.css', () => {
    const HEX = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi
    const offenders: string[] = []

    for (const file of styleFiles(join(ROOT, 'app'))) {
      if (file.endsWith('tokens.css')) continue
      const src = readFileSync(file, 'utf8')
      for (const [i, line] of src.split('\n').entries()) {
        // SVG pictograms legitimately carry currentColor only, never hex.
        const hits = line.match(HEX)
        if (hits) offenders.push(`${relative(ROOT, file)}:${i + 1} ${hits.join(' ')}`)
      }
    }

    expect(offenders, `hard-coded colours outside tokens.css:\n${offenders.join('\n')}`).toEqual([])
  })
})
