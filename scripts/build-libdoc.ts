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

  for (const w of result.warnings) console.warn(`  warn: ${w}`)
  console.log(
    `${file} -> ${result.version}: ${result.keywords.length} keywords, ` +
      `${result.types.length} types, ${result.groups.length} groups`,
  )

  if (result.version === latest) latestResult = result
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
})

console.log(`latest = ${latest}`)
