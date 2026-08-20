import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { createTypeDialog, isTypeHash, TYPE_UNTARGET } from '../app/utils/type-dialog'

/**
 * Regression guard for a bug that only showed up on a deep link.
 *
 * /keywords#type--selectionstrategy opens the SelectionStrategy dialog on
 * load. Clicking the backdrop took the `else` branch of the old closeType —
 * `router.replace({ hash: '' })`, i.e. history.replaceState — which drops the
 * hash without re-running fragment navigation. The browser's target element
 * never moved, so `.type:target` kept matching: the backdrop and the close
 * button vanished (they follow `route.hash`) and the panel stayed fixed in the
 * middle of the viewport with no way out. Reached from a keyword instead, the
 * same click took the `router.back()` branch — a real traversal — and worked.
 *
 * Verified in Chromium against the built site before the fix: after the click,
 * `document.querySelector('#type--selectionstrategy').matches(':target')` was
 * still true and its computed position still `fixed`.
 *
 * That check cannot be written here. happy-dom recomputes `:target` from the
 * current URL, so replaceState *does* clear it there and the bug disappears in
 * the test environment. What is testable is the decision — which exit closing
 * asks for — plus a guard that the component still performs the exit as a real
 * fragment navigation.
 */
describe('which anchors are dialogs', () => {
  it('recognises a data type', () => {
    expect(isTypeHash('#type--selectionstrategy')).toBe(true)
  })

  it('leaves the keyword "Type Text" alone', () => {
    // One hyphen, not two. The rail filter draws the same line.
    expect(isTypeHash('#type-text')).toBe(false)
  })

  it('is not fooled by a keyword anchor', () => {
    expect(isTypeHash('#get-element-by')).toBe(false)
  })
})

describe('closing a type dialog', () => {
  it('goes back when it was opened from this page', () => {
    // Reading a keyword, then following one of its argument types.
    const dialog = createTypeDialog('#get-element-by')
    dialog.moveTo('#type--selectionstrategy')

    expect(dialog.exit()).toEqual({ via: 'back' })
  })

  it('navigates to the un-target when the page loaded with it open', () => {
    // The bug: a deep link has no same-page entry behind it.
    const dialog = createTypeDialog('#type--selectionstrategy')

    expect(dialog.exit()).toEqual({ via: 'anchor', hash: TYPE_UNTARGET })
  })

  it('navigates to the un-target on a fresh page with no hash at all', () => {
    const dialog = createTypeDialog('')

    expect(dialog.exit()).toEqual({ via: 'anchor', hash: TYPE_UNTARGET })
  })

  it('does not go back from one type to another, which would only reopen', () => {
    /*
     * A type panel links on to the types it mentions. Back from the second one
     * shows the first — still a dialog, so it does not close anything.
     */
    const dialog = createTypeDialog('#get-element-by')
    dialog.moveTo('#type--selectionstrategy')
    dialog.moveTo('#type--elementstate')

    expect(dialog.exit()).toEqual({ via: 'anchor', hash: TYPE_UNTARGET })
  })

  it('goes back again once the dialog is reopened from the page', () => {
    // Deep link, closed to the un-target, then a type followed from a keyword.
    const dialog = createTypeDialog('#type--selectionstrategy')
    dialog.moveTo(TYPE_UNTARGET)
    dialog.moveTo('#get-element-by')
    dialog.moveTo('#type--selectionstrategy')

    expect(dialog.exit()).toEqual({ via: 'back' })
  })
})

describe('the reference performs that exit itself', () => {
  const src = readFileSync(`${process.cwd()}/app/components/KeywordReference.vue`, 'utf8')

  /*
   * Comments stripped, because the ones this file forbids are named and
   * explained in the component's own comments — the wrong close is worth
   * documenting there, and a plain search would find the warning about it.
   */
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

  it('closes with a real fragment navigation', () => {
    expect(code).toMatch(/window\.location\.replace\(exit\.hash\)/)
  })

  it('never closes by rewriting the hash through the router', () => {
    // history.replaceState/pushState leave the target element where it was.
    expect(code).not.toMatch(/router\.(replace|push)\(\s*\{\s*hash/)
  })

  it('asks the rule rather than guessing from history.length', () => {
    // `length > 1` says nothing about *what* the entry behind this one is.
    expect(code).not.toContain('history.length')
    expect(code).toContain('createTypeDialog(window.location.hash)')
  })

  it('seeds and feeds the rule from the location, not from the route', () => {
    /*
     * The route arrives without a fragment — the server never saw one — so it
     * reports the deep link as a move a moment after hydration. Reading that
     * as the reader opening the dialog sent a deep link's close through Back,
     * which in a fresh tab does nothing at all.
     */
    expect(code).toMatch(/hashchange['"], onHash/)
    expect(code).toMatch(/onHash = \(\) => dialog\.moveTo\(window\.location\.hash\)/)
    expect(code).not.toMatch(/dialog\.moveTo\(hash\)/)
  })

  it('still offers the un-target as an anchor for readers without JavaScript', () => {
    expect(code).toContain(`id="${TYPE_UNTARGET.slice(1)}"`)
  })
})
