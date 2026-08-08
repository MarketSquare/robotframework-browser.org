/**
 * Fails the build if server-only weight reached the client bundle.
 * Run after `pnpm generate`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIR = '.output/public/_nuxt'
const FORBIDDEN = [
  ['tmLanguage', 'TextMate grammar JSON'],
  ['createHighlighter', 'Shiki runtime'],
  ['source.robotframework', 'Robot Framework grammar scopes'],
]

let failed = false
let total = 0

for (const name of readdirSync(DIR)) {
  const path = join(DIR, name)
  if (!statSync(path).isFile() || !name.endsWith('.js')) continue
  total += statSync(path).size
  const src = readFileSync(path, 'utf8')
  for (const [needle, what] of FORBIDDEN) {
    if (src.includes(needle)) {
      console.error(`FAIL ${name} contains ${what} (matched "${needle}")`)
      failed = true
    }
  }
}

const kb = Math.round(total / 1024)
console.log(`client JS: ${kb} KB across ${readdirSync(DIR).filter(f => f.endsWith('.js')).length} chunks`)

// Spec §12 budget: under 100 KB on the landing page. This is the whole
// bundle across all routes, so a generous ceiling that still catches a
// megabyte-scale regression.
if (kb > 600) {
  console.error(`FAIL client JS is ${kb} KB, over the 600 KB ceiling`)
  failed = true
}

process.exit(failed ? 1 : 0)
