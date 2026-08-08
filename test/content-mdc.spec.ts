import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Guards for the content-driven pages.
 *
 * The landing page is Markdown now, not hand-built markup, so a class of
 * mistake moved from "the build fails" to "the page renders wrong and nobody
 * notices". The first block below is the one that actually bit: MDC nests by
 * *colon count*, not by indentation, so an inner block written with the same
 * number of colons as its parent closes the parent early — and the remaining
 * `::` lines leak onto the page as literal text.
 */

const ROOT = process.cwd()

/** Every Markdown file under content/, recursively. */
function contentFiles(dir = join(ROOT, 'content')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory()
      ? contentFiles(join(dir, e.name))
      : e.name.endsWith('.md')
        ? [join(dir, e.name)]
        : [],
  )
}

/**
 * Lines outside fenced code. A fence can contain anything — `::` in a shell
 * snippet is not a component — so it has to be skipped before parsing.
 */
function proseLines(src: string): { text: string; n: number }[] {
  const out: { text: string; n: number }[] = []
  let fenced = false
  src.split('\n').forEach((text, i) => {
    if (/^\s*```/.test(text)) {
      fenced = !fenced
      return
    }
    if (!fenced) out.push({ text, n: i + 1 })
  })
  return out
}

const files = contentFiles()

describe('MDC block nesting', () => {
  it('has content to check', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files.map(f => [f.slice(ROOT.length + 1), f]))('%s balances its blocks', (_name, file) => {
    const stack: { colons: number; name: string; n: number }[] = []

    for (const { text, n } of proseLines(readFileSync(file, 'utf8'))) {
      // An opener is two-or-more colons followed by a component name.
      const open = /^(:{2,})([a-z][\w-]*)/.exec(text)
      if (open) {
        const colons = open[1]!.length
        const parent = stack.at(-1)
        /*
         * The failure the user saw: an inner block opened with as many colons
         * as its parent ends the parent instead of nesting inside it.
         */
        if (parent) {
          expect(
            colons,
            `line ${n}: ::${open[2]} opens with ${colons} colons inside ::${parent.name}, `
            + `which also uses ${parent.colons}. The outer block needs more colons than the inner one.`,
          ).toBeLessThan(parent.colons)
        }
        stack.push({ colons, name: open[2]!, n })
        continue
      }

      const close = /^(:{2,})\s*$/.exec(text)
      if (close) {
        const colons = close[1]!.length
        const top = stack.at(-1)
        expect(top, `line ${n}: ${close[1]} closes a block that was never opened`).toBeDefined()
        expect(
          colons,
          `line ${n}: ${close[1]} does not match ::${top!.name} opened with ${top!.colons} colons on line ${top!.n}`,
        ).toBe(top!.colons)
        stack.pop()
      }
    }

    expect(
      stack.map(s => `::${s.name} (line ${s.n})`),
      'unclosed blocks',
    ).toEqual([])
  })
})

describe('the landing page is content, not markup', () => {
  const page = readFileSync(join(ROOT, 'app/pages/index.vue'), 'utf8')
  const md = readFileSync(join(ROOT, 'content/index.md'), 'utf8')

  it('renders content/index.md rather than hand-built sections', () => {
    expect(page).toContain('ContentRenderer')
    // The copy lives in one place; a second copy in the page would drift.
    expect(page).not.toContain("doesn't flake")
  })

  it('uses the reusable components rather than bespoke ones', () => {
    for (const c of ['page-hero', 'page-section', 'card-grid', 'card', 'feature-grid']) {
      expect(md, `content/index.md should use ::${c}`).toMatch(new RegExp(`^:{2,}${c}\\b`, 'm'))
    }
  })
})

describe('the gallery documents itself', () => {
  const dir = join(ROOT, 'content/gallery')
  const demos = readdirSync(dir).filter(f => f.endsWith('.md'))

  it('has a demo for each component family', () => {
    expect(demos.length).toBeGreaterThanOrEqual(6)
  })

  it.each(demos)('%s carries the frontmatter the styleguide lists it by', file => {
    const src = readFileSync(join(dir, file), 'utf8')
    const fm = /^---\n([\s\S]*?)\n---/.exec(src)
    expect(fm, `${file} has no frontmatter`).not.toBeNull()
    for (const key of ['title:', 'description:', 'order:']) {
      expect(fm![1], `${file} is missing ${key}`).toContain(key)
    }
  })

  it('shows the source of the same file it renders', () => {
    /*
     * The demo and the code beside it are one text: the styleguide globs the
     * raw Markdown and the renderer queries the same path. If these ever came
     * from two places the documented usage could stop matching the demo.
     */
    const sg = readFileSync(join(ROOT, 'app/pages/styleguide.vue'), 'utf8')
    expect(sg).toContain("import.meta.glob('~/../content/gallery/*.md'")
    expect(sg).toContain("queryCollection('gallery')")
  })
})

describe('fenced code goes through the Editor', () => {
  it('ProsePre renders an <Editor>, so Markdown fences look like every other code block', () => {
    const pre = readFileSync(join(ROOT, 'app/components/content/ProsePre.vue'), 'utf8')
    expect(pre).toContain('<Editor')
  })

  it('CodeTabs builds its tabs from the fences in its body, not from a prop', () => {
    const tabs = readFileSync(join(ROOT, 'app/components/content/CodeTabs.vue'), 'utf8')
    // Reading the slot is what lets the code be the body rather than an argument.
    expect(tabs).toMatch(/slots\.default/)
  })
})
