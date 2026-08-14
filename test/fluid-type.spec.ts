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

  it('generated keyword documentation breaks its long links', () => {
    /*
     * This content comes from docstrings, so it contains names nobody chose
     * for a phone: ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS, and links whose
     * text is a whole URL.
     *
     * Links, not code. Code stopped breaking when it started keeping its
     * spaces — see below.
     */
    const kw = read('app/assets/css/keywords.css')
    expect(kw).toMatch(/\.kw a\s*\{[\s\S]{0,80}overflow-wrap:\s*anywhere/)
  })

  it('inline code keeps its spaces and never breaks', () => {
    /*
     * `White-space: pre` on inline code is what makes a Robot Framework call
     * readable: `Click    text=Sign in` needs its separator, and HTML's default
     * collapses those four spaces to one -- printing an example that does not
     * run. It also stops a keyword call being split across two lines.
     *
     * Both were requested, and both remove the escape hatch that kept a long
     * token from widening the page. The box below is what replaces it.
     */
    const base = read('app/assets/css/base.css')
    const rule = /:not\(pre\) > code \{[^}]*\}/.exec(base)?.[0] ?? ''
    expect(rule, 'inline code must preserve runs of spaces').toMatch(/white-space:\s*pre/)
    expect(rule, 'and must not wrap').not.toMatch(/overflow-wrap/)
  })

  it('inline code is boxed, so not wrapping cannot widen the page', () => {
    /*
     * Measured, at 375px: without this the keyword reference overflowed by
     * 1124px. An inline-block that scrolls keeps a long span whole and inside
     * its column.
     */
    const rule = /:not\(pre\) > code \{[^}]*\}/.exec(read('app/assets/css/base.css'))?.[0] ?? ''
    expect(rule).toMatch(/display:\s*inline-block/)
    expect(rule).toMatch(/max-width:\s*100%/)
    expect(rule).toMatch(/overflow-x:\s*auto/)
  })

  it("libdoc's tables are laid out fixed, or a pre cell drags the page with it", () => {
    /*
     * An auto-laid table sizes to its widest cell, and a cell holding a
     * non-wrapping keyword call has no width to give back: selectors.md
     * overflowed by 192px until this was set. `display: block` would also fix
     * it and would cost the table its semantics for a screen reader.
     */
    const doc = read('app/assets/css/doc.css')
    expect(doc).toMatch(/\.doc table:not\(\.doc-table\) \{[^}]*table-layout:\s*fixed/)
  })

  it('but never <DocTable>, whose narrow columns it collapses', () => {
    /*
     * DocTable marks single-term columns `width: 1%`, which an auto-laid table
     * reads as "shrink to content" and a fixed-laid one reads literally. Under
     * `table-layout: fixed` the operator column on the assertions page became
     * 8px wide and every row drew on top of the next -- shipped, and reported
     * from the live site.
     *
     * The exclusion is the fix, so it is what this asserts.
     */
    const doc = read('app/assets/css/doc.css')
    const bare = /\.doc table \{[^}]*\}/.exec(doc)?.[0] ?? ''
    expect(bare, 'must not apply to every table').not.toMatch(/table-layout/)
    expect(doc).toContain('.doc table:not(.doc-table)')
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
