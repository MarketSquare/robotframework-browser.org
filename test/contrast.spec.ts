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

  it('separates from the dark page ground, by border as much as by value', () => {
    /*
     * The dark ground is Robot Framework's own #1c2227. Reaching even a 1.25
     * luminance ratio below it would require the plate to be very near pure
     * black — WCAG ratio is simply the wrong instrument for two adjacent dark
     * surfaces. So the value step is a small floor, and the plate's border is
     * what actually draws the edge. Both are required.
     */
    expect(ratio(plate, value(DARK, '--paper')!)).toBeGreaterThan(1.08)

    const plateCss = readFileSync(join(process.cwd(), 'app/assets/css/plate.css'), 'utf8')
    expect(plateCss).toMatch(/\.plate\s*\{[^}]*border:\s*1px solid var\(--term-line\)/)

    // And that border must itself be visible against the plate it edges.
    expect(ratio(value(LIGHT, '--term-line')!, plate)).toBeGreaterThan(1.6)
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

  it('meets AA for the logo green used as an accent on both grounds', () => {
    expect(ratio(value(LIGHT, '--green')!, value(LIGHT, '--paper')!)).toBeGreaterThan(4.5)
    expect(ratio(value(DARK, '--green')!, value(DARK, '--paper')!)).toBeGreaterThan(4.5)
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

describe('high contrast mode', () => {
  const HC = blockAfter(":root[data-theme='contrast']")

  it('defines every themed token', () => {
    for (const t of ['--paper','--chrome','--panel','--line','--line-strong','--ink','--dim','--faint','--red','--red-text','--green','--teal']) {
      expect(HC, `${t} missing from the contrast theme`).toContain(`${t}:`)
    }
  })

  it('runs full white on full black', () => {
    expect(value(HC, '--paper')).toBe('#000000')
    expect(value(HC, '--ink')).toBe('#ffffff')
    expect(ratio(value(HC, '--ink')!, value(HC, '--paper')!)).toBeGreaterThan(20)
  })

  it('clears AAA (7:1), not merely AA, for every ink and accent', () => {
    // The whole point of the mode. AA would leave it no better than the
    // default theme, which already passes AA everywhere.
    const ground = value(HC, '--paper')!
    for (const t of ['--ink', '--dim', '--faint', '--red', '--red-text', '--green', '--teal']) {
      expect(ratio(value(HC, t)!, ground), `${t} on black`).toBeGreaterThan(7)
    }
  })

  it('keeps accents distinguishable from each other, not just from the ground', () => {
    // "Colourful" was the ask: red, green and teal must stay separable.
    const [r, g, t] = ['--red', '--green', '--teal'].map(n => value(HC, n)!)
    expect(new Set([r, g, t]).size).toBe(3)
    for (const [a, b] of [[r, g], [g, t], [r, t]]) {
      expect(Math.abs(luminance(a) - luminance(b))).toBeGreaterThan(0.001)
    }
  })

  it('draws borders strongly enough to carry structure on black', () => {
    // With no surface tint to speak of, the border does all the work.
    expect(ratio(value(HC, '--line')!, value(HC, '--paper')!)).toBeGreaterThan(7)
  })

  it('keeps the code plate distinct from the page', () => {
    expect(value(HC, '--panel')).not.toBe(value(HC, '--paper'))
  })

  it('is reachable automatically from the OS setting, not only by toggle', () => {
    expect(TOKENS).toContain('@media (prefers-contrast: more)')
    // ...and must not override an explicit light or dark choice.
    expect(TOKENS).toMatch(/prefers-contrast: more[\s\S]{0,120}not\(\[data-theme='light'\]\)/)
  })

  it('cooperates with Windows High Contrast Mode', () => {
    expect(TOKENS).toContain('@media (forced-colors: active)')
    expect(TOKENS).toContain('CanvasText')
    expect(TOKENS).toContain('Highlight')
  })
})

describe('reading column and section indent', () => {
  const kwCss = readFileSync(join(process.cwd(), 'app/assets/css/keywords.css'), 'utf8')
  const docCss = readFileSync(join(process.cwd(), 'app/assets/css/doc.css'), 'utf8')

  it('sets one content width, used by prose and panels alike', () => {
    // Two tokens for the same intent was the confusion: prose was capped at
    // 66ch while panels ran to 1000px, so body text sat visibly narrower than
    // the panel beneath it on the same page.
    expect(TOKENS).toContain('--measure: 1000px')
    expect(TOKENS).not.toContain('--reading-max')
    expect(docCss).toMatch(/\.doc \{[^}]*max-width: var\(--measure\)/)
    expect(kwCss).toMatch(/\.kw \{[^}]*max-width: var\(--measure\)/)
  })

  it('indents section content but not its heading', () => {
    // Measured from the Libdoc redesign: .section-content is margin-left
    // 1.4rem and the h4 sits flush with the keyword name.
    expect(TOKENS).toContain('--section-indent: 1.4rem')
    expect(kwCss).toMatch(/\.block > \*:not\(h4\) \{\s*margin-left: var\(--section-indent\)/)
  })
})

describe('reading measure', () => {
  it('never caps paragraphs globally', () => {
    const base = readFileSync(join(process.cwd(), 'app/assets/css/base.css'), 'utf8')
    // A blanket `p { max-width }` stopped .doc and .kw filling their own
    // 1000px column. Measure belongs to the container, not the element.
    expect(base).not.toMatch(/^p \{[^}]*max-width/m)
  })
})
