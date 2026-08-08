<script setup lang="ts">
/**
 * Several code blocks as one tabbed <Editor>.
 *
 * The code is the body, not an argument:
 *
 *   ::code-tabs
 *   ```robot [login.robot]
 *   *** Test Cases ***
 *   ...
 *   ```
 *
 *   ```python [test_login.py]
 *   ...
 *   ```
 *   ::
 *
 * Every fence keeps its own language and filename, and the whole thing renders
 * as one Editor with a tab per file. A single fence needs no wrapper at all —
 * ProsePre already renders it as an Editor.
 *
 * How it works: Markdown fences reach us as ProsePre vnodes, which carry
 * `code`, `language` and `filename` as props. Walking the slot for those props
 * recovers exactly what the author wrote, so the source of truth stays the
 * fence rather than a YAML block that has to be kept in step by hand.
 */
import type { VNode } from 'vue'

import type { EditorFile } from '~/components/Editor.vue'
import type { Lang } from '~/utils/lang'

const props = withDefaults(defineProps<{ lineNumbers?: boolean }>(), { lineNumbers: false })

const slots = useSlots()

const ALIAS: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  robotframework: 'robot',
}

const LABEL: Record<string, string> = {
  robot: 'Robot Framework',
  'robot-repl': 'Robot Framework',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  json: 'JSON',
  bash: 'Shell',
}

/** Depth-first walk; fences can sit inside paragraphs or fragments. */
function collect(nodes: VNode[] | undefined, found: EditorFile[] = []): EditorFile[] {
  for (const node of nodes ?? []) {
    const p = node?.props as Record<string, unknown> | null
    if (p && typeof p.code === 'string') {
      const raw = String(p.language ?? 'text').toLowerCase()
      const lang = (ALIAS[raw] ?? raw) as Lang
      found.push({
        name: String(p.filename || LABEL[lang] || lang),
        lang,
        code: p.code,
        highlightLines: (p.highlights as number[]) ?? undefined,
      })
    }
    const children = node?.children
    if (Array.isArray(children)) collect(children as VNode[], found)
  }
  return found
}

const files = computed(() => collect(slots.default?.()))
</script>

<template>
  <Editor v-if="files.length" :files="files" :line-numbers="props.lineNumbers" />
  <!-- Nothing recognisable in the body: show it rather than swallow it. -->
  <slot v-else />
</template>
