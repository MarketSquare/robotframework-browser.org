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

/**
 * The docs rail moves above the article below 900px, and there it shows only
 * the chapter being read.
 *
 * It used to show all five in an 18rem scrolling box that opened at the top of
 * the list. On /docs/mobile/responsive that meant nineteen links above the
 * article, none of them the current page, and the highlight that says where you
 * are was scrolled out of sight three chapters down.
 */
const docs = readFileSync(`${process.cwd()}/app/pages/docs/[...slug].vue`, 'utf8')
const docsSmall = docs.slice(docs.indexOf('@media (max-width: 900px)'))

describe('the docs rail on a small screen', () => {
  it('shows only the chapter being read', () => {
    expect(docsSmall).toMatch(/\.chapter:not\(\.here\)[\s\S]{0,60}display:\s*none/)
  })

  it('marks the current page for a screen reader too, not only in colour', () => {
    expect(docs).toContain("aria-current")
  })

  it('drops the scroll box, so the short list is not trapped in one', () => {
    // `max-height: 18rem` is what put the current page out of view.
    expect(docsSmall).toMatch(/\.rail \{[^}]*max-height:\s*none/)
  })
})

/**
 * A link to the page you are already on is a no-op in the router, which reads
 * as a broken menu: nothing moves and the menu stays open over the article.
 */
const header = readFileSync(`${process.cwd()}/app/components/SiteHeader.vue`, 'utf8')

describe('a link to the current page', () => {
  it.each([
    ['the docs rail', () => docs],
    ['the site header', () => header],
  ])('is handled in %s', (_where, read) => {
    expect(read()).toContain('onSamePage($event')
  })

  it('closes the menu and returns to the top', () => {
    const composable = readFileSync(`${process.cwd()}/app/composables/useSamePageNav.ts`, 'utf8')
    expect(composable).toContain('.menu-toggle')
    expect(composable).toMatch(/checked\s*=\s*false/)
    expect(composable).toMatch(/scrollTo\(\{[\s\S]*top:\s*0/)
  })

  it('honours a request for reduced motion', () => {
    const composable = readFileSync(`${process.cwd()}/app/composables/useSamePageNav.ts`, 'utf8')
    expect(composable).toContain('prefers-reduced-motion')
  })
})
