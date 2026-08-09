import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const OUT = join(ROOT, '.output/public')
const built = existsSync(OUT)

describe('catch-all routes tolerate a trailing slash', () => {
  it('normalises empty segments out of the docs path', () => {
    const src = readFileSync(join(ROOT, 'app/pages/docs/[...slug].vue'), 'utf8')
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

  it('keeps the landing page content free of competitor positioning', () => {
    /*
     * The landing page sells the library on its own merits; the comparisons
     * live under /why. Scoped to the body below the header on purpose — the
     * navbar links every comparison from every page, which is navigation, not
     * positioning. What must stay clean is the copy.
     */
    const html = page('')
    const body = html.slice(html.indexOf('</header>'))
    for (const name of ['SeleniumLibrary', 'Cypress', 'Selenium']) {
      expect(body, `landing page copy mentions ${name}`).not.toContain(name)
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
      /*
       * Two *panes*, not two editors on the page: these pages are prose now
       * and carry their own code samples besides the comparison.
       */
      // `data-side` rather than the class: the class also appears in the CSS.
      expect((html.match(/data-side="/g) ?? []).length, tool).toBe(2)
      expect((html.match(/plate editor/g) ?? []).length, tool).toBeGreaterThanOrEqual(2)
      expect(new Set(html.match(/color:#[0-9A-F]{6}/g) ?? []).size, tool).toBeGreaterThan(3)
    }
  })

  it('renders the guide with its MDC-embedded components', () => {
    const html = page('docs/start/getting-started')
    expect(html).toContain('plate term')
    expect(html).toContain('plate editor')
  })

  it('never emits an unhighlighted fallback block in a prerendered page', () => {
    // The fallback is escaped plain text with no colour. Seeing it in the
    // output means highlighting failed at build.
    for (const p of ['', 'why/vs-cypress', 'docs/start/getting-started']) {
      const html = page(p)
      const bodies = html.match(/<pre[^>]*>[\s\S]{0,400}?<\/pre>/g) ?? []
      for (const b of bodies) {
        if (b.includes('class="line"')) expect(b, `${p}: unhighlighted block`).toContain('color:#')
      }
    }
  })
})

describe.skipIf(!built)('navigation', () => {
  const html = readFileSync(join(OUT, 'index.html'), 'utf8')

  it('links every tool comparison from the navbar', () => {
    // They were reachable only from /why before, which meant a reader had to
    // know they existed.
    for (const slug of ['vs-cypress', 'vs-playwright', 'vs-seleniumlibrary']) {
      expect(html, slug).toContain(`/why/${slug}`)
    }
  })

  it('opens the dropdown on focus as well as hover', () => {
    const header = readFileSync(join(process.cwd(), 'app/components/SiteHeader.vue'), 'utf8')
    // Hover alone is unreachable from a keyboard.
    expect(header).toContain('.has-menu:focus-within .menu')
  })

  it('drives the small-screen menu without JavaScript', () => {
    const header = readFileSync(join(process.cwd(), 'app/components/SiteHeader.vue'), 'utf8')
    expect(header).toContain('.menu-toggle:checked ~ .nav')
  })
})

describe.skipIf(!built)('keyword rail', () => {
  const html = readFileSync(join(OUT, 'keywords/index.html'), 'utf8')

  it('has exactly three sections', () => {
    expect((html.match(/class="acc-head"/g) ?? []).length).toBe(3)
    for (const label of ['Documentation', 'Keywords', 'Data types']) {
      expect(html).toContain(label)
    }
  })

  it('opens Keywords by default and only Keywords', () => {
    /*
     * The whole tag, not everything after the class: `checked` is bound now,
     * and Vue renders it *before* the class attribute, so a pattern anchored
     * on the class stopped seeing it.
     */
    const radios = html.match(/<input[^>]*acc-radio[^>]*>/g) ?? []
    expect(radios).toHaveLength(3)
    expect(radios.filter(r => r.includes('checked'))).toHaveLength(1)
    expect(radios[1]).toContain('checked')
  })

  it('collapses a section by opening its fallback', () => {
    /*
     * Clicking the open section closes it, and closing one is the same action
     * as opening another — so the rail is never three shut headings with
     * nothing under them. Away from docs or types you want the keywords; away
     * from the keywords you want the docs.
     */
    const src = readFileSync(join(process.cwd(), 'app/components/KeywordReference.vue'), 'utf8')
    expect(src).toMatch(/docs:\s*'kw'/)
    expect(src).toMatch(/types:\s*'kw'/)
    expect(src).toMatch(/kw:\s*'docs'/)
  })

  it('opens a data type as a dialog with a way back', () => {
    // `:target` so it works without JavaScript; Back closes it either way.
    expect(readFileSync(join(process.cwd(), 'app/assets/css/keywords.css'), 'utf8'))
      .toMatch(/\.type:target\s*\{[^}]*position:\s*fixed/)
    const src = readFileSync(join(process.cwd(), 'app/components/KeywordReference.vue'), 'utf8')
    expect(src).toContain('type-backdrop')
    expect(src).toContain('router.back()')
    expect(src).toContain("e.key === 'Escape'")
  })
})

describe('content queries', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

  it('guards every content query for the server and dev, inline', () => {
    /*
     * Two failures are guarded here at once — see app/utils/content-guard.md.
     *
     * Without `import.meta.dev` the page 404s on a client-side navigation in
     * dev, because dev has no payload extraction to fall back on.
     *
     * And the guard has to be inline: extracting it into a composable put the
     * query behind a function boundary, so it could no longer be eliminated
     * as dead code and Nuxt Content's SQLite engine came back — reachable
     * client JS went from 361 KB to 574 KB.
     */
    for (const f of [
      'app/pages/docs/[...slug].vue',
      'app/pages/why/index.vue',
      'app/pages/why/[tool].vue',
      'app/components/SiteHeader.vue',
    ]) {
      const src = read(f)
      expect(src, `${f} is missing the inline guard`).toContain(
        'import.meta.server || import.meta.dev',
      )
      expect(src, `${f} hides the query behind a composable`).not.toContain('useServerContent(')
    }
  })
})
