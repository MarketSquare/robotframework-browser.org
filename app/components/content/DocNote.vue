<script setup lang="ts">
/**
 * A callout. Three kinds, each with a job:
 *   note    — worth knowing
 *   warning — will bite you
 *   aside   — context or a dissenting view, not instruction
 */
const props = withDefaults(defineProps<{ kind?: 'note' | 'warning' | 'aside' }>(), { kind: 'note' })

const LABEL = { note: 'Note', warning: 'Watch out', aside: 'Aside' }
</script>

<template>
  <aside class="callout" :class="`is-${props.kind}`">
    <p class="callout-label">{{ LABEL[props.kind] }}</p>
    <div class="callout-body"><slot /></div>
  </aside>
</template>

<style scoped>
.callout {
  border: 1px solid var(--line);
  border-left: 2px solid var(--teal);
  border-radius: var(--radius-sm);
  background: var(--panel);
  padding: var(--sp-3) var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.callout.is-warning {
  border-left-color: var(--red);
  background: var(--red-soft);
}

.callout.is-aside {
  border-left-color: var(--line-strong);
  background: var(--chrome);
}

.callout-label {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
  margin: 0;
}

.callout.is-warning .callout-label {
  color: var(--red-text);
}

.callout.is-aside .callout-label {
  color: var(--faint);
}

.callout-body :deep(p) {
  margin: 0;
}

.callout-body :deep(p + p) {
  margin-top: var(--sp-2);
}

@supports (corner-shape: bevel) {
  .callout {
    corner-shape: bevel;
  }
}
</style>
