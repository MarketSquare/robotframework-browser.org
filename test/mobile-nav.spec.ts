import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * Regression guard for a bug that only appears on a small screen with a long
 * menu: the header is sticky, so an open panel taller than the viewport cannot
 * scroll with the page. Its lower items are unreachable and the scroll gesture
 * falls through to the document behind it.
 *
 * Measured at 390x700 before the fix: the panel was 823px tall and ran 221px
 * past the bottom of the viewport.
 */
const src = readFileSync(`${process.cwd()}/app/components/SiteHeader.vue`, 'utf8')

/** The `@media (max-width: 900px)` block, where the panel behaviour lives. */
const small = src.slice(src.indexOf('@media (max-width: 900px)'))

describe('the small-screen menu panel', () => {
  it('makes something a scroll container when the menu is open', () => {
    expect(small).toMatch(/\.site:has\(\.menu-toggle:checked\)[\s\S]*?overflow-y:\s*auto/)
  })

  it('caps that container at the viewport, in dvh', () => {
    /*
     * dvh rather than vh: on a phone the browser's own chrome shrinks and grows
     * as you scroll, and vh keeps measuring the tallest state — which puts the
     * bottom of the menu under the address bar exactly when it is showing.
     */
    expect(small).toMatch(/\.site:has\(\.menu-toggle:checked\)[\s\S]*?max-height:\s*100dvh/)
  })

  it('stops a flick at the end of the list from scrolling the page behind', () => {
    expect(small).toMatch(/\.site:has\(\.menu-toggle:checked\)[\s\S]*?overscroll-behavior:\s*contain/)
  })

  it('still opens the panel from the checkbox alone, so it works without JavaScript', () => {
    expect(small).toMatch(/\.menu-toggle:checked\s*~\s*\.nav\s*\{[^}]*display:\s*flex/)
  })
})

describe('the styleguide is published but unlisted', () => {
  /*
   * /styleguide exists and is meant to stay reachable — CONTRIBUTING.md links
   * it, and it is the only accurate reference for the MDC components because
   * it renders each one beside its own source. It is documentation of the
   * site, though, aimed at whoever is editing it. A reader who came here to
   * learn Browser has no use for it, so it is not in the navigation and not in
   * the sitemap.
   */
  it('is not a navigation entry', () => {
    expect(src).not.toMatch(/to:\s*'\/styleguide'/)
  })

  it('still exists as a page', () => {
    expect(existsSync(`${process.cwd()}/app/pages/styleguide.vue`)).toBe(true)
  })

  it('is linked from the maintainer guide', () => {
    expect(readFileSync(`${process.cwd()}/CONTRIBUTING.md`, 'utf8')).toContain('/styleguide')
  })
})
