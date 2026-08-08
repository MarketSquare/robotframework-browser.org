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
 * Highlighting runs at prerender. The dynamic import sits behind
 * `import.meta.server || import.meta.dev`, which Nuxt replaces with literals
 * per module, so in production the branch is dead and neither Shiki nor the
 * ~250 KB of grammars reaches the browser.
 *
 * The dev half is required: `nuxt dev` has no payload extraction, so on a
 * client-side navigation the handler runs in the browser. Without it, every
 * block fell back to unhighlighted plain text until the reader hit reload.
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
    /**
     * Tab bar and status strip. Off for a block with nothing to put in them —
     * a snippet with no filename gets a tab reading "Robot Framework", which
     * is chrome carrying no information. The plate, padding and palette stay
     * identical either way, so bare and full blocks still read as one family.
     */
    chrome?: boolean
  }>(),
  { lineNumbers: true, chrome: true },
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

/**
 * The payload key must be derived from the CONTENT, not from useId().
 *
 * useId() numbers components by render order, which differs between a direct
 * load of a page and a client-side navigation to it. That made the key miss
 * the prerendered payload on navigation, so useAsyncData re-ran its handler in
 * the browser — where the `import.meta.server` branch is stripped, so it
 * returned [] and every block silently fell back to unhighlighted plain text
 * until the reader hit reload.
 *
 * Hashing the files makes the key identical in both cases, so the payload is
 * always found. Two identical Editors sharing a key is correct: same input,
 * same output.
 */
function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

const payloadKey = `editor-${fnv1a(
  props.files.map(f => `${f.name}|${f.lang}|${f.highlightLines?.join(',') ?? ''}|${f.code}`).join('\u0000'),
)}`

const prepared = computed(() =>
  props.files.map(f => {
    const code = f.code.replace(/\n+$/, '')
    return { ...f, code, lines: code.split('\n').length }
  }),
)

const { data: rendered } = await useAsyncData(payloadKey, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
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
    // No separator: `.line` is display:block, so a newline would break twice.
    .join('')
}

function gutter(n: number) {
  const width = String(n).length
  return Array.from({ length: n }, (_, i) => String(i + 1).padStart(width, ' ')).join('\n')
}
</script>

<template>
  <div class="plate editor" :class="{ 'is-bare': !props.chrome }" :data-tabs="prepared.length">
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

    <div v-if="props.chrome" class="plate-bar">
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

    <!-- With no bar to live in, copy floats over the code. -->
    <CopyButton v-else :text="prepared[0]!.code" />

    <div v-for="(f, i) in prepared" :key="`p-${f.name}`" class="pane" :data-index="i">
      <div class="plate-code">
        <div v-if="showLines" class="plate-gutter" aria-hidden="true">{{ gutter(f.lines) }}</div>
        <div class="plate-body">
          <!-- eslint-disable-next-line vue/no-v-html -- Shiki output, generated at build time from our own content -->
          <pre v-html="rendered?.[i] ?? fallback(f.code)" />
        </div>
      </div>
      <div v-if="props.chrome" class="plate-status">
        <span>{{ LANG_LABEL[f.lang] ?? f.lang }}</span>
        <span>{{ f.lines }} {{ f.lines === 1 ? 'line' : 'lines' }}</span>
        <span class="push">UTF-8</span>
      </div>
    </div>
  </div>
</template>
