<script setup lang="ts">
/**
 * A page section: green eyebrow, heading, optional lede, then content.
 *
 * ::page-section{label="What you get" title="Speed, reliability and visibility."}
 * Optional lede paragraph, then any content.
 * ::
 */
withDefaults(
  defineProps<{
    label?: string
    title?: string
    /** `panel` tints the section, for alternating bands down a page. */
    tone?: 'plain' | 'panel'
    /** Drops the bottom rule, for the last section on a page. */
    last?: boolean
  }>(),
  { tone: 'plain' },
)
</script>

<template>
  <section class="page-section" :class="[`tone-${tone}`, { 'is-last': last }]">
    <p v-if="label" class="label">{{ label }}</p>
    <h2 v-if="title">{{ title }}</h2>
    <div class="body"><slot /></div>
  </section>
</template>

<style scoped>
.page-section {
  padding: var(--sp-16) var(--gutter);
  border-bottom: 1px solid var(--line);
}

.page-section.tone-panel {
  background: var(--panel);
}

.page-section.is-last {
  border-bottom: 0;
}

h2 {
  font-size: var(--step-3);
  margin-top: var(--sp-1);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  margin-top: var(--sp-4);
}

.body :deep(> p) {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
}

/* Sub-headings inside a section keep their own scale. */
.body :deep(h3) {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step-1);
  margin-top: var(--sp-6);
}
</style>
