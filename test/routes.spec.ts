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
    // A radio group cannot have nothing selected, so one section is always
    // open and closing one is the same action as opening another.
    const radios = html.match(/class="acc-radio"[^>]*>/g) ?? []
    expect(radios).toHaveLength(3)
    expect(radios.filter(r => r.includes('checked'))).toHaveLength(1)
    expect(radios[1]).toContain('checked')
  })
})

describe('content queries', () => {
  const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

  it('routes every content query through the guarded composable', () => {
    /*
     * Guarding on `import.meta.server` alone shipped a bug that only appeared
     * in dev: production carries the result in the prerendered payload, but
     * `nuxt dev` has no payload extraction, so a client-side navigation ran
     * the handler in the browser, got nothing, and the page threw its own 404
     * — then rendered fine on reload. One composable states the rule once.
     */
    for (const f of [
      'app/pages/guides/[...slug].vue',
      'app/pages/why/index.vue',
      'app/pages/why/[tool].vue',
      'app/components/SiteHeader.vue',
    ]) {
      const src = read(f)
      expect(src, `${f} should use useServerContent`).toContain('useServerContent(')
      expect(src, `${f} still has a bare import.meta.server guard`).not.toMatch(
        /import\.meta\.server\s*\?/,
      )
    }
  })

  it('lets the query run on the client in dev, so navigation works there', () => {
    const src = read('app/composables/useServerContent.ts')
    expect(src).toContain('import.meta.server || import.meta.dev')
  })
})
