<script setup lang="ts">
/**
 * <Editor> — all code. Spec §5.4, D21.
 *
 * A simplified homage to VS Code, not a reproduction. Four cues carry the
 * read: tab bar with a file glyph, line-number gutter, status strip, copy
 * button. Deliberately absent: sidebar, activity bar, minimap, window
 * controls. Traffic lights belong to <Terminal>, and keeping them there is
 * what lets a reader tell the two apart at a glance.
 *
 * Tab switching is a radio group driven entirely by CSS, so it works with
 * JavaScript disabled. The radios are direct children of .plate so a general
 * sibling selector can reach the panes; see MAX_TABS in plate.css.
 *
 * Highlighting runs at prerender only. The dynamic import sits behind
 * `import.meta.server`, which Nuxt strips from the client build, so Shiki
 * and ~250 KB of grammars never reach the browser.
 */
import { LANG_LABEL, type Lang } from '~/utils/lang'

export interface EditorFile {
  /** Shown in the tab; its extension picks the glyph. */
  name: string
  lang: Lang
  code: string
  /** 1-based lines to mark. */
  highlightLines?: number[]
}

/**
 * withDefaults is required, not stylistic: Vue casts an *absent* Boolean prop
 * to `false`, never `undefined`. Defaulting via `props.lineNumbers !== false`
 * therefore silently turned the gutter off everywhere the prop was omitted.
 */
const props = withDefaults(
  defineProps<{
    files: EditorFile[]
    /** On by default; pass false for short snippets where counting is noise. */
    lineNumbers?: boolean
  }>(),
  { lineNumbers: true },
)

/** Keep in step with the generated rules in plate.css. */
const MAX_TABS = 6
if (props.files.length > MAX_TABS) {
  throw new Error(
    `<Editor> supports up to ${MAX_TABS} tabs without JavaScript; got ${props.files.length}. ` +
      `Add rules to plate.css if this is genuinely needed.`,
  )
}

const uid = useId()
const showLines = computed(() => props.lineNumbers)

const prepared = computed(() =>
  props.files.map(f => {
    const code = f.code.replace(/\n+$/, '')
    return { ...f, code, lines: code.split('\n').length }
  }),
)

const { data: rendered } = await useAsyncData(`editor-${uid}`, async () => {
  if (import.meta.server) {
    const { highlight } = await import('~/utils/highlight')
    return Promise.all(
      prepared.value.map(f => highlight(f.code, f.lang, { highlightLines: f.highlightLines })),
    )
  }
  return []
})

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }

/** Escaped plain text, so a highlighter failure still renders readable code. */
function fallback(code: string) {
  return code
    .split('\n')
    .map(l => `<span class="line">${l.replace(/[&<>]/g, c => ESC[c]!)}</span>`)
    .join('\n')
}

function gutter(n: number) {
  const width = String(n).length
  return Array.from({ length: n }, (_, i) => String(i + 1).padStart(width, ' ')).join('\n')
}
</script>

<template>
  <div class="plate editor" :data-tabs="prepared.length">
    <!--
      Direct children of .plate on purpose: `~ .pane` needs them to be
      siblings of the panes. Visually hidden but focusable, so the tab bar
      is keyboard-operable as a native radio group.
    -->
    <input
      v-for="(f, i) in prepared"
      :id="`${uid}-f${i}`"
      :key="`r-${f.name}`"
      class="plate-radio"
      type="radio"
      :name="`${uid}-file`"
      :checked="i === 0"
    >

    <div class="plate-bar">
      <div class="plate-tabs">
        <label
          v-for="(f, i) in prepared"
          :key="`t-${f.name}`"
          class="plate-tab plate-tab--file"
          :data-index="i"
          :for="`${uid}-f${i}`"
        >
          <FileGlyph :name="f.name" />
          {{ f.name }}
        </label>
      </div>

      <span class="plate-actions">
        <!-- ComparisonSplit injects its expand control here. -->
        <slot name="actions" />
        <CopyButton :text="prepared[0]!.code" />
      </span>
    </div>

    <div v-for="(f, i) in prepared" :key="`p-${f.name}`" class="pane" :data-index="i">
      <div class="plate-code">
        <div v-if="showLines" class="plate-gutter" aria-hidden="true">{{ gutter(f.lines) }}</div>
        <div class="plate-body">
          <!-- eslint-disable-next-line vue/no-v-html -- Shiki output, generated at build time from our own content -->
          <pre v-html="rendered?.[i] ?? fallback(f.code)" />
        </div>
      </div>
      <div class="plate-status">
        <span>{{ LANG_LABEL[f.lang] ?? f.lang }}</span>
        <span>{{ f.lines }} {{ f.lines === 1 ? 'line' : 'lines' }}</span>
        <span class="push">UTF-8</span>
      </div>
    </div>
  </div>
</template>
