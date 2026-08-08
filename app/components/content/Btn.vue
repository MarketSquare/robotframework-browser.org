<script setup lang="ts">
/**
 * An action. `:btn{to="/why" primary}[Why Browser]`
 *
 * Renders an <a> for an external href and a NuxtLink otherwise, so in-site
 * navigation stays client-side without the author having to think about it.
 */
const props = withDefaults(
  defineProps<{ to?: string; primary?: boolean }>(),
  { to: '#' },
)

const external = computed(() => /^https?:/.test(props.to))
</script>

<template>
  <a v-if="external" class="btn" :class="{ primary }" :href="to" rel="noopener noreferrer" target="_blank">
    <slot />
  </a>
  <NuxtLink v-else class="btn" :class="{ primary }" :to="to"><slot /></NuxtLink>
</template>

<style scoped>
.btn {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  padding: var(--sp-3) var(--sp-6);
  border: 1px solid var(--ink);
  color: var(--ink);
  border-radius: var(--radius-sm);
  border-bottom-width: 1px;
  display: inline-flex;
  align-items: center;
}

.btn:hover {
  background: var(--ink);
  color: var(--paper);
}

.btn.primary {
  background: var(--red);
  border-color: var(--red);
  color: var(--panel);
}

.btn.primary:hover {
  background: var(--red-text);
  border-color: var(--red-text);
  color: var(--panel);
}

@supports (corner-shape: bevel) {
  .btn {
    corner-shape: bevel;
  }
}
</style>
