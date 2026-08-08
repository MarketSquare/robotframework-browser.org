import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

describe.skipIf(!ready)('generated payloads', () => {
  const gen = JSON.parse(readFileSync(GEN, 'utf8'))
  const dir = join(ROOT, 'public/libdoc', gen.version)

  it('emits one payload per keyword in the index', () => {
    const files = new Set(readdirSync(join(dir, 'keywords')))
    for (const entry of gen.index) {
      expect(files.has(`${entry.slug}.json`), `missing payload for ${entry.name}`).toBe(true)
    }
    expect(files.size).toBe(gen.index.length)
  })

  it('emits one payload per type', () => {
    const files = readdirSync(join(dir, 'types'))
    expect(files.length).toBe(gen.types.length)
  })

  it('keeps the build-time index small enough to ship on every page', () => {
    // It is imported into the client bundle, so this is a real budget.
    expect(readFileSync(GEN, 'utf8').length).toBeLessThan(120_000)
  })

  it('never ships the whole spec to the client', () => {
    const source = readFileSync(join(ROOT, `content/libdoc/Browser-${gen.version}.json`), 'utf8')
    expect(readFileSync(GEN, 'utf8').length).toBeLessThan(source.length / 5)
  })

  it('every argument type link points at a payload that exists', () => {
    const types = new Set(readdirSync(join(dir, 'types')))
    for (const entry of gen.index) {
      const kw = JSON.parse(readFileSync(join(dir, 'keywords', `${entry.slug}.json`), 'utf8'))
      for (const arg of kw.args) {
        if (!arg.typeHref) continue
        const slug = arg.typeHref.split('/').pop()
        expect(types.has(`${slug}.json`), `${kw.name} -> ${arg.typeHref}`).toBe(true)
      }
      if (kw.returnTypeHref) {
        const slug = kw.returnTypeHref.split('/').pop()
        expect(types.has(`${slug}.json`), `${kw.name} returns ${kw.returnTypeHref}`).toBe(true)
      }
    }
  })

  it('every reverse usage link points at a keyword that exists', () => {
    const keywords = new Set(readdirSync(join(dir, 'keywords')))
    for (const file of readdirSync(join(dir, 'types'))) {
      const t = JSON.parse(readFileSync(join(dir, 'types', file), 'utf8'))
      for (const u of t.usedBy) {
        expect(keywords.has(`${u.slug}.json`), `${t.name} -> ${u.slug}`).toBe(true)
      }
    }
  })

  it('leaves no unrewritten libdoc fragment in any payload', () => {
    for (const file of readdirSync(join(dir, 'keywords'))) {
      const kw = JSON.parse(readFileSync(join(dir, 'keywords', file), 'utf8'))
      expect(kw.doc, kw.name).not.toMatch(/href="#[A-Z]/)
    }
  })

  it('records a version manifest for the switcher', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public/libdoc/versions.json'), 'utf8'))
    expect(manifest.latest).toBe(gen.version)
    expect(manifest.versions).toContain(gen.version)
  })
})
