import { existsSync, readFileSync, readdirSync } from 'node:fs'

interface KeywordArg { typeHref?: string }
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Asserts the emitted payloads, not the transform. Skips when they have not
 * been generated yet so `pnpm test` works on a clean checkout; CI runs
 * `pnpm libdoc` before the suite via `pnpm verify`.
 */
const ROOT = process.cwd()
const GEN = join(ROOT, 'app/generated/libdoc.json')
const ready = existsSync(GEN)

describe('the committed libdoc sources are machine-independent', () => {
  /*
   * Libdoc records every keyword's `source` as an absolute path into whichever
   * throwaway environment generated it. Left alone, the twelve committed files
   * carried 1804 of them — so regenerating a version on another machine
   * produced a 150-line diff that meant nothing, which is precisely the noise
   * that makes the release bot's pull request unreviewable. It also published
   * the generating machine's directory layout to anyone reading the repo.
   *
   * scripts/fetch-libdoc.sh rewrites them to `Browser/keywords/<file>.py`,
   * which is all the renderer ever wanted: it takes basename(source).
   */
  const dir = join(ROOT, 'content/libdoc')
  const sources = readdirSync(dir).filter(f => /^Browser-.+\.json$/.test(f))

  it('has files to check', () => expect(sources.length).toBeGreaterThan(0))

  it.each(sources)('%s records relative source paths only', file => {
    const spec = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    const paths = [...spec.keywords, ...spec.inits].map((k: { source: string | null }) => k.source)
    for (const path of paths) {
      if (path === null) continue
      expect(path, `${file}: absolute source path`).toMatch(/^Browser\/[\w/-]+\.py$/)
    }
  })
})

describe.skipIf(!ready)('generated payloads', () => {
  const gen = JSON.parse(readFileSync(GEN, 'utf8'))
  /*
   * The full payload for the current release: every rendered body, read on the
   * server only. These assertions used to run against one file per keyword
   * under public/, which nothing ever fetched; the invariants are the same and
   * the data is the same, so they moved rather than went away.
   */
  const full = JSON.parse(
    readFileSync(join(ROOT, 'app/generated/full', `${gen.version}.json`), 'utf8'),
  ) as { keywords: { name: string; slug: string; doc: string; args: KeywordArg[]; returnTypeHref?: string }[]
    types: { name: string; slug: string; usedBy: { slug: string }[] }[] }

  it('carries one entry per keyword in the index', () => {
    const slugs = new Set(full.keywords.map(k => k.slug))
    for (const entry of gen.index) {
      expect(slugs.has(entry.slug), `missing payload for ${entry.name}`).toBe(true)
    }
    expect(slugs.size).toBe(gen.index.length)
  })

  it('carries one entry per type', () => {
    expect(full.types.length).toBe(gen.types.length)
  })

  it('keeps the build-time index small enough to ship on every page', () => {
    // It is imported into the client bundle, so this is a real budget.
    expect(readFileSync(GEN, 'utf8').length).toBeLessThan(120_000)
  })

  it('never ships the whole spec to the client', () => {
    const source = readFileSync(join(ROOT, `content/libdoc/Browser-${gen.version}.json`), 'utf8')
    expect(readFileSync(GEN, 'utf8').length).toBeLessThan(source.length / 5)
  })

  it('every argument type link points at a type that exists', () => {
    const types = new Set(full.types.map(t => t.slug))
    for (const kw of full.keywords) {
      for (const arg of kw.args) {
        if (!arg.typeHref) continue
        const s = arg.typeHref.replace(/^#type--/, '')
        expect(types.has(s), `${kw.name} -> ${arg.typeHref}`).toBe(true)
      }
      if (kw.returnTypeHref) {
        const s = kw.returnTypeHref.replace(/^#type--/, '')
        expect(types.has(s), `${kw.name} returns ${kw.returnTypeHref}`).toBe(true)
      }
    }
  })

  it('every reverse usage link points at a keyword that exists', () => {
    const keywords = new Set(full.keywords.map(k => k.slug))
    for (const t of full.types) {
      for (const u of t.usedBy) {
        expect(keywords.has(u.slug), `${t.name} -> ${u.slug}`).toBe(true)
      }
    }
  })

  it('leaves no unrewritten libdoc fragment in any payload', () => {
    for (const kw of full.keywords) {
      expect(kw.doc, kw.name).not.toMatch(/href="#[A-Z]/)
    }
  })

  /*
   * The two generators have to agree. build-versions.ts reads the version from
   * the library checkout and build-libdoc.ts from content/libdoc/LATEST; if
   * they diverge the site renders one release's keywords under another's
   * version number.
   */
  it('agrees with the version manifest', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'app/generated/versions.json'), 'utf8'))
    expect(manifest.browser).toBe(gen.version)
    expect(manifest.documented).toContain(gen.version)
  })

  /*
   * Every in-page link in every version lands on something. This is how the
   * missing Importing section went unnoticed (issue #5575): the introduction
   * links to `#importing` eight times, and the site rendered no such section
   * for any version, because libdoc builds it from `inits` rather than `doc`.
   */
  const versions = ready
    ? readdirSync(join(ROOT, 'app/generated/full')).filter(f => f.endsWith('.json'))
    : []

  it.each(versions)('%s: every in-page link resolves to an anchor on the page', file => {
    const payload = JSON.parse(readFileSync(join(ROOT, 'app/generated/full', file), 'utf8')) as {
      keywords: { slug: string }[]
      types: { anchor: string }[]
      introSections: { slug: string }[]
      importing: { doc: string } | null
    }
    const anchors = new Set([
      // KeywordPanels' landmarks.
      'introduction', 'keywords', 'types',
      ...payload.keywords.map(k => k.slug),
      ...payload.types.map(t => t.anchor),
      ...payload.introSections.map(s => s.slug),
    ])
    // A Documentation entry for Importing must come with something to render.
    if (anchors.has('importing')) expect(payload.importing, 'importing body').toBeTruthy()

    const links = [...JSON.stringify(payload).matchAll(/href=\\"#([^"\\]+)\\"/g)].map(m => m[1]!)
    expect(links.length).toBeGreaterThan(0)
    const dead = [...new Set(links.filter(l => !anchors.has(l)))]
    expect(dead, `${file}: links with no target`).toEqual([])
  })

  /*
   * The payloads nothing fetched. Regenerating must not bring them back: they
   * were 2747 files and 14 MB on every deploy, and they are what stopped Nuxt
   * Studio from loading, since it scans all of public/.
   */
  it('emits nothing into public/', () => {
    expect(existsSync(join(ROOT, 'public/libdoc'))).toBe(false)
  })
})
