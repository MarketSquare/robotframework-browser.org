<script setup lang="ts">
/**
 * Libdoc tags are cross-cutting labels, not a hierarchy, so they are filter
 * chips rather than navigation. Two carry meaning worth colouring: Getter and
 * Setter say whether a keyword reads or changes state.
 */
const props = defineProps<{ tag: string }>()

const KIND: Record<string, string> = {
  Getter: 'is-get',
  Setter: 'is-set',
  Assertion: 'is-assert',
  Experimental: 'is-warn',
}
</script>

<template>
  <span class="chip" :class="KIND[props.tag]">{{ props.tag }}</span>
</template>

<style scoped>
.chip {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--line-strong);
  color: var(--dim);
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.chip.is-get,
.chip.is-assert {
  color: var(--teal);
  border-color: color-mix(in srgb, var(--teal) 45%, transparent);
}

.chip.is-set {
  color: var(--red-text);
  border-color: color-mix(in srgb, var(--red) 45%, transparent);
}

.chip.is-warn {
  color: var(--red-text);
  border-color: color-mix(in srgb, var(--red) 60%, transparent);
  background: var(--red-soft);
}

@supports (corner-shape: bevel) {
  .chip {
    corner-shape: bevel;
  }
}
</style>
