import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * A labelled code fence must be the code it claims to be.
 *
 * ```` ```python [MyLibraryA.py] ```` is a provenance claim: this came from that
 * file. The site cannot run Python, so nothing else holds a pasted example to
 * its source — and the whole point of the two extension pages is that a reader
 * can trust the code on them without going and reading the library.
 *
 * `examples/README.md` states the rule this enforces for the comparison pages:
 * "Nothing here is ever pasted anywhere". Prose fences cannot read from disk
 * the way `<Comparison>` does, so they get the check instead of the mechanism.
 *
 * An excerpt is fine — most of these blocks are one method out of a class. What
 * is not fine is an excerpt that no longer matches, or a filename nothing backs.
 */
const ROOT = process.cwd()
const EXAMPLES = join(ROOT, 'examples')

/** Every file under examples/, keyed by basename. */
function sources(dir = EXAMPLES, found: Record<string, string> = {}): Record<string, string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) sources(path, found)
    else if (!entry.name.endsWith('.md')) found[entry.name] = readFileSync(path, 'utf8')
  }
  return found
}

const available = sources()

function contentFiles(dir = join(ROOT, 'content'), found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) contentFiles(path, found)
    else if (entry.name.endsWith('.md')) found.push(path)
  }
  return found
}

/**
 * A fence label is a provenance claim only when it names a file we vendor.
 *
 * Pages legitimately label a fence with something that is not a real file —
 * `[login.robot]` on an invented suite, `[DOM]`, `[Bad Example]`. Those are
 * captions. Matching on the vendored basenames is what tells the two apart, and
 * it means adding a file to examples/ retroactively starts checking every page
 * that quotes it.
 */
interface Quote { file: string, source: string, body: string, line: number }

const quotes: Quote[] = contentFiles().flatMap(file => {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/```[\w-]+ \[([^\]]+)\]\n([\s\S]*?)\n```/g)]
    .filter(m => m[1]! in available)
    .map(m => ({
      file: file.slice(ROOT.length + 1),
      source: m[1]!,
      body: m[2]!,
      line: text.slice(0, m.index).split('\n').length,
    }))
})

describe('quoted example code', () => {
  it('finds quotes to check', () => {
    // Vacuity guard: a regex that stopped matching would leave this green.
    expect(quotes.length).toBeGreaterThan(0)
  })

  it.each(quotes.map(q => [`${q.file}:${q.line} quotes ${q.source}`, q]))(
    '%s verbatim',
    (_name, quote) => {
      const source = available[quote.source]!
      expect(
        source.includes(quote.body),
        `${quote.file}:${quote.line} no longer matches examples/…/${quote.source}. `
        + 'The file is right and the page is stale: re-copy the block, do not edit the file.',
      ).toBe(true)
    },
  )
})

describe('the vendored sources', () => {
  it('carry a README saying where they came from', () => {
    /*
     * Without it the next person finds Python in a repository whose
     * CONTRIBUTING says you need no Python, and cannot tell a vendored copy
     * from something this site owns and may edit.
     */
    const readme = join(EXAMPLES, 'python-extension/README.md')
    expect(existsSync(readme), 'examples/python-extension/README.md').toBe(true)
    expect(readFileSync(readme, 'utf8')).toContain('atest/test/13_Python_Extension/')
  })

  it('keeps the evidence for the claims beside them', () => {
    /*
     * The code is only half of it. Which behaviour is measured by a named test
     * and which is read from source and never executed is what stops the prose
     * from quietly overstating, and that record has to be here too or checking
     * a claim means cloning the library.
     */
    const facts = join(ROOT, 'docs/research/python-extension-contexts.md')
    expect(existsSync(facts), 'docs/research/python-extension-contexts.md').toBe(true)
    const text = readFileSync(facts, 'utf8')
    expect(text, 'the measured/read markers are the point of the document').toContain('[M] measured')
    expect(text).toContain('[R] read')
  })
})
