<script setup lang="ts">
/**
 * One figure in a `:stat-row`, written label first.
 *
 * `:stat{value="151" to="/keywords"}[Keywords]` → `Keywords: 151`
 *
 * The label leads because that is the thing a reader is scanning for — the
 * number only means something once you know what it counts. `v` is prepended
 * to version-shaped values, so `20.3.0` reads as a release rather than as a
 * quantity.
 *
 * `to` makes the whole item a link, and `icon` puts an emoji in front of the
 * label. Both are optional; an item without `to` is plain text, as before.
 */
const props = defineProps<{
  value: string
  /** Where the figure comes from, or what it refers to. */
  to?: string
  /** A single emoji, in front of the label. */
  icon?: string
}>()

/* Resolved here so the token survives a Studio round-trip -- see TerminalBlock. */
const shown = computed(() => {
  const v = resolveTokenString(props.value)
  // Version-shaped: 20.3.0, 1.62.1, 24.19.0. Not 151, not 0.
  return /^\d+\.\d+/.test(v) ? `v${v}` : v
})

/*
 * Resolved in setup, not in the template.
 *
 * `:is="resolveComponent('NuxtLink')"` inside a template expression returns
 * the *name*, so Vue rendered a literal <NuxtLink> element into the page and
 * the two internal links silently lost their href.
 *
 * NuxtLink handles absolute URLs itself — it emits a plain anchor with the
 * right rel — so one branch covers internal and external alike.
 */
const NuxtLink = resolveComponent('NuxtLink')
</script>

<template>
  <li class="stat">
    <component
      :is="props.to ? NuxtLink : 'span'"
      v-bind="props.to ? { to: props.to } : {}"
      class="stat-item"
    >
      <slot /><span class="stat-sep">:</span> <b>{{ shown }}</b><span
        v-if="props.icon"
        class="stat-icon"
        aria-hidden="true"
      >{{ props.icon }}</span>
    </component>
  </li>
</template>

<style scoped>
.stat-item {
  color: inherit;
  border-bottom: 0;
  white-space: nowrap;
}

/* A link earns the underline only on hover; at 11px a permanent one is noise. */
a.stat-item:hover,
a.stat-item:focus-visible {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.stat-icon {
  /* The emoji carries no meaning the label does not; keep it from setting the
     line height, and let the row's letter-spacing not push it off. */
  margin-left: 0.45em;
  letter-spacing: 0;
  font-size: 1.1em;
}

.stat-sep {
  /* The row is letter-spaced; without this the colon drifts off its label. */
  margin-left: -0.14em;
}

.stat b {
  color: var(--ink);
  font-weight: 400;
  /*
   * The row is uppercased, which is right for the labels and wrong for the
   * value: it turned the `v` of `v20.3.0` into a capital. Digits are unaffected
   * either way, so this only ever shows on the version prefix.
   */
  text-transform: none;
}
</style>
