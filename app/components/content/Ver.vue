<script setup lang="ts">
/**
 * A version number, in prose.
 *
 * `Checked against Cypress 15 and Browser :ver{name="browser"}.`
 *
 * Everywhere else a `%%browser%%` token is resolved by the component that owns
 * the text — `doc-table` for a cell, `terminal-block` for a session line,
 * `ProsePre` for a code fence. A bare paragraph has no such owner: MDC renders
 * its text directly, and resolving it earlier is not an option, because Nuxt
 * Studio writes whatever is handed to `<ContentRenderer>` back into the file
 * and the token would be lost from the source.
 *
 * So prose says it with a component instead. Studio round-trips this as a node
 * with props and cannot flatten it to a version number.
 *
 * An unknown name renders as the literal token rather than throwing — a
 * render-time throw would take the page down for a typo. `versions.spec.ts`
 * fails the build for one instead.
 */
const props = defineProps<{
  name: string
  /**
   * Render inside `<code>`.
   *
   * A version can appear as code in prose — an image tag, for instance — and a
   * Markdown code span cannot contain a component, so `` `:ver{...}` `` would
   * print the component source instead of running it. The prop moves the code
   * styling inside the component, where it can.
   */
  code?: boolean
}>()

const value = computed(() => resolveTokenString(`%%${props.name}%%`))
</script>

<template>
  <code v-if="props.code">{{ value }}</code>
  <template v-else>{{ value }}</template>
</template>
