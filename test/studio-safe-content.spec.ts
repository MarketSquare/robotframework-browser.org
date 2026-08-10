import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Content has to survive a Nuxt Studio round-trip.
 *
 * Opening a page in Studio rewrites the file — no edit and no save required,
 * one click on "Edit this page" issues a PUT. Most of what it changes is
 * cosmetic: it reindents nested blocks, reorders frontmatter keys, and rewraps
 * YAML scalars. Those are all reversible and mean the same thing.
 *
 * One rewrite is not cosmetic. Studio collapses a run of spaces inside an
 * inline code span:
 *
 *     `New Browser    chromium    headless=False`
 *     `New Browser chromium headless=False`
 *
 * Robot Framework separates arguments with **two or more** spaces, so the
 * second line is not the same command — it is a keyword call with one long
 * argument, and it does not run. A reader copying it gets an error that has
 * nothing to do with what the page is teaching.
 *
 * This is source normalisation, not rendering, so no component can defend
 * against it. The rule is therefore about how content is written: keep runs of
 * spaces out of inline code, and put the full call in a fenced block instead —
 * fenced content round-trips through Studio untouched, which is how the
 * `docker pull` examples survive with their tokens intact.
 *
 * Twelve spans were fixed when this test was added, across seven files.
 */
const ROOT = process.cwd()

function markdown(dir = join(ROOT, 'content')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? markdown(join(dir, e.name))
      : e.name.endsWith('.md')
        ? [join(dir, e.name)]
        : [],
  )
}

/**
 * Inline code spans on a line, skipping fenced blocks.
 *
 * Fences are exempt on purpose: their content is preserved verbatim, and a
 * Robot Framework snippet in a fence is exactly where the four-space separator
 * belongs.
 */
function inlineCode(source: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = []
  let fenced = false
  source.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      return
    }
    if (fenced) return
    for (const m of line.matchAll(/`([^`]+)`/g)) out.push({ line: i + 1, text: m[1]! })
  })
  return out
}

const files = markdown()

describe('content survives a Studio round-trip', () => {
  it('has content to check', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files.map(f => [f.slice(ROOT.length + 1), f]))(
    '%s keeps multi-space runs out of inline code',
    (_name, file) => {
      for (const { line, text } of inlineCode(readFileSync(file, 'utf8'))) {
        expect(
          text,
          `line ${line}: \`${text}\` relies on a run of spaces inside inline code. `
          + 'Nuxt Studio collapses those to one when it rewrites the file, which breaks a '
          + 'Robot Framework argument separator. Write it as "`Keyword` with `arg`", or put '
          + 'the whole call in a fenced block.',
        ).not.toMatch(/\S {2,}\S/)
      }
    },
  )
})

describe('the token mechanism stays render-time', () => {
  /*
   * The other half of Studio safety, and the reason the tokens survive at all:
   * whatever object is handed to <ContentRenderer> is what Studio serialises
   * back into the Markdown file. Passing a resolved copy rewrote every
   * `%%browser%%` to a frozen version number the moment a page was opened.
   */
  const renderers = [
    'app/pages/index.vue',
    'app/pages/community.vue',
    'app/pages/why/[tool].vue',
    'app/pages/docs/[...slug].vue',
    'app/pages/releases/[version].vue',
    'app/components/GalleryItem.vue',
  ]

  it.each(renderers)('%s hands ContentRenderer the unmodified document', page => {
    const src = readFileSync(join(ROOT, page), 'utf8')
    const tag = /<ContentRenderer[^>]*:value="([^"]+)"/.exec(src)
    expect(tag, `${page}: no <ContentRenderer> found`).not.toBeNull()
    expect(
      tag![1],
      `${page}: passes a transformed document to <ContentRenderer>. Studio writes that `
      + 'object back to disk, so version tokens would be resolved into the source file.',
    ).toBe('doc')
  })

  it('resolves in the components that own the text', () => {
    for (const c of ['TerminalBlock', 'DocTable', 'Stat', 'ProsePre', 'Ver']) {
      expect(
        readFileSync(join(ROOT, `app/components/content/${c}.vue`), 'utf8'),
        `${c}.vue should resolve version tokens itself`,
      ).toMatch(/resolveToken/)
    }
  })
})
