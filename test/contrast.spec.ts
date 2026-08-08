import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const TOKENS = readFileSync(join(process.cwd(), 'app/assets/css/tokens.css'), 'utf8')

function blockAfter(marker: string): string {
  const i = TOKENS.indexOf(marker)
  const open = TOKENS.indexOf('{', i)
  let depth = 0
  for (let j = open; j < TOKENS.length; j++) {
    if (TOKENS[j] === '{') depth++
    if (TOKENS[j] === '}') {
      depth--
      if (depth === 0) return TOKENS.slice(open + 1, j)
    }
  }
  return ''
}

const value = (css: string, name: string) =>
  css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{3,8})`, 'i'))?.[1]?.toLowerCase()

const LIGHT = blockAfter(':root {')
const DARK = blockAfter(":root[data-theme='dark']")

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

describe('the plate is a distinct surface in both themes', () => {
  const plate = value(LIGHT, '--term-bg')!

  it('never equals the page ground', () => {
    // This shipped broken once: dark --paper and --term-bg were both #14120f,
    // so every code block and terminal was invisible against the page.
    expect(value(LIGHT, '--paper')).not.toBe(plate)
    expect(value(DARK, '--paper')).not.toBe(plate)
    expect(value(DARK, '--panel')).not.toBe(plate)
    expect(value(DARK, '--chrome')).not.toBe(plate)
  })

  it('is the darkest surface in both themes', () => {
    // One rule, not two: the plate always reads as an inset. Placing the dark
    // page ground *below* #14120f is not possible with a perceptible step, so
    // the dark theme is a warm charcoal rather than a near-black.
    for (const theme of [LIGHT, DARK]) {
      for (const surface of ['--paper', '--panel', '--chrome']) {
        expect(luminance(plate)).toBeLessThan(luminance(value(theme, surface)!))
      }
    }
  })

  it('separates from the dark page ground by a perceptible step', () => {
    // --chrome is a page rail and never sits directly behind a plate, so it
    // only needs to differ in value; --paper needs a real step.
    // Adjacent dark surfaces cannot reach 3:1 without going light, so this is
    // a floor on "visibly different", not a WCAG text threshold.
    expect(ratio(plate, value(DARK, '--paper')!)).toBeGreaterThan(1.25)
  })
})

describe('plate internals separate', () => {
  const bg = value(LIGHT, '--term-bg')!
  const chrome = value(LIGHT, '--term-chrome')!
  const tab = value(LIGHT, '--term-tab')!

  it('steps content -> bar -> inactive tab, each lighter than the last', () => {
    expect(luminance(chrome)).toBeGreaterThan(luminance(bg))
    expect(luminance(tab)).toBeGreaterThan(luminance(chrome))
  })

  it('separates the bar from the code it sits on', () => {
    expect(ratio(chrome, bg)).toBeGreaterThan(1.25)
  })

  it('keeps the dimmest plate ink readable on the bar', () => {
    // --term-faint carries line numbers and the status strip. At its original
    // #6f675c it was 2.3:1 on the bar.
    expect(ratio(value(LIGHT, '--term-faint')!, chrome)).toBeGreaterThan(4.5)
    expect(ratio(value(LIGHT, '--term-faint')!, bg)).toBeGreaterThan(4.5)
  })
})

describe('text contrast', () => {
  it('meets AA for body ink on both grounds', () => {
    expect(ratio(value(LIGHT, '--ink')!, value(LIGHT, '--paper')!)).toBeGreaterThan(4.5)
    expect(ratio(value(DARK, '--ink')!, value(DARK, '--paper')!)).toBeGreaterThan(4.5)
  })

  it('meets AA for the secondary ink on both grounds', () => {
    expect(ratio(value(LIGHT, '--dim')!, value(LIGHT, '--paper')!)).toBeGreaterThan(4.5)
    expect(ratio(value(DARK, '--dim')!, value(DARK, '--paper')!)).toBeGreaterThan(4.5)
  })

  it('meets AA for red used as small text', () => {
    expect(ratio(value(LIGHT, '--red-text')!, value(LIGHT, '--paper')!)).toBeGreaterThan(4.5)
    expect(ratio(value(DARK, '--red-text')!, value(DARK, '--paper')!)).toBeGreaterThan(4.5)
  })

  it('meets AA for the structural teal on both grounds', () => {
    expect(ratio(value(LIGHT, '--teal')!, value(LIGHT, '--paper')!)).toBeGreaterThan(4.5)
    expect(ratio(value(DARK, '--teal')!, value(DARK, '--paper')!)).toBeGreaterThan(4.5)
  })

  it('meets AA for every syntax colour on the plate', () => {
    const bg = value(LIGHT, '--term-bg')!
    for (const tok of ['--tok-sand', '--tok-amber', '--tok-violet', '--term-red', '--term-teal', '--term-ink']) {
      expect(ratio(value(LIGHT, tok)!, bg), `${tok} on the plate`).toBeGreaterThan(4.5)
    }
  })
})

describe('corner shape', () => {
  it('defines a radius so corner-shape has something to shape', () => {
    expect(LIGHT).toContain('--radius:')
    expect(LIGHT).toContain('--radius-sm:')
  })

  it('treats the bevel as progressive enhancement over the radius', () => {
    const base = readFileSync(join(process.cwd(), 'app/assets/css/base.css'), 'utf8')
    const plate = readFileSync(join(process.cwd(), 'app/assets/css/plate.css'), 'utf8')
    expect(base).toContain('@supports (corner-shape: bevel)')
    expect(plate).toContain('@supports (corner-shape: bevel)')
    // Never bare: without a radius fallback, old browsers get square corners.
    expect(plate).toMatch(/border-radius: var\(--radius\)/)
  })
})
