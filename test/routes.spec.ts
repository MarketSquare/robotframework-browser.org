import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const OUT = join(ROOT, '.output/public')
const built = existsSync(OUT)

describe('catch-all routes tolerate a trailing slash', () => {
  it('normalises empty segments out of the guide path', () => {
    const src = readFileSync(join(ROOT, 'app/pages/guides/[...slug].vue'), 'utf8')
    // A static host serves /guides/x/ with the slash, and a catch-all splits
    // that into a trailing empty segment. Without filtering, the content query
    // misses and the page renders blank for every direct visitor.
    expect(src).toContain('.filter(Boolean)')
  })
})

describe.skipIf(!built)('prerendered output', () => {
  const page = (p: string) => readFileSync(join(OUT, p, 'index.html'), 'utf8')

  it('renders the landing page with its components', () => {
    const html = page('')
    expect(html).toContain('plate term')
    expect(html).toContain('plate editor')
    expect(html).toMatch(/color:#[0-9A-F]{6}/)
  })

  it('keeps the landing page free of competitor positioning', () => {
    // The landing page sells the library on its own merits; the comparisons
    // live under /why. This was the original page's stance, and reverting to
    // it was explicit feedback.
    const html = page('')
    for (const name of ['SeleniumLibrary', 'Cypress', 'Selenium']) {
      expect(html, `landing page mentions ${name}`).not.toContain(name)
    }
  })

  it('carries the project own voice on the landing page', () => {
    const html = page('')
    expect(html).toContain('designed for the 2020s')
    expect(html).toContain('Use. Benefit. Contribute.')
    expect(html).toContain('Conscientious assertions')
  })

  it('renders every comparison with both panes highlighted', () => {
    for (const tool of ['vs-cypress', 'vs-playwright', 'vs-seleniumlibrary']) {
      const html = page(`why/${tool}`)
      expect(html, tool).toContain('cmp-wrap')
      // Two editors, one per pane.
      expect((html.match(/plate editor/g) ?? []).length, tool).toBe(2)
      expect(new Set(html.match(/color:#[0-9A-F]{6}/g) ?? []).size, tool).toBeGreaterThan(3)
    }
  })

  it('renders the guide with its MDC-embedded components', () => {
    const html = page('guides/getting-started')
    expect(html).toContain('plate term')
    expect(html).toContain('plate editor')
  })

  it('never emits an unhighlighted fallback block in a prerendered page', () => {
    // The fallback is escaped plain text with no colour. Seeing it in the
    // output means highlighting failed at build.
    for (const p of ['', 'why/vs-cypress', 'guides/getting-started']) {
      const html = page(p)
      const bodies = html.match(/<pre[^>]*>[\s\S]{0,400}?<\/pre>/g) ?? []
      for (const b of bodies) {
        if (b.includes('class="line"')) expect(b, `${p}: unhighlighted block`).toContain('color:#')
      }
    }
  })
})
