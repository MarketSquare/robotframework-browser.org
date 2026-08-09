import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The doc-table YAML trap.
 *
 * Table cells are authored as YAML, and an unquoted scalar containing ": " is a
 * *mapping* to a YAML parser, not a string. A cell reading
 *
 *     - Detected by `@media (pointer: coarse)`
 *
 * therefore reaches the component as an object, and the page fails to render
 * with "src.replace is not a function" — naming neither the file nor the cell.
 * It cost a build. These tests catch it in the file where it is written.
 */

const ROOT = process.cwd()

function contentFiles(dir = join(ROOT, 'content')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? contentFiles(join(dir, e.name))
      : e.name.endsWith('.md')
        ? [join(dir, e.name)]
        : [],
  )
}

/** The body of every ::doc-table block, as raw YAML lines. */
function tableBlocks(src: string): string[][] {
  const out: string[][] = []
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!/^::doc-table\s*$/.test(lines[i]!)) continue
    // The block is delimited by --- ... --- immediately after the opener.
    const start = i + 2
    let end = start
    while (end < lines.length && lines[end] !== '---') end++
    out.push(lines.slice(start, end))
    i = end
  }
  return out
}

const files = contentFiles()

describe('doc-table cells are strings', () => {
  it('finds tables to check', () => {
    const total = files.reduce((n, f) => n + tableBlocks(readFileSync(f, 'utf8')).length, 0)
    expect(total).toBeGreaterThan(5)
  })

  it.each(files.map(f => [f.slice(ROOT.length + 1), f]))('%s quotes any cell containing ": "', (_name, file) => {
    for (const block of tableBlocks(readFileSync(file, 'utf8'))) {
      for (const line of block) {
        // A cell line starts with "- " (possibly nested) after indentation.
        const cell = /^\s*(?:-\s+)+(.*)$/.exec(line)?.[1]
        if (cell === undefined || cell === '') continue
        /*
         * Safe already: a quoted scalar, or a flow sequence/mapping such as
         * `['a', 'b: c']` whose inner strings carry their own quotes.
         */
        if (/^["'[{]/.test(cell)) continue
        expect(
          cell,
          `unquoted cell contains ": ", which YAML reads as a mapping — wrap it in double quotes`,
        ).not.toMatch(/\S:\s/)
      }
    }
  })
})

describe('DocTable reports a bad cell usefully', () => {
  const src = readFileSync(join(ROOT, 'app/components/content/DocTable.vue'), 'utf8')

  it('checks the cell type rather than letting v-html throw', () => {
    expect(src).toContain('cellText(')
    expect(src).toMatch(/typeof cell === 'string'/)
  })

  it('the message tells the author what to do', () => {
    expect(src).toContain('wrap the cell in double quotes')
  })
})
