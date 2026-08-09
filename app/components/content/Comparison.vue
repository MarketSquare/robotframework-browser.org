<script setup lang="ts">
/**
 * ::comparison{left="comparison/cypress/test.robot" right="comparison/cypress/test.cy.js"}
 *
 * Two real files from examples/, side by side. Nothing is pasted: the sources
 * are read from disk at build time, so what a reader sees is what runs.
 *
 * The tab name and the language are derived from the path rather than passed —
 * a filename that disagreed with the file would be a lie the component could
 * have avoided.
 */
import type { EditorFile } from '~/components/Editor.vue'

const props = defineProps<{
  left: string
  right: string
  /** Structural observations shown beneath. Facts only — no scoring. */
  notes?: string[]
}>()

const LANG: Record<string, EditorFile['lang']> = {
  robot: 'robot',
  py: 'python',
  ts: 'typescript',
  js: 'javascript',
}

function file(path: string): EditorFile {
  const name = path.split('/').pop()!
  const ext = name.split('.').pop()!
  const lang = LANG[ext]
  if (!lang) throw new Error(`No editor language for .${ext} (${path})`)
  return { name, lang, code: exampleSource(path) }
}

const leftFile = computed(() => file(props.left))
const rightFile = computed(() => file(props.right))

/** Stated rather than asserted — the reader can count the gutter. */
const lineNote = computed(
  () => `${exampleLineCount(props.left)} lines vs ${exampleLineCount(props.right)}`,
)

const allNotes = computed(() => [lineNote.value, ...(props.notes ?? [])])
</script>

<template>
  <ComparisonSplit :left="leftFile" :right="rightFile" :notes="allNotes" />
</template>
