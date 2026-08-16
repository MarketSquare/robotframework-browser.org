/**
 * What a link to the page you are already on should do.
 *
 * NuxtLink treats it as a no-op — the router sees the same route and does
 * nothing at all — so tapping the highlighted entry in a menu feels broken:
 * the menu stays open, the page does not move, and nothing says why. The
 * expectation it disappoints is a reasonable one, especially on a phone, where
 * the entry was reached by opening a menu that now needs closing.
 *
 * So: close whatever menu is open, and go back to the top.
 *
 * Used by both navigations — the site header's menu and the docs rail — because
 * both can list the current page.
 */
export function useSamePageNav() {
  const route = useRoute()

  /** `/docs/x` and `/docs/x/` are the same page; a static host serves both. */
  const same = (a: string, b: string) =>
    a.replace(/\/+$/, '') === b.replace(/\/+$/, '')

  return (event: MouseEvent, to: string) => {
    if (!same(route.path, to)) return

    event.preventDefault()

    /*
     * The header menu is a CSS checkbox, so closing it means unchecking it.
     * Queried from the document rather than passed in: the header owns that
     * input, and the docs rail — which has no menu of its own — still has to
     * be able to close it.
     */
    for (const box of document.querySelectorAll<HTMLInputElement>('.menu-toggle')) {
      box.checked = false
    }

    window.scrollTo({
      top: 0,
      /* Someone who asked for less motion gets none, not a slower version. */
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }
}
