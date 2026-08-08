import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  type LibdocSpec,
  SPEC_VERSION,
  moduleToName,
  normaliseTag,
  rewriteHref,
  slug,
  transform,
} from '../lib/libdoc'

const ROOT = process.cwd()
const SPEC: LibdocSpec = JSON.parse(
  readFileSync(join(ROOT, 'content/libdoc/Browser-20.2.0.json'), 'utf8'),
)
const GROUPS = JSON.parse(readFileSync(join(ROOT, 'content/keyword-groups.json'), 'utf8')).groups

describe('slug', () => {
  it('makes keyword names URL-safe and stable', () => {
    expect(slug('Get Element States')).toBe('get-element-states')
    expect(slug('Click With Options')).toBe('click-with-options')
    expect(slug('MouseButton')).toBe('mousebutton')
  })

  it('collapses punctuation rather than emitting it', () => {
    expect(slug('Get Cookie(s)')).toBe('get-cookie-s')
    expect(slug('  Padded  ')).toBe('padded')
  })
})

describe('normaliseTag', () => {
  it('folds the upstream inconsistency', () => {
    // `Download` carries "Page Content"; 82 other keywords carry "PageContent".
    // Left alone, one stray space forks the tag filter into two entries.
    expect(normaliseTag('Page Content')).toBe('PageContent')
    expect(normaliseTag('PageContent')).toBe('PageContent')
  })
})

describe('moduleToName', () => {
  it('title-cases an unmapped module so it never vanishes silently', () => {
    expect(moduleToName('locator_handler.py')).toBe('Locator Handler')
    expect(moduleToName('pdf.py')).toBe('Pdf')
  })
})

describe('rewriteHref', () => {
  const ctx = { keywordNames: new Set(['Add Cookie', 'Click']), typeNames: new Set(['Proxy']) }

  it('routes a keyword anchor to its page', () => {
    expect(rewriteHref('#Add%20Cookie', ctx)).toBe('/keywords/add-cookie')
  })

  it('routes a type anchor to its type page', () => {
    expect(rewriteHref('#type-Proxy', ctx)).toBe('/keywords/types/proxy')
  })

  it('keeps absolute links', () => {
    expect(rewriteHref('https://playwright.dev/', ctx)).toBe('https://playwright.dev/')
  })

  it('sends an unknown fragment to the introduction, not a dead keyword route', () => {
    expect(rewriteHref('#Implicit waiting', ctx)).toBe('/keywords#implicit-waiting')
  })

  it('unlinks a type anchor with no typedoc', () => {
    expect(rewriteHref('#type-Nope', ctx)).toBeNull()
  })

  it('unlinks the broken relative hrefs upstream ships', () => {
    // `create`, `install` and `Secret` appear as bare relative hrefs in the
    // library docstrings; linking them would produce 404s on our routes.
    for (const h of ['create', 'install', 'Secret', 'chrome://version']) {
      expect(rewriteHref(h, ctx)).toBeNull()
    }
  })
})

