<script setup lang="ts">
/** A row of actions. `::btn-row` with `:btn` children. */
</script>

<template>
  <div class="btn-row"><slot /></div>
</template>

<style scoped>
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}
</style>
