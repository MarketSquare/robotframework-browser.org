import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Every MDC block in content/ names a component that exists.
 *
 * An unknown component is the worst kind of content bug, because nothing
 * fails: Markdown renders, the build is green, the tests pass, and the block
 * silently disappears from the page. I shipped two in one sitting —
 * `::callout{type="warning"}` (the component is `DocNote`, and it takes `kind`,
 * not `type`) — while fixing other people's documentation errors.
 *
 * The authoring surface is app/components/content/, which Nuxt Content
 * registers globally: `::doc-note` resolves to DocNote.vue, `::card-grid` to
 * CardGrid.vue.
 */
const ROOT = process.cwd()
const CONTENT_COMPONENTS = join(ROOT, 'app/components/content')

/** `doc-note` -> `docnote`, so it can be matched against a filename. */
const flatten = (name: string) => name.replaceAll('-', '').toLowerCase()

const available = new Set(
  readdirSync(CONTENT_COMPONENTS)
    .filter(f => f.endsWith('.vue'))
    .map(f => flatten(f.replace('.vue', ''))),
)

function markdownFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) markdownFiles(path, found)
    else if (entry.name.endsWith('.md')) found.push(path)
  }
  return found
}

/** Every `::name` / `:::name` block opener, with the file it came from. */
const used = markdownFiles(join(ROOT, 'content')).flatMap(file =>
  [...readFileSync(file, 'utf8').matchAll(/^:{2,}([a-z][a-z0-9-]*)/gm)]
    .map(m => ({ file: file.replace(`${ROOT}/`, ''), name: m[1]! })),
)

describe('MDC components in content', () => {
  it('found blocks to check', () => {
    expect(used.length).toBeGreaterThan(20)
  })

  it('every block names a component that exists', () => {
    const unknown = used.filter(u => !available.has(flatten(u.name)))
    const report = unknown.map(u => `::${u.name} in ${u.file}`)
    expect(report, 'unknown MDC components render as nothing').toEqual([])
  })

  it('uses the documented prop name on doc-note', () => {
    /*
     * DocNote takes `kind`, and only note / warning / aside. `type=` and an
     * invented kind both fail the same silent way as an unknown component:
     * the prop is ignored and the reader gets the default styling, so a
     * warning renders as an ordinary note.
     */
    const kinds = new Set(['note', 'warning', 'aside'])
    for (const file of markdownFiles(join(ROOT, 'content'))) {
      const text = readFileSync(file, 'utf8')
      const where = file.replace(`${ROOT}/`, '')
      expect([...text.matchAll(/:{2,}doc-note\{type=/g)].length, `${where} uses type= not kind=`).toBe(0)
      for (const [, kind] of text.matchAll(/:{2,}doc-note\{kind="([^"]+)"/g)) {
        expect(kinds, `${where} has kind="${kind}"`).toContain(kind)
      }
    }
  })
})
