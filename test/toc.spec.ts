import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { type MarkNode, tocFromBody, tocPlainText } from '../app/utils/toc'

/**
 * The on-this-page rail was built from `body.toc`, which loses two things.
 *
 * It nests: Nuxt Content collects h2 and h3, then files each h3 under the h2
 * above it, so a flat `v-for` over `toc.links` renders only h2s — both pages
 * carried a `.d3` rule that never matched a single element.
 *
 * It flattens: `flattenNodeText` reduces a heading to a plain string, so
 * `## \`Wait For Condition\`` arrived as prose and lost the monospace that says
 * it is a keyword.
 *
 * Reading the headings out of the body keeps document order, real depth and
 * the inline markup. Nothing caught either bug, because a rail of plain h2s is
 * a plausible-looking rail.
 */
const ROOT = process.cwd()

const H2 = (id: string, ...kids: MarkNode[]): MarkNode => ['h2', { id }, ...kids]
const H3 = (id: string, ...kids: MarkNode[]): MarkNode => ['h3', { id }, ...kids]

describe('tocFromBody', () => {
  it('returns h2 and h3 together, in document order', () => {
    const body = [H2('a', 'A'), H3('a1', 'A1'), H3('a2', 'A2'), H2('b', 'B')]
    expect(tocFromBody(body).map(e => e.id)).toEqual(['a', 'a1', 'a2', 'b'])
  })

  it('records the depth the d2/d3 class is built from', () => {
    expect(tocFromBody([H2('a', 'A'), H3('b', 'B')]).map(e => e.depth)).toEqual([2, 3])
  })

  it('keeps the inline markup instead of flattening it', () => {
    const body = [H2('wait-for-condition', ['code', {}, 'Wait For Condition'])]
    const [entry] = tocFromBody(body)
    expect(entry!.nodes).toEqual([['code', {}, 'Wait For Condition']])
  })

  it('keeps markup mixed with text', () => {
    const body = [H3('mixed', ['code', {}, 'css='], ' — acceptable, not ', ['em', {}, 'preferable'])]
    expect(tocFromBody(body)[0]!.nodes).toHaveLength(3)
  })

  it('ignores h1, h4 and ordinary blocks', () => {
    const body: MarkNode[] = [
      ['h1', { id: 'title' }, 'Title'],
      ['p', {}, 'text'],
      H2('keep', 'Keep'),
      ['h4', { id: 'deep' }, 'Deep'],
    ]
    expect(tocFromBody(body).map(e => e.id)).toEqual(['keep'])
  })

  it('skips a heading with no id, which cannot be linked to', () => {
    expect(tocFromBody([['h2', {}, 'No anchor']])).toEqual([])
  })

  it('does not descend into components, whose headings are not the page outline', () => {
    const body: MarkNode[] = [['doc-note', {}, ['h2', { id: 'inner' }, 'Inner']], H2('outer', 'Outer')]
    expect(tocFromBody(body).map(e => e.id)).toEqual(['outer'])
  })

  it('handles a missing body', () => {
    expect(tocFromBody(undefined)).toEqual([])
  })
})

describe('tocPlainText', () => {
  it('joins nested markup into the string used for the title attribute', () => {
    expect(tocPlainText([['code', {}, 'css='], ' — acceptable'])).toBe('css= — acceptable')
  })

  it('handles plain text and empty input', () => {
    expect(tocPlainText(['Plain'])).toBe('Plain')
    expect(tocPlainText([])).toBe('')
  })
})

describe('the pages that render a table of contents', () => {
  const pages = ['app/pages/docs/[...slug].vue', 'app/pages/why/[tool].vue']

  it.each(pages)('%s builds from the body, not the nested toc', page => {
    const src = readFileSync(join(ROOT, page), 'utf8')
    expect(src, 'reads body.toc.links, which holds only h2s').not.toContain('body?.toc?.links')
    expect(src).toContain('tocFromBody(')
  })

  it.each(pages)('%s renders the markup rather than the flattened text', page => {
    const src = readFileSync(join(ROOT, page), 'utf8')
    expect(src).toContain('<TocText :nodes="link.nodes" />')
    expect(src, 'link.text no longer exists on an entry').not.toContain('{{ link.text }}')
  })

  it.each(pages)('%s styles the h3 depth it now renders', page => {
    expect(readFileSync(join(ROOT, page), 'utf8')).toMatch(/\.toc a\.d3\s*\{/)
  })
})

describe('TocText', () => {
  const src = readFileSync(join(ROOT, 'app/components/TocText.vue'), 'utf8')

  it('renders through h(), not v-html', () => {
    // The word appears in the file's own comment; it is the binding that matters.
    expect(src, 'raw content must not reach the DOM as HTML').not.toMatch(/v-html\s*=/)
    expect(src).toContain("h(el, render(children))")
  })

  it('allows the inline tags headings actually use', () => {
    for (const tag of ['code', 'strong', 'em']) expect(src).toContain(`  ${tag}:`)
  })
})

describe('the content has headings this matters for', () => {
  function markdown(dir: string): string[] {
    return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
      e.isDirectory()
        ? markdown(join(dir, e.name))
        : e.name.endsWith('.md')
          ? [join(ROOT, dir, e.name)]
          : [],
    )
  }

  const files = markdown('content/docs').concat(markdown('content/why'))

  it('has pages with subsections, so the h3 fix is visible', () => {
    expect(files.filter(f => /^### /m.test(readFileSync(f, 'utf8'))).length).toBeGreaterThan(3)
  })

  it('has headings carrying inline code, so the markup fix is visible', () => {
    const withCode = files.filter(f => /^#{2,3} .*`/m.test(readFileSync(f, 'utf8')))
    expect(withCode.length).toBeGreaterThan(2)
  })
})
