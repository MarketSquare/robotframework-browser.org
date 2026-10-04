import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  type LibdocSpec,
  SPEC_VERSIONS,
  moduleToName,
  normaliseTag,
  rewriteHref,
  slug,
  transform,
} from '../lib/libdoc'

const ROOT = process.cwd()

/*
 * Whichever version the site currently documents — pinning the filename here
 * meant this whole file failed to load the day the library was upgraded, and
 * the failure said "no such file" rather than anything about libdoc.
 */
const LATEST = readFileSync(join(ROOT, 'content/libdoc/LATEST'), 'utf8').trim()
const SPEC: LibdocSpec = JSON.parse(
  readFileSync(join(ROOT, `content/libdoc/Browser-${LATEST}.json`), 'utf8'),
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
    expect(rewriteHref('#Add%20Cookie', ctx)).toBe('#add-cookie')
  })

  it('routes a type anchor to its type page', () => {
    expect(rewriteHref('#type-Proxy', ctx)).toBe('#type--proxy')
  })

  it('keeps absolute links', () => {
    expect(rewriteHref('https://playwright.dev/', ctx)).toBe('https://playwright.dev/')
  })

  it('sends an unknown fragment to the introduction section, not a dead anchor', () => {
    expect(rewriteHref('#Implicit waiting', ctx)).toBe('#implicit-waiting')
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
      transform({ ...SPEC, specversion: 5 }, { highlight: async c => c, groups: GROUPS }),
    ).rejects.toThrow(/specversion 5 is not one of 3, 4/)
    expect(SPEC_VERSIONS).toContain(SPEC.specversion)
  })

  it('resolves every keyword', () => {
    /*
     * Counted from the spec, not written down here. The library adds keywords:
     * 20.4.0 brought `Set Storage State` and this read 151, so the release
     * import failed on a number that was only ever a description of one
     * version. What the assertion is for is that nothing is *lost* in the
     * transform, and the spec is what says how many there should be.
     */
    expect(SPEC.keywords.length).toBeGreaterThan(100)
    expect(result.keywords).toHaveLength(SPEC.keywords.length)
    expect(result.index).toHaveLength(SPEC.keywords.length)
  })

  it('maps every module, so no group falls back', () => {
    /*
     * The warning list is the assertion; the count was a second one that only
     * looked like it. `transform` omits a group no keyword landed in — the
     * same mapping over 19.12.4 yields 19 groups, over 20.3.0 twenty — so a
     * fixed number here says "this is the version I was written against"
     * rather than anything about fallbacks.
     *
     * What must hold at every version: nothing fell back, and every group
     * that came out is one we mapped.
     */
    expect(result.warnings).toEqual([])

    const mapped = new Set((GROUPS as { name: string }[]).map(g => g.name))
    expect(result.groups.map(g => g.name).filter(n => !mapped.has(n))).toEqual([])
    expect(result.groups.length).toBeLessThanOrEqual(mapped.size)
    expect(result.groups.length).toBeGreaterThan(0)
  })

  it('group counts add up to the keyword total', () => {
    /* The total, again from the spec rather than from a number typed here. */
    expect(result.groups.reduce((n, g) => n + g.count, 0)).toBe(SPEC.keywords.length)
  })

  it('orders groups by the mapping, not alphabetically', () => {
    /*
     * The whole order against the mapping's own order, rather than the first
     * two names with a keyword count beside each. Those counts — 32 and 28 —
     * held for twelve releases, which is why they read as safe; they still
     * belong to the library, and the ordering they sat next to does not need
     * them. Comparing the full sequence is the stronger claim anyway: it
     * catches a group moving into the middle, which naming two never would.
     */
    const order = (GROUPS as { name: string }[]).map(g => g.name)
    const produced = result.groups.map(g => g.name)

    expect(produced).toEqual(order.filter(n => produced.includes(n)))

    /* And that it is genuinely the mapping's order, not the alphabet's. */
    expect(produced).not.toEqual([...produced].sort())

    /* An empty group is dropped, so anything present has keywords in it. */
    expect(result.groups.filter(g => !g.count)).toEqual([])
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
    expect(button.typeHref).toBe('#type--mousebutton')
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

/*
 * RF 7.5 writes specversion 4. Its one change that matters here: the
 * `Arguments:` list a docstring opens with is lifted out of `doc` and into
 * each argument's own `doc`, and the return section into `returnDoc`. A
 * transform that only bumped the version would render pages with every
 * argument description gone, and nothing would fail.
 *
 * Built from the committed spec with spec-4 fields written in, so this holds
 * whichever version LATEST names.
 */
describe('specversion 4', () => {
  function spec4(): LibdocSpec {
    const spec: LibdocSpec = structuredClone(SPEC)
    spec.specversion = 4
    for (const kw of spec.keywords) {
      kw.returnDoc = ''
      kw.raises = []
      for (const a of kw.args) a.doc = ''
    }
    const click = spec.keywords.find(k => k.name === 'Click')!
    click.args.find(a => a.name === 'button')!.doc =
      '<p>Defaults to <code>left</code>. See <a href="#Mouse%20Button">Mouse Button</a>.</p>'
    click.returnDoc = '<p>Nothing <b>useful</b>.<script>bad()</script></p>'
    return spec
  }

  let result: Awaited<ReturnType<typeof transform>>
  beforeAll(async () => {
    result = await transform(spec4(), { highlight: async c => c, groups: GROUPS })
  })

  it('carries each argument its own documentation, sanitized and link-rewritten', () => {
    const button = result.keywords.find(k => k.name === 'Click')!.args.find(a => a.name === 'button')!
    expect(button.doc).toBe('<p>Defaults to <code>left</code>. See <a href="#mouse-button">Mouse Button</a>.</p>')
  })

  it('carries the return documentation, sanitized', () => {
    const click = result.keywords.find(k => k.name === 'Click')!
    expect(click.returnDoc).toBe('<p>Nothing <b>useful</b>.</p>')
  })

  it('leaves undocumented arguments empty rather than absent', () => {
    const selector = result.keywords.find(k => k.name === 'Click')!.args.find(a => a.name === 'selector')!
    expect(selector.doc).toBe('')
  })

  it('treats an explicit None return as no return value', () => {
    // Spec 3 wrote `returnType: null` for these; spec 4 writes a `None` node.
    // Shown as is, every such keyword would grow a "Returns None" block.
    const spec = spec4()
    spec.keywords[0]!.returnType = { name: 'None', typedoc: 'None', nested: [], union: false, alias: null }
    return transform(spec, { highlight: async c => c, groups: GROUPS }).then(r => {
      expect(r.keywords[0]!.returnTypeName).toBeNull()
      expect(r.keywords[0]!.returnTypeHref).toBeNull()
    })
  })
})

describe('specversion 3', () => {
  it('gives arguments and returns empty documentation, which spec 3 keeps in the body', async () => {
    // Stripped rather than assumed absent: LATEST may already be a spec-4 file.
    const spec: LibdocSpec = structuredClone(SPEC)
    spec.specversion = 3
    for (const kw of spec.keywords) {
      delete kw.returnDoc
      delete kw.raises
      for (const a of kw.args) delete a.doc
    }
    const r = await transform(spec, { highlight: async c => c, groups: GROUPS })
    expect(r.keywords.every(k => k.returnDoc === '' && k.args.every(a => a.doc === ''))).toBe(true)
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

describe('single-page anchors', () => {
  it('keeps type anchors clear of keywords that begin with "Type"', async () => {
    const { typeAnchor } = await import('../lib/libdoc')
    // `Type Secret` slugs to `type-secret`. With a single-hyphen prefix the
    // type `Secret` produced the same id: a duplicate anchor, an unreachable
    // panel, and a filter that could not tell the two apart.
    expect(typeAnchor('Secret')).toBe('type--secret')
    expect(slug('Type Secret')).toBe('type-secret')
    expect(typeAnchor('Secret')).not.toBe(slug('Type Secret'))
    expect(typeAnchor('Text')).not.toBe(slug('Type Text'))
  })

  it('cannot collide by construction, because slug never emits a double hyphen', async () => {
    const { typeAnchor } = await import('../lib/libdoc')
    for (const name of ['Type  Secret', 'Type - Secret', 'Type--Secret', 'type   secret']) {
      expect(slug(name)).toBe('type-secret')
      expect(slug(name)).not.toBe(typeAnchor('Secret'))
    }
  })

  it('gives every anchor on the page a unique id', async () => {
    const result = await transform(SPEC, { highlight: async c => c, groups: GROUPS })
    const anchors = [
      ...result.keywords.map(k => k.slug),
      ...result.types.map(t => t.anchor),
      ...result.introSections.map(s => s.slug),
    ]
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('gives the introduction headings ids, so doc links into them resolve', async () => {
    const result = await transform(SPEC, { highlight: async c => c, groups: GROUPS })
    // Hundreds of links in the keyword docs point into the introduction, and
    // libdoc's own HTML gives those headings no id at all.
    //
    // The h2 check is about the sanitizer, which was stripping the
    // introduction's major headings outright. It used to name one —
    // "Finding elements" — and that is the library's prose: 20.4.0 rewrote
    // the introduction and took twenty-two of its headings away, including
    // both that a neighbouring test was reading. So it asserts the shape
    // instead, which is what the sanitizer can break.
    expect(result.introSections.length).toBeGreaterThan(0)
    expect(result.intro).toMatch(/<h2 id="[^"]+"/)
    for (const s of result.introSections) {
      expect(result.intro, s.slug).toContain(` id="${s.slug}"`)
    }
  })

  it('de-duplicates repeated heading titles', async () => {
    /*
     * Against a spec written here, not against the library's own introduction.
     *
     * This used to look for the two "Examples" sections that Browser's
     * introduction happened to contain. 20.4.0 rewrote that introduction —
     * 33 headings down to 18, both "Examples" among the ones that went — and
     * the test failed with "expected 0 to be greater than 1", which says
     * nothing about de-duplication. The behaviour under test is ours; the
     * prose it was reading belongs to another repository and is free to
     * change.
     */
    const spec = {
      ...SPEC,
      doc: '<h2>Examples</h2>\n<p>one</p>\n<h2>Examples</h2>\n<p>two</p>',
    }
    const result = await transform(spec, { highlight: async c => c, groups: GROUPS })

    const examples = result.introSections.filter(s => s.title === 'Examples')
    expect(examples).toHaveLength(2)
    expect(examples.map(s => s.slug)).toEqual(['examples', 'examples-2'])
    /* Both ids have to exist in the rendered intro, or the anchors go nowhere. */
    expect(result.intro).toContain('id="examples"')
    expect(result.intro).toContain('id="examples-2"')
  })
})
