<script setup lang="ts">
/**
 * An auto-fitting grid. Nest anything inside — cards, prose, other grids.
 *
 * ::card-grid{min="15rem"}
 *   ::card{title="Speed" accent="green"}
 *   One Node process drives all three engines.
 *   ::
 * ::
 */
withDefaults(defineProps<{ min?: string; gap?: string }>(), { min: '15rem' })
</script>

<template>
  <div class="card-grid" :style="{ '--grid-min': min, '--grid-gap': gap }">
    <slot />
  </div>
</template>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--grid-min, 15rem), 1fr));
  gap: var(--grid-gap, var(--sp-4));
  align-items: start;
}
</style>
