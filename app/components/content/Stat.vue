<script setup lang="ts">
/** One figure in a :stat-row. `:stat{value="151"}[keywords]` */
defineProps<{ value: string }>()
</script>

<template>
  <li class="stat"><b>{{ value }}</b> <slot /></li>
</template>

<style scoped>
.stat b {
  color: var(--ink);
  font-weight: 400;
}
</style>
