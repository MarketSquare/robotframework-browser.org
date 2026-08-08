/**
 * Fails the build if server-only weight reached the client, or if a heavy
 * optional chunk became reachable from a page. Run after `pnpm generate`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '.output/public'
const DIR = join(OUT, '_nuxt')

const FORBIDDEN = [
  ['tmLanguage', 'TextMate grammar JSON'],
  ['createHighlighter', 'Shiki runtime'],
  ['source.robotframework', 'Robot Framework grammar scopes'],
]

let failed = false

/* ---------- 1. server-only weight must not be in any client chunk ---------- */
const chunks = readdirSync(DIR).filter(f => f.endsWith('.js'))
let total = 0

for (const name of chunks) {
  const path = join(DIR, name)
  total += statSync(path).size
  const src = readFileSync(path, 'utf8')
  for (const [needle, what] of FORBIDDEN) {
    if (src.includes(needle)) {
      console.error(`FAIL ${name} contains ${what} (matched "${needle}")`)
      failed = true
    }
  }
}

/* ---------- 2. the SQLite engine must stay unreachable ---------- */
/*
 * Nuxt Content ships a client-side SQLite WASM engine (~280 KB across
 * sqlite3-worker1 and an OPFS proxy) so `queryCollection` can run in the
 * browser. Every route here is prerendered and the payload carries the data,
 * so no page should ever reference it — verified in a browser: no page
 * requests these files. It sits on disk unused; what matters is that nothing
 * links to it. If a page ever does, that is ~280 KB of new download.
 */
function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === '_nuxt') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) htmlFiles(full, acc)
    else if (entry.endsWith('.html')) acc.push(full)
  }
  return acc
}

const heavy = chunks.filter(f => /sqlite|wasm/i.test(f))
const pages = htmlFiles(OUT)
const referencing = []

for (const page of pages) {
  const html = readFileSync(page, 'utf8')
  for (const chunk of heavy) {
    if (html.includes(chunk)) referencing.push(`${page.replace(OUT, '')} -> ${chunk}`)
  }
}

if (referencing.length) {
  console.error(`FAIL the SQLite engine became reachable from a page:`)
  for (const r of referencing.slice(0, 5)) console.error(`  ${r}`)
  failed = true
}

const heavyKb = Math.round(heavy.reduce((n, f) => n + statSync(join(DIR, f)).size, 0) / 1024)
const kb = Math.round(total / 1024)
const shipped = kb - heavyKb

console.log(
  `client JS: ${kb} KB across ${chunks.length} chunks ` +
    `(${shipped} KB reachable, ${heavyKb} KB unreferenced SQLite engine)`,
)
console.log(`checked ${pages.length} prerendered pages`)

/* Budget applies to what a visitor can actually download. Spec §12. */
if (shipped > 400) {
  console.error(`FAIL reachable client JS is ${shipped} KB, over the 400 KB ceiling`)
  failed = true
}

process.exit(failed ? 1 : 0)
