/**
 * Turns content/libdoc/Browser-<version>.json into the payloads the site
 * serves. Spec §7.2. Run before build: `pnpm libdoc`.
 *
 * Emits, per version:
 *   public/libdoc/<version>/index.json          name, shortdoc, group, tags
 *   public/libdoc/<version>/groups.json         rail structure with counts
 *   public/libdoc/<version>/keywords/<slug>.json
 *   public/libdoc/<version>/types/<slug>.json
 *   app/generated/libdoc.json                   latest index + groups, for
 *                                               route generation and the rail
 *
 * The 0.83 MB source is never shipped: a keyword page loads its own payload
 * plus the shared index.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { type LibdocSpec, transform } from '../lib/libdoc.ts'
import { highlight } from '../lib/highlighter.ts'
import { ROBOT_REPL } from '../app/utils/lang.ts'

const ROOT = resolve(import.meta.dirname, '..')
const SRC = join(ROOT, 'content/libdoc')
const OUT = join(ROOT, 'public/libdoc')
const GEN = join(ROOT, 'app/generated')

const SOURCE_BASE = 'https://github.com/MarketSquare/robotframework-browser/blob/main'

function write(path: string, data: unknown) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(data))
}

const latest = readFileSync(join(SRC, 'LATEST'), 'utf8').trim()
const specFiles = readdirSync(SRC).filter(f => /^Browser-.+\.json$/.test(f))

if (!specFiles.length) throw new Error(`no Browser-*.json in ${SRC}`)

const groups = JSON.parse(readFileSync(join(ROOT, 'content/keyword-groups.json'), 'utf8')).groups

rmSync(OUT, { recursive: true, force: true })
mkdirSync(GEN, { recursive: true })

let latestResult: Awaited<ReturnType<typeof transform>> | undefined

for (const file of specFiles) {
  const spec: LibdocSpec = JSON.parse(readFileSync(join(SRC, file), 'utf8'))
  const result = await transform(spec, {
    highlight: code => highlight(code, ROBOT_REPL),
    groups,
    sourceBase: SOURCE_BASE,
  })

  const dir = join(OUT, result.version)
  write(join(dir, 'index.json'), result.index)
  write(join(dir, 'groups.json'), result.groups)
  for (const kw of result.keywords) write(join(dir, 'keywords', `${kw.slug}.json`), kw)
  for (const t of result.types) write(join(dir, 'types', `${t.slug}.json`), t)

  /*
   * Guard against a sanitizer that quietly eats content: libdoc's HTML is the
   * only copy of the documentation, so a rule that strips too much would show
   * up as blank keyword pages rather than an error.
   */
  const shrunk = result.keywords.filter(k => {
    const source = spec.keywords.find(s => s.name === k.name)!.doc
    return source.length > 200 && k.doc.length < source.length * 0.4
  })
  if (shrunk.length) {
    throw new Error(
      `sanitizing lost more than 60% of the documentation for: ` +
        shrunk.map(k => k.name).join(', '),
    )
  }

  /*
   * The reference is one page, so every anchor shares one namespace: keywords,
   * types and introduction sections together. A duplicate means an unreachable
   * panel. This caught `Type Secret` colliding with the type `Secret`.
   */
  const anchors = [
    ...result.keywords.map(k => k.slug),
    ...result.types.map(t => t.anchor),
    ...result.introSections.map(s => s.slug),
  ]
  const seen = new Set<string>()
  const clashes = anchors.filter(a => (seen.has(a) ? true : (seen.add(a), false)))
  if (clashes.length) {
    throw new Error(`duplicate anchors on the reference page: ${[...new Set(clashes)].join(', ')}`)
  }

  for (const w of result.warnings) console.warn(`  warn: ${w}`)
  console.log(
    `${file} -> ${result.version}: ${result.keywords.length} keywords, ` +
      `${result.types.length} types, ${result.groups.length} groups`,
  )

  if (result.version === latest) {
    latestResult = result

    /*
     * Everything the single reference page needs, in one file.
     *
     * This is large — all 151 rendered documentation bodies — and is read on
     * the server only. It must never be imported from an ordinary component,
     * or it lands in the client bundle AND again in the Nuxt payload. See
     * app/components/KeywordPanels.server.vue.
     */
    write(join(GEN, 'libdoc-full.json'), {
      version: result.version,
      libraryName: result.libraryName,
      intro: result.intro,
      introSections: result.introSections,
      keywords: result.keywords,
      types: result.types,
      groups: result.groups,
    })
  }
}

if (!latestResult) {
  throw new Error(`LATEST is "${latest}" but no Browser-${latest}.json was transformed`)
}

write(join(OUT, 'versions.json'), {
  latest,
  versions: specFiles
    .map(f => f.replace(/^Browser-|\.json$/g, ''))
    .sort()
    .reverse(),
})

// Imported at build time for route generation and the rail. Index and groups
// only — never the keyword bodies, which would defeat the split.
write(join(GEN, 'libdoc.json'), {
  version: latestResult.version,
  libraryName: latestResult.libraryName,
  index: latestResult.index,
  groups: latestResult.groups,
  introSections: latestResult.introSections,
  // Name/kind/usage-count only. Enough for the type index and for route
  // generation; the bodies stay in their own payloads.
  types: latestResult.types.map(t => ({
    name: t.name,
    slug: t.slug,
    anchor: t.anchor,
    kind: t.kind,
    usedByCount: t.usedBy.length,
  })),
})

console.log(`latest = ${latest}`)
