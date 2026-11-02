import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { demote, libdocToMarkdown } from '../lib/libdoc-markdown'
import type { LibdocSpec } from '../lib/libdoc'

const ROOT = process.cwd()
const OUT = join(ROOT, '.output/public')
const built = existsSync(join(OUT, 'llms.txt'))

describe('keyword reference as Markdown', () => {
  const latest = readFileSync(join(ROOT, 'content/libdoc/LATEST'), 'utf8').trim()
  const spec: LibdocSpec = JSON.parse(readFileSync(join(ROOT, `content/libdoc/Browser-${latest}.json`), 'utf8'))
  const md = libdocToMarkdown(spec, { sourceUrl: 'https://robotframework-browser.org/keywords' })

  it('has a section for every keyword and every type', () => {
    for (const k of spec.keywords) expect(md, k.name).toContain(`\n### ${k.name}\n`)
    for (const t of spec.typedocs) expect(md, t.name).toContain(`\n### ${t.name}\n`)
  })

  it('turns libdoc examples into Robot Framework code fences', () => {
    expect(md).toMatch(/```robotframework\nAdd Cookie {3}foo/)
  })

  it('leaves no HTML and no in-page anchors behind', () => {
    const prose = md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
    expect(prose).not.toMatch(/<(p|a|pre|table|code)[ >]/)
    expect(prose).not.toMatch(/\]\(#/)
    expect(prose).not.toContain('Comment >>')
  })

  it('marks named-only arguments, which a signature alone does not show', () => {
    expect(md).toMatch(/`text_type: TextType \| None = None` \(named-only\)/)
  })
})

describe('demote', () => {
  it('pushes headings below the given level and leaves code alone', () => {
    expect(demote('# A\n```\n# comment\n```\n#### B', 3)).toBe('#### A\n```\n# comment\n```\n#### B')
  })
})

describe.skipIf(!built)('prerendered LLM exports', () => {
  const read = (p: string) => readFileSync(join(OUT, p), 'utf8')
  const llms = built ? read('llms.txt') : ''
  const links = [...llms.matchAll(/\]\(https:\/\/robotframework-browser\.org(\/[^)]+)\)/g)].map(m => m[1]!)

  it('links only to files that were built', () => {
    expect(links.length).toBeGreaterThan(30)
    for (const link of links) expect(existsSync(join(OUT, link)), link).toBe(true)
  })

  it('lists every docs page', () => {
    const docs = readdirSync(join(ROOT, 'content/docs'), { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('.md'))
    for (const f of docs) expect(links, f).toContain(`/raw/docs/${f.replace(/\.md$/, '')}.md`)
  })

  it('leaves out the styleguide demos', () => {
    expect(existsSync(join(OUT, 'raw/gallery'))).toBe(false)
    expect(llms).not.toContain('/gallery/')
  })

  const files = built
    ? ['llms.txt', 'llms-full.txt', ...links.filter(l => l.startsWith('/raw/')).map(l => l.slice(1))]
    : []

  it.each(files)('%s resolves every version token and every component', (file) => {
    const md = read(file)
    expect(md).not.toMatch(/%%\w+%%/)
    expect(md).not.toContain('LLMRAWBLOCK')
    // Component tags, which the exports rewrite into Markdown.
    expect(md.replace(/```[\s\S]*?```/g, '')).not.toMatch(/<\/?[a-z]+-[a-z-]+[ >]/)
  })
})

describe.skipIf(!built)('Markdown alternates in the HTML', () => {
  /** Every prerendered page, as its path under .output/public. */
  const pages = built
    ? readdirSync(OUT, { recursive: true, encoding: 'utf8' })
      .filter(f => f.endsWith('index.html') && !f.startsWith('_') && !f.startsWith('styleguide'))
    : []

  it('points every page that has a Markdown twin at a file that exists', () => {
    let found = 0
    for (const page of pages) {
      const href = /<link rel="alternate" type="text\/markdown" href="([^"]+)"/.exec(readFileSync(join(OUT, page), 'utf8'))?.[1]
      if (!href) continue
      found++
      expect(existsSync(join(OUT, href)), `${page} → ${href}`).toBe(true)
    }
    expect(found).toBeGreaterThan(40)
  })

  it('tells crawlers on the landing page where llms.txt is', () => {
    expect(readFileSync(join(OUT, 'index.html'), 'utf8')).toContain('href="https://robotframework-browser.org/llms.txt"')
  })
})
