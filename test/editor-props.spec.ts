import { readFileSync } from 'node:fs'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

/**
 * Regression guard for a bug found only in the browser: Vue casts an absent
 * Boolean prop to `false`, not `undefined`, so a `props.x !== false` default
 * evaluates to false whenever the prop is omitted — silently disabling the
 * Editor's line-number gutter everywhere it was not passed explicitly.
 */
const Probe = defineComponent({
  props: { lineNumbers: { type: Boolean, default: true } },
  setup: props => () => h('i', { 'data-on': String(props.lineNumbers) }),
})

const Naive = defineComponent({
  props: { lineNumbers: Boolean },
  setup: props => () => h('i', { 'data-on': String(props.lineNumbers !== false) }),
})

describe('boolean prop defaulting', () => {
  it('shows the gutter when the prop is omitted', () => {
    expect(mount(Probe).attributes('data-on')).toBe('true')
  })

  it('hides the gutter only when explicitly false', () => {
    expect(mount(Probe, { props: { lineNumbers: false } }).attributes('data-on')).toBe('false')
    expect(mount(Probe, { props: { lineNumbers: true } }).attributes('data-on')).toBe('true')
  })

  it('demonstrates why `!== false` was the wrong default', () => {
    // Absent Boolean prop -> false, so the "default on" reads as off.
    expect(mount(Naive).attributes('data-on')).toBe('false')
  })
})

describe('Editor source', () => {
  it('uses withDefaults rather than a !== false fallback', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(process.cwd() + '/app/components/Editor.vue', 'utf8')
    expect(src).toContain('withDefaults(')
    expect(src).toMatch(/withDefaults\([\s\S]*lineNumbers: true/)
    // The comment above the fix names the old pattern, so strip comments first.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toContain('props.lineNumbers !== false')
  })
})

describe('payload key stability', () => {
  it('derives the highlight payload key from content, not render order', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(process.cwd() + '/app/components/Editor.vue', 'utf8')
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    // useId() numbers by render order, so it differs between a direct page
    // load and a client-side navigation. Keying the payload on it made the
    // prerendered highlight miss on navigation, and every block fell back to
    // plain text until reload.
    expect(code).not.toMatch(/useAsyncData\(\s*`editor-\$\{uid\}`/)
    expect(code).toContain('useAsyncData(payloadKey')
    expect(code).toMatch(/const payloadKey = `editor-\$\{fnv1a\(/)
  })

  it('never joins fallback lines with a newline', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(process.cwd() + '/app/components/Editor.vue', 'utf8')

    // Only the fallback: the gutter joins line numbers with '\n' on purpose,
    // because it is white-space: pre and the newline IS its line break.
    const fallback = src.slice(src.indexOf('function fallback'), src.indexOf('function gutter'))
    expect(fallback).toContain('.line')
    // `.line` is display:block, so a newline separator breaks every line twice.
    expect(fallback).not.toMatch(/\.join\('\\n'\)/)
    expect(fallback).toMatch(/\.join\(''\)/)
  })
})

describe('Terminal steps', () => {
  it('allows an output-only step without rendering a bare prompt', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(process.cwd() + '/app/components/Terminal.vue', 'utf8')
    // A run summary is pure output; `command: ''` used to render "$" alone.
    expect(src).toContain('command?: string')
    expect(src).toContain('step.command ? [{ kind:')
    expect(src).toContain(".filter((c): c is string => Boolean(c))")
  })
})

describe('Terminal wrapping', () => {
  it('never wraps a shell line', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(process.cwd() + '/app/assets/css/plate.css', 'utf8')
    const block = css.slice(css.indexOf('.term-line {'), css.indexOf('.term-prompt'))
    // A wrapped shell line is a different command from the one you would type.
    expect(block).toContain('white-space: pre;')
    expect(block).not.toContain('pre-wrap')
    expect(block).not.toContain('word-break')
  })

  it('lets the line list grow so the overflow can scroll', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync(process.cwd() + '/app/assets/css/plate.css', 'utf8')
    const block = css.slice(css.indexOf('.term-lines {'), css.indexOf('.term-line {'))
    expect(block).toContain('width: max-content')
    expect(block).toContain('min-width: 100%')
  })
})

describe('Editor highlighting in dev', () => {
  it('renders highlighted after a client-side navigation in dev', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(process.cwd() + '/app/components/Editor.vue', 'utf8')
    /*
     * `nuxt dev` has no payload extraction, so on a client-side navigation the
     * handler runs in the browser. Guarded on import.meta.server alone it
     * returned nothing and every block fell back to plain text until reload —
     * the same failure the content queries had.
     */
    expect(src).toContain('import.meta.server || import.meta.dev')
  })
})

describe('bevelled accents', () => {
  it('paints single-side accents rather than bordering them', async () => {
    const { readFileSync } = await import('node:fs')
    /*
     * A 2px accent border against 1px side borders forces the bevel to change
     * both colour and width along the diagonal, which renders a notch at each
     * corner. Painting the accent as a background layer clips to the bevelled
     * shape instead.
     */
    for (const [file, sel] of [
      ['app/pages/index.vue', '.pillar {'],
      ['app/components/content/DocNote.vue', '.callout {'],
    ] as const) {
      const src = readFileSync(process.cwd() + '/' + file, 'utf8')
      const block = src.slice(src.indexOf(sel), src.indexOf('}', src.indexOf(sel)))
      expect(block, `${file} still borders its accent`).not.toMatch(/border-(top|left): 2px solid var\(--(green|teal|red)\)/)
      expect(block, `${file} should paint the accent`).toContain('linear-gradient(')
    }
  })
})

describe('code blocks look alike', () => {
  const read = (p: string) => readFileSync(process.cwd() + '/' + p, 'utf8')

  it('draws dark scrollbars on every dark plate', async () => {
    const plate = read('app/assets/css/plate.css')
    const doc = read('app/assets/css/doc.css')
    /*
     * :root sets color-scheme: light, so without this the browser renders the
     * light scrollbar inside a near-black block — a pale bar and track that
     * reads as a rendering fault. The Libdoc blocks scroll on themselves, so
     * they need it too.
     */
    expect(plate).toMatch(/\.plate \{[^}]*color-scheme: dark/)
    expect(doc).toMatch(/pre\.doc-code \{[^}]*color-scheme: dark/)
  })

  it('gives a nameless block no chrome, but the same plate', () => {
    const editor = read('app/components/Editor.vue')
    const pre = read('app/components/content/ProsePre.vue')
    expect(editor).toContain('chrome?: boolean')
    expect(editor).toMatch(/withDefaults\([\s\S]*chrome: true/)
    // The bar and status strip go; the plate itself must not.
    expect(editor).toContain(`<div v-if="props.chrome" class="plate-bar">`)
    expect(editor).toContain(`<div v-if="props.chrome" class="plate-status">`)
    expect(editor).toContain(`'is-bare': !props.chrome`)
    // A fence with a filename keeps its tab.
    expect(pre).toContain('const hasChrome = computed(() => Boolean(props.filename))')
  })

  it('keeps the copy button reachable without a bar to hold it', () => {
    const editor = read('app/components/Editor.vue')
    const plate = read('app/assets/css/plate.css')
    expect(editor).toContain('<CopyButton v-else')
    expect(plate).toMatch(/\.plate\.is-bare \.plate-copy \{[^}]*position: absolute/)
  })
})
