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
    expect(src).toContain('{ lineNumbers: true }')
    // The comment above the fix names the old pattern, so strip comments first.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    expect(code).not.toContain('props.lineNumbers !== false')
  })
})
