import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { demote, libdocToMarkdown } from '../lib/libdoc-markdown'
import { absoluteMarkdownLinks, absoluteUrl } from '../server/utils/llms-links'
import type { LibdocSpec } from '../lib/libdoc'

const ROOT = process.cwd()
const OUT = join(ROOT, '.output/public')
/*
 * Built means the site was generated, not that llms.txt exists: a build that
 * lost llms.txt must fail these tests, not skip them.
 */
const built = existsSync(join(OUT, 'index.html'))

/** What a reader sees as text: code fences and code spans removed. */
const prose = (md: string) => md.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')

/**
 * A link a file read on its own cannot follow: a Markdown link, reference
 * definition or HTML attribute whose target has no scheme. `//host` counts as
 * absolute.
 */
const RELATIVE_LINK = /\]\((?![a-z][a-z0-9+.-]*:|\/\/)|^\[[^\]]+\]:\s*(?![a-z][a-z0-9+.-]*:|\/\/)|\b(?:href|src)="(?![a-z][a-z0-9+.-]*:|\/\/)/im

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
    expect(prose(md)).not.toMatch(/<(p|a|pre|table|code)[ >]/)
    expect(prose(md)).not.toMatch(/\]\(#/)
    expect(prose(md)).not.toContain('Comment >>')
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

describe('absolute links', () => {
  const page = 'https://robotframework-browser.org/docs/start/installation'

  it.each([
    ['/docs/x', 'https://robotframework-browser.org/docs/x'],
    ['#start', `${page}#start`],
    ['../concepts/selectors', 'https://robotframework-browser.org/docs/concepts/selectors'],
    ['getting-started', 'https://robotframework-browser.org/docs/start/getting-started'],
    ['?q=1', `${page}?q=1`],
    ['https://playwright.dev/', 'https://playwright.dev/'],
    ['mailto:a@b.c', 'mailto:a@b.c'],
    ['//cdn.example/x', '//cdn.example/x'],
  ])('%s → %s', (href, expected) => {
    expect(absoluteUrl(href, page)).toBe(expected)
  })

  it('rewrites Markdown links, keeping titles and leaving code alone', () => {
    const md = '| [a](/x "T") | `[b](/y)` |\n\n```\n[c](/z)\n```'
    expect(absoluteMarkdownLinks(md, page)).toBe(
      '| [a](https://robotframework-browser.org/x "T") | `[b](/y)` |\n\n```\n[c](/z)\n```',
    )
  })

  it('the export check catches every relative form', () => {
    for (const bad of ['[a](/x)', '[a](#x)', '[a](../x)', '[a]: /x', '<a href="/x">', '<img src="x.png">']) {
      expect(bad, bad).toMatch(RELATIVE_LINK)
    }
    for (const ok of ['[a](https://x.org/)', '[a](mailto:a@b.c)', '<a href="https://x.org">']) {
      expect(ok, ok).not.toMatch(RELATIVE_LINK)
    }
  })
})

describe.skipIf(!built)('prerendered LLM exports', () => {
  const read = (p: string) => readFileSync(join(OUT, p), 'utf8')
  /*
   * Read here only if it is there, so a build that lost llms.txt fails the
   * test below with a clear message rather than the whole file at collection.
   */
  const llms = built && existsSync(join(OUT, 'llms.txt')) ? read('llms.txt') : ''

  it('built llms.txt, llms-full.txt and keywords.md', () => {
    for (const f of ['llms.txt', 'llms-full.txt', 'keywords.md']) expect(existsSync(join(OUT, f)), f).toBe(true)
  })
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
    expect(prose(md)).not.toMatch(/<\/?[a-z]+-[a-z-]+[ >]/)
  })

  // Read on its own, a file has no base URL to resolve a relative link against.
  it.each([...files, 'keywords.md'])('%s links only absolutely', (file) => {
    expect(prose(read(file))).not.toMatch(RELATIVE_LINK)
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
