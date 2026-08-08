<script setup lang="ts">
/**
 * Three states, matching how the tokens are written:
 *   system — no data-theme attribute; prefers-color-scheme decides
 *   light  — data-theme="light", beats a dark OS
 *   dark   — data-theme="dark",  beats a light OS
 *
 * The chosen state is applied before first paint by the inline script in
 * nuxt.config.ts, so there is no flash of the wrong theme.
 */
export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'rfb-theme'
const ORDER: Theme[] = ['system', 'light', 'dark']

const theme = ref<Theme>('system')

/** Server-rendered markup must not assume a theme, so read on mount only. */
onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  theme.value = stored === 'light' || stored === 'dark' ? stored : 'system'
})

function apply(next: Theme) {
  theme.value = next
  if (next === 'system') {
    delete document.documentElement.dataset.theme
    localStorage.removeItem(STORAGE_KEY)
  } else {
    document.documentElement.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
  }
}

function cycle() {
  apply(ORDER[(ORDER.indexOf(theme.value) + 1) % ORDER.length]!)
}

const LABEL: Record<Theme, string> = { system: 'AUTO', light: 'LIGHT', dark: 'DARK' }
</script>

<template>
  <button
    type="button"
    class="toggle"
    :aria-label="`Colour theme: ${theme}. Activate to change.`"
    @click="cycle"
  >
    <span class="dot" aria-hidden="true" />
    {{ LABEL[theme] }}
  </button>
</template>

<style scoped>
.toggle {
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-3);
  background: transparent;
  border: 1px solid var(--line-strong);
  color: var(--dim);
  cursor: pointer;
}

.toggle:hover {
  color: var(--ink);
  border-color: var(--ink);
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--red);
  display: block;
}
</style>
