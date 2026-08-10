<script setup lang="ts">
/** One figure in a :stat-row. `:stat{value="151"}[keywords]` */
const props = defineProps<{ value: string }>()

/* Resolved here so the token survives a Studio round-trip -- see TerminalBlock. */
const shown = computed(() => resolveTokenString(props.value))
</script>

<template>
  <li class="stat"><b>{{ shown }}</b> <slot /></li>
</template>

<style scoped>
.stat b {
  color: var(--ink);
  font-weight: 400;
}
</style>
