/**
 * Copy-to-clipboard with a short confirmation on the button itself.
 * No toast: a plate can appear several times on a page and a stack of
 * toasts would be worse than the affordance it is confirming.
 */
export function useCopy(resetAfterMs = 1200) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be blocked by permissions or an insecure origin.
      // Still confirm: the user pressed the button, and failing silently
      // with no feedback is worse than an optimistic tick.
    }
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), resetAfterMs)
  }

  onScopeDispose(() => clearTimeout(timer))

  return { copied, copy }
}
