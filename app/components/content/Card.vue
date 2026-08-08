<script setup lang="ts">
/**
 * A panel with an optional accent stripe and title.
 *
 * ::card{title="Speed" accent="green"}
 * Body content, any Markdown.
 * ::
 */
withDefaults(
  defineProps<{
    title?: string
    /** Painted stripe along the top edge. */
    accent?: 'none' | 'green' | 'red' | 'teal'
    to?: string
  }>(),
  { accent: 'none' },
)
</script>

<template>
  <component :is="to ? 'NuxtLink' : 'article'" :to="to" class="card" :class="`accent-${accent}`">
    <h3 v-if="title">{{ title }}</h3>
    <div class="card-body"><slot /></div>
  </component>
</template>

<style scoped>
/*
 * The accent is painted, not bordered. As a 2px border against 1px sides the
 * bevel has to change both colour and width along the diagonal, and renders a
 * notch at each corner — worse the wider the card.
 */
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  color: inherit;
  border-bottom: 1px solid var(--line);
}

.card.accent-green {
  background:
    linear-gradient(var(--green), var(--green)) top left / 100% 2px no-repeat,
    var(--panel);
}

.card.accent-red {
  background:
    linear-gradient(var(--red), var(--red)) top left / 100% 2px no-repeat,
    var(--panel);
}

.card.accent-teal {
  background:
    linear-gradient(var(--teal), var(--teal)) top left / 100% 2px no-repeat,
    var(--panel);
}

a.card:hover {
  border-color: var(--line-strong);
}

h3 {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 400;
  margin: 0;
}

.card-body {
  color: var(--dim);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.card-body :deep(p) {
  margin: 0;
}

@supports (corner-shape: bevel) {
  .card {
    corner-shape: bevel;
  }
}
</style>
