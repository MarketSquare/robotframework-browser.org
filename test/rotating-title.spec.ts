import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

const component = read('app/components/content/RotatingTitle.vue')
const landing = read('content/index.md')

/** The headlines, straight out of the page's frontmatter block. */
const titles = landing
  .slice(landing.indexOf('titles:'), landing.indexOf('---\n:::', landing.indexOf('titles:')))
  .split('\n')
  .slice(1)
  /*
   * Strip the list marker and any surrounding quotes. Quoted is the form to
   * keep: a formatter once rewrote these as `- |` block scalars, which
   * preserve the newline, so every headline rendered with a line break in it.
   */
  .map(l => l.replace(/^\s*-\s*/, '').trim().replace(/^"(.*)"$/, '$1'))
  .filter(Boolean)

describe('the rotating headline', () => {
  it('has several headlines to rotate through', () => {
    expect(titles.length).toBeGreaterThanOrEqual(5)
  })

  it('may break a headline where the author wants it', () => {
    /*
     * `\n` in a title is a deliberate break, rendered by `white-space:
     * pre-line`. Before that was wired up a formatter rewrote these as `- |`
     * block scalars and the newline simply collapsed to a space — the break
     * was written and silently ignored.
     */
    expect(read('app/components/content/RotatingTitle.vue')).toContain('white-space: pre-line')
    expect(read('app/utils/line-breaks.ts')).toContain('withLineBreaks')
  })

  it('keeps every headline within the two-line budget', () => {
    /*
     * Measured in the real hero at 1440px: 40 characters wrap to two lines and
     * 42 to three. Because all the headlines are stacked in one grid cell, the
     * tallest sets the height of the hero — so one long headline adds 60px of
     * empty space under *every* other one.
     */
    for (const t of titles) {
      // Per line, since a headline may be broken deliberately.
      const longest = Math.max(...t.split(/\\n|\n/).map(l => l.length))
      expect(longest, `"${t}" has a ${longest}-character line`).toBeLessThanOrEqual(40)
    }
  })

  it('starts every headline the same way, which is what the scramble relies on', () => {
    // Shared characters are not scrambled, so a common prefix sits still and
    // the effect lands on the part that actually changes.
    for (const t of titles) expect(t.startsWith('Browser automation')).toBe(true)
  })
})

describe('RotatingTitle behaviour', () => {
  it.skipIf(!existsSync(join(ROOT, '.output/public/index.html')))('renders every headline server-side, so there is one without JavaScript', () => {
    const html = read('.output/public/index.html')
    for (const t of titles) {
      // Apostrophes are escaped in the output; a `\n` escape is a real newline.
      expect(html).toContain(t.replace(/\\n/g, '\n').replace(/'/g, '&#39;'))
    }
  })

  it('stacks them in one grid cell so the hero does not resize', () => {
    expect(component).toMatch(/\.rot\s*\{[^}]*display:\s*grid/)
    expect(component).toMatch(/grid-area:\s*1\s*\/\s*1/)
  })

  it('hides the inactive ones from assistive technology as well as from view', () => {
    expect(component).toContain('aria-hidden')
    expect(component).toMatch(/visibility:\s*hidden/)
  })

  it('honours prefers-reduced-motion', () => {
    // Auto-updating text is precisely what that setting is about.
    expect(component).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(component).toMatch(/if \(reduced\) return/)
  })

  it('pauses on hover and on focus', () => {
    for (const handler of ['@mouseenter', '@mouseleave', '@focusin', '@focusout']) {
      expect(component).toContain(handler)
    }
  })

  it('cleans up its timer and animation frame', () => {
    expect(component).toContain('onBeforeUnmount')
    expect(component).toContain('clearInterval')
    expect(component).toContain('cancelAnimationFrame')
  })

  it('does not reuse Shiki\'s .line class', () => {
    // Both appear on the landing page; one name for two things is a debugging trap.
    expect(component).toContain('rot-line')
    expect(component).not.toMatch(/class="line"/)
  })
})
