/**
 * What changed in the keyword API between two documented versions, as Markdown.
 *
 *   node scripts/keyword-diff.ts 20.2.0 20.3.0
 *
 * The release workflow puts this in the pull request body. A release note says
 * what the authors thought was worth mentioning; this says what the API
 * actually did, which is the thing a reviewer of a generated PR has no other
 * way to see. An argument that quietly gained a default, or a type that stopped
 * being documented, shows up here and nowhere else.
 *
 * Reads the committed Libdoc JSON, so it needs neither the library nor a
 * network.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

interface Arg { name: string, repr: string }
interface Keyword {
  name: string
  args: Arg[]
  returnType: { name: string } | null
  shortdoc: string
  tags: string[]
}
interface Spec {
  version: string
  keywords: Keyword[]
  typedocs: { name: string }[]
}

function load(version: string): Spec {
  const path = join(ROOT, 'content/libdoc', `Browser-${version}.json`)
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Spec
  }
  catch {
    throw new Error(`no libdoc for ${version} (expected ${path})`)
  }
}

/** The signature as a reader would write it: `Click    selector, button=left`. */
const signature = (kw: Keyword) => kw.args.map(a => a.repr).join(', ')

export function diff(before: Spec, after: Spec): string {
  const old = new Map(before.keywords.map(k => [k.name, k]))
  const now = new Map(after.keywords.map(k => [k.name, k]))

  const added = [...now.values()].filter(k => !old.has(k.name))
  const removed = [...old.values()].filter(k => !now.has(k.name))

  const changed = [...now.values()]
    .map(kw => ({ kw, was: old.get(kw.name)! }))
    .filter(({ kw, was }) => was && signature(kw) !== signature(was))

  const retyped = [...now.values()]
    .map(kw => ({ kw, was: old.get(kw.name)! }))
    .filter(({ kw, was }) => was && (was.returnType?.name ?? null) !== (kw.returnType?.name ?? null))

  const oldTypes = new Set(before.typedocs.map(t => t.name))
  const newTypes = new Set(after.typedocs.map(t => t.name))
  const typesAdded = [...newTypes].filter(t => !oldTypes.has(t))
  const typesGone = [...oldTypes].filter(t => !newTypes.has(t))

  const out: string[] = []
  const heading = (text: string) => out.push('', `#### ${text}`, '')

  const delta = [
    added.length > 0 ? `+${added.length}` : '',
    removed.length > 0 ? `−${removed.length}` : '',
  ].filter(Boolean).join(', ') || 'unchanged'

  out.push(
    `**${before.version} → ${after.version}**`,
    '',
    `${after.keywords.length} keywords (${delta}), ${after.typedocs.length} documented types.`,
  )

  if (added.length > 0) {
    heading(`New keywords (${added.length})`)
    for (const kw of added) out.push(`- **${kw.name}** — ${kw.shortdoc}`)
  }

  if (removed.length > 0) {
    // Loud, because it breaks somebody's suite.
    heading(`⚠️ Removed keywords (${removed.length})`)
    for (const kw of removed) out.push(`- **${kw.name}**`)
  }

  if (changed.length > 0) {
    heading(`Changed signatures (${changed.length})`)
    for (const { kw, was } of changed) {
      const before_ = new Set(was.args.map(a => a.name))
      const after_ = new Set(kw.args.map(a => a.name))
      const gained = kw.args.filter(a => !before_.has(a.name)).map(a => a.repr)
      const lost = was.args.filter(a => !after_.has(a.name)).map(a => a.name)
      // An argument kept its name but changed its type or its default.
      const altered = kw.args
        .filter(a => before_.has(a.name))
        .filter(a => was.args.find(b => b.name === a.name)!.repr !== a.repr)
        .map(a => `${was.args.find(b => b.name === a.name)!.repr} → ${a.repr}`)

      out.push(`- **${kw.name}**`)
      if (gained.length > 0) out.push(`  - added: \`${gained.join('`, `')}\``)
      if (lost.length > 0) out.push(`  - **removed: \`${lost.join('`, `')}\`**`)
      if (altered.length > 0) out.push(`  - changed: \`${altered.join('`, `')}\``)
    }
  }

  if (retyped.length > 0) {
    heading(`Changed return types (${retyped.length})`)
    for (const { kw, was } of retyped) {
      out.push(`- **${kw.name}**: \`${was.returnType?.name ?? 'None'}\` → \`${kw.returnType?.name ?? 'None'}\``)
    }
  }

  if (typesAdded.length > 0 || typesGone.length > 0) {
    heading('Documented types')
    if (typesAdded.length > 0) out.push(`- added: \`${typesAdded.join('`, `')}\``)
    if (typesGone.length > 0) out.push(`- removed: \`${typesGone.join('`, `')}\``)
  }

  if (added.length + removed.length + changed.length + retyped.length === 0) {
    out.push('', 'No keyword signatures changed.')
  }

  return out.join('\n')
}

// Only when run directly, so the tests can import diff().
if (process.argv[1]?.endsWith('keyword-diff.ts')) {
  const [before, after] = process.argv.slice(2)
  if (!before || !after) {
    console.error('usage: node scripts/keyword-diff.ts <old-version> <new-version>')
    process.exit(64)
  }
  console.log(diff(load(before), load(after)))
}
