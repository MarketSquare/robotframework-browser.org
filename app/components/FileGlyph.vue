<script setup lang="ts">
/**
 * Monochrome file-type pictograms for the Editor tab bar. Spec §5.4.
 *
 * `.robot` and `.resource` use the official Robot Framework mark from
 * robotframework/visual-identity. The rest are drawn here rather than pulled
 * from an icon font: a coloured third-party icon set would be the only thing
 * on the plate not coming from our tokens, and the tab bar is small enough
 * that a handful of marks cover everything.
 *
 * Everything is `currentColor`, so the glyph dims and brightens with its tab.
 */
const props = defineProps<{ name: string }>()

type Kind = 'robot' | 'python' | 'script' | 'data' | 'file'

const kind = computed<Kind>(() => {
  const ext = props.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'robot' || ext === 'resource') return 'robot'
  if (ext === 'py') return 'python'
  if (ext === 'ts' || ext === 'js' || ext === 'mjs') return 'script'
  if (ext === 'json' || ext === 'yaml' || ext === 'yml' || ext === 'toml') return 'data'
  return 'file'
})
</script>

<template>
  <!-- .robot and .resource get the official Robot Framework mark, not a redrawing. -->
  <RobotMark v-if="kind === 'robot'" />

  <svg v-else class="glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <!-- Python: the two interlocking bodies, reduced to their silhouette. -->
    <template v-if="kind === 'python'">
      <path d="M8 1.7c-2 0-2.6.9-2.6 1.9v1.5h2.7" />
      <path d="M5.4 5.1H3.7c-1 0-1.7.9-1.7 2.9s.7 2.9 1.7 2.9h1.1" />
      <path d="M8 14.3c2 0 2.6-.9 2.6-1.9v-1.5H7.9" />
      <path d="M10.6 10.9h1.7c1 0 1.7-.9 1.7-2.9s-.7-2.9-1.7-2.9h-1.1" />
    </template>

    <!-- Script: angle brackets, the universal shorthand. -->
    <template v-else-if="kind === 'script'">
      <path d="M5.8 4.4 2.4 8l3.4 3.6" />
      <path d="m10.2 4.4 3.4 3.6-3.4 3.6" />
    </template>

    <!-- Data: braces. -->
    <template v-else-if="kind === 'data'">
      <path d="M6.2 2.6c-1.5 0-1.8.7-1.8 1.8v1.9c0 1-.5 1.7-1.6 1.7 1.1 0 1.6.7 1.6 1.7v1.9c0 1.1.3 1.8 1.8 1.8" />
      <path d="M9.8 2.6c1.5 0 1.8.7 1.8 1.8v1.9c0 1 .5 1.7 1.6 1.7-1.1 0-1.6.7-1.6 1.7v1.9c0 1.1-.3 1.8-1.8 1.8" />
    </template>

    <!-- Anything else: a plain document. -->
    <template v-else>
      <path d="M4 1.8h5l3 3v9.4H4z" />
      <path d="M9 1.8v3h3" />
    </template>
  </svg>
</template>

<style scoped>
.glyph {
  /* Sized by the tab it sits in, so every glyph matches. */
  flex: none;
  stroke: currentcolor;
  fill: none;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
