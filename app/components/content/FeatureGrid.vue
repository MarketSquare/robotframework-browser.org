<script setup lang="ts">
/**
 * A plain list turned into a marked, columned grid.
 *
 * ::feature-grid
 * - Conscientious assertions
 * - Chainable selector strategies
 * ::
 */
withDefaults(defineProps<{ min?: string; max?: string }>(), { min: '17rem', max: '62rem' })
</script>

<template>
  <div class="feature-grid" :style="{ '--grid-min': min, '--grid-max': max }"><slot /></div>
</template>

<style scoped>
/* Capped, or auto-fit keeps adding columns on a wide screen and the list
   stops reading as three tidy columns. */
.feature-grid {
  max-width: var(--grid-max);
}

.feature-grid :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--grid-min), 1fr));
  gap: 0 var(--sp-8);
}

.feature-grid :deep(li) {
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line);
  display: flex;
  gap: var(--sp-3);
  align-items: baseline;
}

.feature-grid :deep(li)::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  flex: none;
  background: var(--red);
}
</style>
