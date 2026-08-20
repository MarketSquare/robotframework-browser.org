/**
 * How the data type dialog closes.
 *
 * The dialog itself is pure CSS: a `.type` panel matches `:target` and lifts
 * out of the page (keywords.css). That is what makes it work with scripting
 * off, and it is also the constraint this module exists for — only a real
 * fragment navigation moves the target element. `history.pushState` and
 * `history.replaceState` change the URL and leave `:target` exactly where it
 * was, so a close that rewrites the hash through the router leaves the panel
 * on screen with its close button gone. That was the bug: reachable from
 * /keywords#type--selectionstrategy, where clicking the backdrop dropped the
 * hash and the dialog stayed.
 *
 * So closing is one of two things, and which one depends on how the reader got
 * here:
 *
 * - Back, when the dialog was opened from this page. There is a same-page
 *   entry behind it, so Back closes the dialog *and* returns the reader to the
 *   keyword they were reading, scroll position included.
 * - A fragment navigation to the un-target, when it was not. A dialog that was
 *   already open when the page loaded has nothing of ours behind it: Back
 *   either leaves the site or, in a fresh tab, does nothing at all.
 *
 * Pure and fed by the caller, like os.ts, so the rule can be tested without a
 * browser — which matters here, because happy-dom recomputes `:target` from
 * the current URL and therefore cannot reproduce the bug at all.
 */

/** Where a dialog with no history behind it goes: the top of the reference. */
export const TYPE_UNTARGET = '#kw-top'

/**
 * `type--`, not `type-`: the keyword "Type Text" anchors at `#type-text`, and
 * it is not a dialog. Same distinction the rail filter makes.
 */
export function isTypeHash(hash: string): boolean {
  return hash.startsWith('#type--')
}

export type TypeDialogExit =
  /** `router.back()` — closes the dialog and restores the reader's place. */
  | { via: 'back' }
  /** A real fragment navigation, the only thing that moves `:target`. */
  | { via: 'anchor', hash: string }

export interface TypeDialog {
  /** Called with every hash the page moves to, in order. */
  moveTo: (hash: string) => void
  /** What the close button, the backdrop and Escape should do right now. */
  exit: () => TypeDialogExit
}

/**
 * `loadedHash` is the hash the page was loaded with — the deep link that
 * started this, when there is one.
 *
 * The state worth keeping is small: did the *last* move open the dialog? Only
 * then is the entry behind it a view without a dialog in it. Moving from one
 * type to another does not qualify, however the reader arrived: Back there
 * reopens the previous type rather than closing anything.
 */
export function createTypeDialog(loadedHash: string): TypeDialog {
  let current = loadedHash
  let openedHere = false

  return {
    moveTo(hash) {
      openedHere = isTypeHash(hash) && !isTypeHash(current)
      current = hash
    },
    exit() {
      return openedHere ? { via: 'back' } : { via: 'anchor', hash: TYPE_UNTARGET }
    },
  }
}
