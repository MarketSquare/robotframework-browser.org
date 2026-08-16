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

/*
 * A stopgap, and worth knowing why before raising it again.
 *
 * THIS IS NOT THE SPEC NUMBER. Spec §12 budgets JS *per page* — under 100 KB
 * on the landing page, under 150 KB on a keyword page. What this measures is
 * the sum of every chunk in the build minus the SQLite engine, which is a
 * coarse proxy nobody specified, and it has now been raised three times as if
 * it were the real thing:
 *
 *   400 → 402   Ver.vue, the inline component that carries a version in prose
 *   402 → 405   the version picker's loading state (measured: 0.3 KB; the
 *               ceiling tripped on rounding, not on weight)
 *   405 → 409   DeviceTable, the filters on the device list (measured: 4 KB of
 *               control logic and no data — the 84 KB of descriptors are
 *               rendered by DeviceRows.server.vue and never leave the server.
 *               Per page, the number the spec actually budgets, the device
 *               list is 120 KB gzip against 150, the same as every other docs
 *               page. This raise is the proxy disagreeing with the spec, which
 *               is the defect described above, not new weight.)
 *
 * Measured per page, gzipped, on 2026-08-15:
 *
 *   landing        123 KB / 100 KB   over
 *   keyword page   104 KB / 150 KB   ok
 *   docs page      120 KB / 150 KB   ok
 *   device list    120 KB / 150 KB   ok
 *
 * So the landing page has been over its actual budget for some time and this
 * check cannot see it, while it blocks a 0.3 KB addition elsewhere. Replacing
 * it with a per-page measurement is TODO 1; until then, do not read a pass
 * here as "within budget".
 */
if (shipped > 409) {
  console.error(`FAIL reachable client JS is ${shipped} KB, over the 409 KB ceiling`)
  failed = true
}

process.exit(failed ? 1 : 0)
