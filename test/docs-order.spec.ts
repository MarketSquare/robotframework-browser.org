import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The docs reading order has to be a total order.
 *
 * `order` drives two things in app/pages/docs/[...slug].vue: the sidebar sort
 * and the previous/next links. Two pages sharing a number is not a cosmetic
 * problem — the sort is not stable across them, so the sidebar and the "next"
 * link can disagree about which page follows which, and the order can change
 * between builds without anybody touching the content.
 *
 * That is exactly what happened: `browser-context-page` and `selectors` were
 * both `order: 2`, and the concepts chapter ran 1, 2, 2, 3, 5.
 */
const ROOT = process.cwd()
const DOCS = join(ROOT, 'content/docs')

interface Page { file: string, section: string, order: number, title: string }

function frontmatter(file: string): Page {
  const text = readFileSync(file, 'utf8')
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? ''
  const field = (name: string) => new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(block)?.[1]?.trim()
  return {
    file: file.replace(`${DOCS}/`, ''),
    section: field('section') ?? '',
    order: Number(field('order')),
    title: field('title') ?? '',
  }
}

const pages = readdirSync(DOCS, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .flatMap(dir =>
    readdirSync(join(DOCS, dir.name))
      .filter(f => f.endsWith('.md'))
      .map(f => frontmatter(join(DOCS, dir.name, f))),
  )

/** The sections, in the order app/pages/docs/[...slug].vue declares them. */
const SECTIONS = ['start', 'concepts', 'mobile', 'extending', 'operations']

describe('every docs page is placed', () => {
  it('found the pages', () => expect(pages.length).toBeGreaterThan(10))

  it.each(pages)('$file declares a title, a section and an order', page => {
    expect(page.title, 'title').not.toBe('')
    expect(page.section, 'section').not.toBe('')
    expect(Number.isInteger(page.order), `order is "${page.order}"`).toBe(true)
  })

  it('uses only sections the docs page knows how to render', () => {
    // A page in an unlisted section is silently dropped from the sidebar.
    for (const page of pages) {
      expect(SECTIONS, `${page.file} is in section "${page.section}"`).toContain(page.section)
    }
  })
})

describe.each(SECTIONS)('the %s chapter', section => {
  const chapter = pages.filter(p => p.section === section).sort((a, b) => a.order - b.order)

  it('has pages', () => expect(chapter.length).toBeGreaterThan(0))

  it('numbers them uniquely', () => {
    const orders = chapter.map(p => p.order)
    const duplicates = orders.filter((o, i) => orders.indexOf(o) !== i)
    expect(duplicates, `duplicate order ${duplicates.join(', ')} in ${section}`).toEqual([])
  })

  it('numbers them 1..n with no gaps', () => {
    /*
     * A gap is not broken on its own, but it is always a symptom: a page was
     * removed or renumbered and its neighbours were not, which is how the
     * duplicate above arrived.
     */
    expect(chapter.map(p => p.order)).toEqual(chapter.map((_, i) => i + 1))
  })
})
