import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Headings that fit, and pages that do not scroll sideways.
 *
 * "Browser vs SeleniumLibrary" at a fixed 44px overflowed a 390px screen by
 * 137px and dragged the whole document with it. CSS has no shrink-to-fit for
 * text — nothing measures the string — so the scale is fluid instead: each
 * clamp's upper bound is the size the scale always used, reached by about
 * 900px, so desktop is untouched and only narrow viewports scale down.
 */

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('the display scale is fluid', () => {
  const tokens = read('app/assets/css/tokens.css')

  it.each([
    ['--step-2', '1.5rem'],
    ['--step-3', '2rem'],
    ['--step-4', '2.75rem'],
    ['--step-5', '3.75rem'],
  ])('%s clamps up to its original %s', (token, max) => {
    const rule = new RegExp(`${token}:\\s*clamp\\(([^)]*)\\)`)
    const match = rule.exec(tokens)
    expect(match, `${token} should be a clamp()`).not.toBeNull()
    // The upper bound must be what the fixed scale used, or desktop changes.
    expect(match![1]!.split(',').at(-1)!.trim()).toBe(max)
  })

  it('leaves the body and small sizes fixed', () => {
    // Fluid body text is a readability problem, not a fix.
    for (const token of ['--step--2', '--step--1', '--step-0', '--step-1']) {
      const line = tokens.split('\n').find(l => l.includes(`${token}:`))
      expect(line, token).toBeDefined()
      expect(line, `${token} should stay fixed`).not.toContain('clamp(')
    }
  })
})

describe('long unbreakable words cannot push a page sideways', () => {
  it('headings break a word only when it cannot fit', () => {
    // break-word, not anywhere: ordinary headings must be left alone.
    expect(read('app/assets/css/base.css')).toMatch(
      /:is\(h1, h2, h3\)\s*\{[^}]*overflow-wrap:\s*break-word/,
    )
  })

  it('generated keyword documentation breaks its long tokens', () => {
    /*
     * This content comes from docstrings, so it contains names nobody chose
     * for a phone: ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS, and links whose
     * text is a whole URL.
     */
    const kw = read('app/assets/css/keywords.css')
    expect(kw).toMatch(/\.kw :is\(code, a\)[\s\S]{0,80}overflow-wrap:\s*anywhere/)
  })

  it('inline code in the docs breaks too', () => {
    expect(read('app/assets/css/doc.css')).toMatch(/\.doc code\s*\{[^}]*overflow-wrap:\s*anywhere/)
  })

  it('keyword pills wrap rather than overflow on a narrow screen', () => {
    const kw = read('app/assets/css/keywords.css')
    expect(kw).toMatch(/@media \(max-width: 26rem\)[\s\S]{0,120}white-space:\s*normal/)
  })
})


/*
 * These assertions read the prerendered output, so they only run after a
 * build. CI generates before it tests, which is why `pnpm verify` builds
 * first; on a developer machine `pnpm test` alone simply skips them rather
 * than failing on a missing directory.
 */
const BUILT = existsSync(join(process.cwd(), '.output/public'))

describe.skipIf(!BUILT)('no prerendered page scrolls sideways', () => {
  /*
   * A cheap structural proxy for the browser sweep: every wide thing in the
   * markup should sit inside something that scrolls, and .scroll-x is how this
   * site says that.
   */
  const dist = join(ROOT, '.output/public')

  const pages = readdirSync(dist, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('_'))
    .map(e => join(dist, e.name, 'index.html'))
    .filter(p => {
      try {
        readFileSync(p)
        return true
      }
      catch {
        return false
      }
    })

  it('found prerendered pages to check', () => {
    expect(pages.length).toBeGreaterThan(3)
  })

  it('wraps every table in a scroll container', () => {
    for (const page of pages) {
      const html = readFileSync(page, 'utf8')
      const tables = (html.match(/<table/g) ?? []).length
      if (!tables) continue
      const wrappers = (html.match(/class="scroll-x"/g) ?? []).length
      expect(wrappers, `${page} has ${tables} tables and ${wrappers} scroll containers`)
        .toBeGreaterThanOrEqual(1)
    }
  })
})
