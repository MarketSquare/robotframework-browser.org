<script setup lang="ts">
/**
 * A rule with a row of figures under it.
 *
 * ::stat-row
 * :stat{value="151"}[keywords]
 * :stat{value="3"}[engines]
 * ::
 */
</script>

<template>
  <ul class="stat-row"><slot /></ul>
</template>

<style scoped>
.stat-row {
  list-style: none;
  padding: var(--sp-4) 0 0;
  margin: 0;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-8);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}
</style>
