<script setup lang="ts">
/**
 * Every fenced code block in Markdown, rendered as an <Editor>.
 *
 * Nuxt Content ships its own Shiki, but it resolves themes by bundled name and
 * so cannot use themes/rfb-plate.json, and it does not know the Robot Framework
 * grammars. Fighting that leaves the docs highlighted differently from an
 * <Editor> on the same page — two code presentations on one site.
 *
 * Overriding ProsePre sidesteps it entirely: the raw `code` prop goes to the
 * same component the rest of the site uses, so there is one plate, one syntax
 * palette and one copy button everywhere. Content's own tokenised output is
 * simply ignored.
 *
 * Fence syntax:
 *   ```robot                      a full suite
 *   ```robot-repl                 a bare keyword sequence
 *   ```robot [login.robot]        with a filename in the tab
 */
import type { Lang } from '~/utils/lang'

const props = defineProps<{
  code?: string
  language?: string | null
  filename?: string | null
  highlights?: number[]
  meta?: string | null
}>()

/** What a reader should see on the tab when the author gave no filename. */
const LABEL: Record<string, string> = {
  robot: 'Robot Framework',
  'robot-repl': 'Robot Framework',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  json: 'JSON',
  bash: 'Shell',
  sh: 'Shell',
  shell: 'Shell',
  dockerfile: 'Dockerfile',
  yaml: 'YAML',
}

const ALIAS: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  robotframework: 'robot',
  docker: 'dockerfile',
  yml: 'yaml',
}

const lang = computed(() => {
  const raw = (props.language ?? 'text').toLowerCase()
  return (ALIAS[raw] ?? raw) as Lang
})

/*
 * A fence with no filename gets no chrome. Writing ```robot in Markdown is a
 * statement about the language, not a request for a tab reading "Robot
 * Framework" — the highlighting already says that.
 */
const hasChrome = computed(() => Boolean(props.filename))

const name = computed(() => props.filename || LABEL[props.language ?? ''] || (props.language ?? 'text'))

const file = computed(() => ({
  name: name.value,
  lang: lang.value,
  code: props.code ?? '',
  highlightLines: props.highlights,
}))
</script>

<template>
  <Editor :files="[file]" :line-numbers="false" :chrome="hasChrome" />
</template>
