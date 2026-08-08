/**
 * Recolours the Browser library mark to the new brand red. Spec §5.1.
 *
 * Source: ../robotframework-browser/browser_lib_logo.svg
 * Output: public/logo/browser.svg
 *
 * The source carries Inkscape editing metadata and an unused `.cls-2` rule
 * that names OCR-A as a live font — a promise the file cannot keep on a
 * machine without the font installed. Both are stripped.
 *
 * ONE file, not a light/dark pair.
 *
 * The spec originally called for a light-ground variant with the white ink
 * darkened, on the assumption that white ink is invisible on paper. Rendering
 * it proved otherwise: that white is a *keyline* whose job is to separate the
 * two overlapping cards from each other and from whatever is behind them, and
 * it works by contrasting with the black outline just inside it. Darkening it
 * on paper merges the keyline into that outline and the two cards collapse
 * into a single blob. A near-white keyline reads correctly on both grounds —
 * as a sticker edge on paper, as a halo on the plate — so it stays as drawn.
 *
 * Run: node scripts/build-logo.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SOURCE = resolve(process.cwd(), '../robotframework-browser/browser_lib_logo.svg')
const OUT = resolve(process.cwd(), 'public/logo')

/** Brand red, retuned for a light ground. Spec D12. */
const RED = {
  '#e2574c': '#d63a2e', // face
  '#d65348': '#b82e24', // shadow tone
}

function clean(svg) {
  return svg
    .replace(/<sodipodi:namedview[\s\S]*?\/>/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
    .replace(/\s+(?:sodipodi|inkscape):[\w-]+="[^"]*"/g, '')
    .replace(/\s+xmlns:(?:sodipodi|inkscape|rdf|cc|dc)="[^"]*"/g, '')
    .replace(/\.cls-2\s*\{[^}]*\}/g, '')
    .replace(/<rect\s+x="4[45]\d\.\d+"[\s\S]*?id="rect5\d+"\s*\/>/g, '')
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/\n{3,}/g, '\n')
}

let svg = clean(readFileSync(SOURCE, 'utf8'))
for (const [from, to] of Object.entries(RED)) svg = svg.replaceAll(from, to)

mkdirSync(OUT, { recursive: true })
const file = resolve(OUT, 'browser.svg')
writeFileSync(file, svg)
console.log(`wrote ${file}`)
