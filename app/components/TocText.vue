<script setup lang="ts">
/**
 * A heading's inline markup, for the on-this-page rail.
 *
 * Renders the minimark children of an h2/h3 — `code`, `strong`, `em` and the
 * text between them — so `## \`Wait For Condition\`` reads as a keyword in the
 * rail exactly as it does in the body.
 *
 * Built with `h()` rather than `v-html`. The nodes come from our own content,
 * but the rail is not the place to hand raw strings to the DOM, and an
 * allow-list means an unexpected tag degrades to its text instead of appearing
 * unstyled in a sidebar.
 */
import { h, type VNode } from 'vue'

const props = defineProps<{ nodes: MarkNode[] }>()

/** Inline tags worth keeping. Anything else renders as its text. */
const ALLOWED: Record<string, string> = {
  code: 'code',
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  s: 's',
  del: 's',
  sup: 'sup',
  sub: 'sub',
}

function render(nodes: MarkNode[]): (VNode | string)[] {
  return nodes.map(node => {
    if (typeof node === 'string') return node
    const [name, , ...children] = node
    const el = ALLOWED[name]
    return el ? h(el, render(children)) : h('span', render(children))
  })
}
</script>

<template>
  <span class="toc-text"><component :is="() => render(props.nodes)" /></span>
</template>

<style scoped>
.toc-text {
  /*
   * A heading like `--security-opt seccomp=seccomp_profile.json` is one
   * unbreakable monospace run and is wider than the rail. Break inside it
   * rather than letting it spill past the column edge.
   */
  overflow-wrap: anywhere;
}

.toc-text :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.95em;
  /*
   * No background or padding. In the body a code span is a chip; in a
   * one-column rail of 0.8rem links that reads as clutter, and the monospace
   * face alone is enough to say "this is a keyword".
   */
  background: none;
  padding: 0;
  border: 0;
}

.toc-text :deep(strong) {
  font-weight: 600;
}

.toc-text :deep(em) {
  font-style: italic;
}
</style>
