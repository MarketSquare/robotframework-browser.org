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
 * Runs of spaces inside inline code, the Robot Framework argument separator,
 * used to be collapsed to one. nuxt-studio 1.8.0 keeps them, so inline code
 * may hold a full keyword call again.
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

const files = markdown()

it('has content to check', () => {
  expect(files.length).toBeGreaterThan(10)
})

describe('no editor placeholder reaches the content', () => {
  /*
   * When Studio's editor meets a node its schema does not know, it renders a
   * placeholder -- and if the file is then saved, it writes that placeholder
   * into the Markdown as literal text.
   *
   * It happened to selectors.md: six `--- Unknown node: hardBreak ---` markers
   * replaced the author's line breaks, were committed, and shipped to the
   * built page. Nothing caught it, because the file stayed valid Markdown and
   * the marker is only visible if you read the sentence.
   */
  it.each(files.map(f => [f.slice(ROOT.length + 1), f]))('%s has no editor placeholder', (_name, file) => {
    const source = readFileSync(file, 'utf8')
    const hit = /-{2,}\s*Unknown node:\s*(\w+)\s*-{2,}/.exec(source)
    expect(
      hit?.[0],
      `${_name} contains a Studio editor placeholder for a "${hit?.[1]}" node. `
      + 'It was written into the file on save; replace it with whatever the author meant.',
    ).toBeUndefined()
  })
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
