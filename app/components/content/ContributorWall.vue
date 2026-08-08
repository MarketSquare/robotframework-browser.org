<script setup lang="ts">
/**
 * ::contributor-wall — everyone the all-contributors bot knows about.
 * ::contributor-wall{compact} — the same people, faces only.
 *
 * A wrapper with nothing in it, on purpose.
 *
 * Components in `components/content/` are registered globally so MDC can
 * resolve them by name at render time, and a globally registered component is
 * in the client bundle whether or not it is named `.server.vue`. Putting the
 * body here directly cost 39 KB of contributor data on every page of the site.
 *
 * The body lives in `components/` instead, where the `.server` suffix does what
 * it says: it renders as an island, and the client receives markup only.
 */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <ContributorWallBody :compact="compact" />
</template>
