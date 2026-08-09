/**
 * Imports the library's release notes into content/releases/.
 *
 * Source is `docs/releasenotes/Browser-<version>.md` in the library repo,
 * generated there from the closed issues in a GitHub milestone. Only the
 * Markdown-era notes are taken; everything older is reStructuredText and is
 * linked to the GitHub archive instead.
 *
 * Two things happen on the way in:
 *
 * 1. **The boilerplate is dropped.** Every note opens with the same ~35 lines
 *    of installation instructions before any news. Repeated across a dozen
 *    releases it buries the part a reader came for, and the site documents
 *    installation properly elsewhere.
 *
 * 2. **The facts buried in that boilerplate are lifted out.** The release
 *    date, the Playwright version it was tested against and the supported
 *    Python/Node/RF versions are stated in prose in the middle of a
 *    paragraph; as frontmatter they can be shown as what they are.
 *
 * Usage: pnpm releases [path-to-library-checkout]
 * The output is committed, so a build never needs the library alongside.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Released, then withdrawn. They have notes but no installable artefact, so
 * linking a reader to them would be sending them after something that is not
 * there.
 */
const YANKED = new Set(['19.12.1', '19.12.2', '19.14.0', '19.14.1'])

const libraryRoot = process.argv[2] ?? resolve(process.cwd(), '../robotframework-browser')
const SRC = join(libraryRoot, 'docs/releasenotes')
const OUT = join(process.cwd(), 'content/releases')

/** `20.3.0` → `[20, 3, 0]`, for sorting newest first. */
const parts = (v: string) => v.split('.').map(Number)

function compare(a: string, b: string) {
  const [x, y] = [parts(a), parts(b)]
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0)
  return 0
}

/** YAML-safe: these strings come from prose and contain colons and quotes. */
const quote = (s: string) => `"${s.replace(/"/g, '\\"')}"`

interface Note {
  version: string
  date: string
  playwright: string
  supports: string
  body: string
  headline: string
}

function parse(version: string, src: string): Note {
  /*
   * The body is everything from the first `## ` heading. What comes before it
   * is the generated preamble, identical in every release apart from the
   * version number.
   */
  const firstHeading = src.search(/^## /m)
  const preamble = firstHeading === -1 ? src : src.slice(0, firstHeading)
  const body = firstHeading === -1 ? '' : src.slice(firstHeading)

  /* "…was released on Friday August 7, 2026." */
  const date = /was released on \w+ (\w+ \d+, \d{4})/.exec(preamble)?.[1] ?? ''

  /* "Library was tested with Playwright 1.62.1" */
  const playwright = /tested with Playwright (\d+\.\d+\.\d+)/.exec(preamble)?.[1] ?? ''

  /* "Browser supports Python 3.10+, Node 22/24 LTS and Node 26, and Robot Framework 6.1+." */
  /*
   * To the end of the sentence, not to the first full stop — the version
   * numbers in it are full of them. "Python 3.10+, Node 22/24 LTS…" cut at
   * the first `.` gives "Python 3".
   */
  const supports = (/Browser supports ([\s\S]+?)\.\s*\n/.exec(preamble)?.[1] ?? '')
    .replace(/\s+/g, ' ')
    .trim()

  /*
   * The first enhancement heading doubles as the headline for the index. It is
   * the closest thing the generated note has to "what this release is about".
   */
  const headline = (/^### (.+?)(?:\s*\(\[#\d+\].*)?$/m.exec(body)?.[1] ?? '').trim()

  return { version, date, playwright, supports, body: body.trimEnd(), headline }
}

const files = readdirSync(SRC).filter(f => /^Browser-[\d.]+\.md$/.test(f))

const notes = files
  .map(f => ({ file: f, version: f.replace(/^Browser-|\.md$/g, '') }))
  .filter(({ version }) => !YANKED.has(version))
  .map(({ file, version }) => parse(version, readFileSync(join(SRC, file), 'utf8')))
  .sort((a, b) => compare(a.version, b.version))

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const n of notes) {
  const frontmatter = [
    '---',
    `title: Browser ${n.version}`,
    `version: ${quote(n.version)}`,
    `date: ${quote(n.date)}`,
    `playwright: ${quote(n.playwright)}`,
    `supports: ${quote(n.supports)}`,
    `headline: ${quote(n.headline)}`,
    'source: Generated from the library repository by scripts/build-releases.ts',
    '---',
    '',
  ].join('\n')

  writeFileSync(join(OUT, `${n.version}.md`), `${frontmatter}${n.body}\n`)
}

console.log(`${notes.length} release notes → content/releases/`)
console.log(`  newest ${notes[0]?.version}, oldest ${notes.at(-1)?.version}`)
const thin = notes.filter(n => !n.date || !n.playwright)
if (thin.length) {
  console.log(`  missing date or Playwright version: ${thin.map(n => n.version).join(', ')}`)
}