describe('transform over the real spec', () => {
  let result: Awaited<ReturnType<typeof transform>>

  beforeAll(async () => {
    result = await transform(SPEC, {
      highlight: async code => code, // identity: highlighting is tested elsewhere
      groups: GROUPS,
      sourceBase: 'https://example.test/blob/main',
    })
  })

  it('rejects an unexpected specversion rather than guessing', async () => {
    await expect(
      transform({ ...SPEC, specversion: 4 }, { highlight: async c => c, groups: GROUPS }),
    ).rejects.toThrow(/specversion 4 is not 3/)
    expect(SPEC.specversion).toBe(SPEC_VERSION)
  })

  it('resolves every keyword', () => {
    expect(result.keywords).toHaveLength(151)
    expect(result.index).toHaveLength(151)
  })

  it('maps every module, so no group falls back', () => {
    expect(result.warnings).toEqual([])
    expect(result.groups).toHaveLength(20)
  })

  it('group counts add up to the keyword total', () => {
    expect(result.groups.reduce((n, g) => n + g.count, 0)).toBe(151)
  })

  it('orders groups by the mapping, not alphabetically', () => {
    expect(result.groups[0]!.name).toBe('Interaction')
    expect(result.groups[0]!.count).toBe(32)
    expect(result.groups[1]!.name).toBe('Getters & Assertions')
    expect(result.groups[1]!.count).toBe(28)
  })

  it('never emits a nameless argument', () => {
    // NAMED_ONLY_MARKER is the bare `*` separator: a marker, not an argument.
    // Rendered as a row it would be an empty line in every argument table.
    const nameless = result.keywords.flatMap(k =>
      k.args.filter(a => !a.name).map(a => `${k.name}:${a.repr}`),
    )
    expect(nameless).toEqual([])
  })

  it('still records named-only arguments that followed the marker', () => {
    const kw = result.keywords.find(k => k.name === 'Add Locator Handler Click')!
    expect(kw.args.some(a => a.namedOnly)).toBe(true)
  })

  it('links argument types to their type pages', () => {
    const click = result.keywords.find(k => k.name === 'Click')!
    const button = click.args.find(a => a.name === 'button')!
    expect(button.typeName).toBe('MouseButton')
    expect(button.typeHref).toBe('/keywords/types/mousebutton')
    expect(button.defaultValue).toBe('left')
    expect(button.required).toBe(false)
  })

  it('builds the reverse type index', () => {
    const mb = result.types.find(t => t.name === 'MouseButton')!
    expect(mb.kind).toBe('Enum')
    expect(mb.members.map(m => m.name)).toEqual(['left', 'middle', 'right'])
    expect(mb.usedBy.map(u => u.name)).toContain('Click')
  })

  it('gives every type a unique slug', () => {
    const slugs = result.types.map(t => t.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('gives every keyword a unique slug', () => {
    const slugs = result.keywords.map(k => k.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('points source links at the exact defining line', () => {
    const click = result.keywords.find(k => k.name === 'Click')!
    expect(click.sourceUrl).toMatch(/Browser\/keywords\/interaction\.py#L\d+$/)
  })

  it('keeps the documentation rather than sanitizing it away', () => {
    // libdoc's HTML is the only copy of the docs; an over-eager allowlist
    // would show up as blank pages, not an error.
    for (const kw of result.keywords) {
      const source = SPEC.keywords.find(s => s.name === kw.name)!.doc
      if (source.length > 200) expect(kw.doc.length).toBeGreaterThan(source.length * 0.4)
    }
  })

  it('strips script and event handlers', () => {
    const ctx = { keywordNames: new Set<string>(), typeNames: new Set<string>() }
    return import('../lib/libdoc').then(async ({ renderDoc }) => {
      const out = await renderDoc(
        '<p onclick="steal()">hi</p><script>bad()</script>',
        ctx,
        async c => c,
      )
      expect(out).not.toContain('onclick')
      expect(out).not.toContain('script')
      expect(out).toContain('hi')
    })
  })

  it('leaves no unrewritten libdoc fragment in the output', () => {
    // A surviving `#Some%20Keyword` would be a dead link on our routes.
    for (const kw of result.keywords) {
      expect(kw.doc, kw.name).not.toMatch(/href="#[A-Z]/)
    }
  })

  it('marks external links safe', () => {
    const withExternal = result.keywords.find(k => k.doc.includes('href="http'))!
    expect(withExternal.doc).toContain('rel="noopener noreferrer"')
  })
})

describe('renderInline', () => {
  it('renders Robot Framework inline markup in the summary', async () => {
    const { renderInline } = await import('../lib/libdoc')
    // shortdoc is the one field libdoc leaves as raw text.
    expect(renderInline('Simulates a click on ``selector``.')).toBe(
      'Simulates a click on <code>selector</code>.',
    )
    expect(renderInline('This is *bold* text')).toBe('This is <b>bold</b> text')
    expect(renderInline('This is _italic_ text')).toBe('This is <i>italic</i> text')
  })

  it('escapes HTML before rendering markup', async () => {
    const { renderInline } = await import('../lib/libdoc')
    expect(renderInline('<script>x</script>')).toBe('&lt;script&gt;x&lt;/script&gt;')
    expect(renderInline('a < b && c > d')).toBe('a &lt; b &amp;&amp; c &gt; d')
  })

  it('leaves lone asterisks and underscores alone', async () => {
    const { renderInline } = await import('../lib/libdoc')
    expect(renderInline('*** Test Cases ***')).toBe('*** Test Cases ***')
    expect(renderInline('snake_case_name')).toBe('snake_case_name')
  })

  it('leaves no raw double-backticks anywhere in the index', async () => {
    const result = await transform(SPEC, { highlight: async c => c, groups: GROUPS })
    for (const k of result.index) {
      expect(k.shortdocHtml, k.name).not.toContain('``')
    }
  })
})
