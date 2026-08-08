import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { LANG_LABEL, ROBOT, ROBOT_REPL, highlight } from '../app/utils/highlight'

const ROOT = process.cwd()

const SUITE = `*** Settings ***
Library    Browser

*** Test Cases ***
Sign In
    New Page      https://example.com/login
    \${user} =     Set Variable    admin
    Fill Text     id=user    \${user}
    Click         text=Sign in
    Get Text      h1    ==    Welcome
`

const SNIPPET = `New Page      https://example.com/login
Click         text=Sign in
Get Text      h1    ==    Welcome
`

/** Distinct inline colours in the output — a proxy for "actually tokenised". */
function colours(html: string): Set<string> {
  return new Set([...html.matchAll(/color:\s*(#[0-9a-fA-F]{6})/g)].map(m => m[1]!.toLowerCase()))
}

describe('robot grammar', () => {
  it('tokenises a full suite rather than falling back to plain text', async () => {
    const html = await highlight(SUITE, ROBOT)
    // Plain-text fallback produces exactly one colour, the foreground.
    expect(colours(html).size).toBeGreaterThan(3)
  })

  it('colours section headers with the brand red', async () => {
    const html = (await highlight(SUITE, ROBOT)).toLowerCase()
    expect(html).toContain('#ff6b5e')
  })

  it('colours keyword calls with the structural teal', async () => {
    const html = (await highlight(SUITE, ROBOT)).toLowerCase()
    expect(html).toContain('#3fc9bc')
  })

  it('colours variables with amber', async () => {
    const html = (await highlight(SUITE, ROBOT)).toLowerCase()
    expect(html).toContain('#ffb86b')
  })

  it('emits one line element per source line', async () => {
    const html = await highlight(SUITE, ROBOT)
    const lines = (html.match(/class="line/g) ?? []).length
    expect(lines).toBe(SUITE.trimEnd().split('\n').length)
  })
})

describe('robot-repl grammar', () => {
  it('tokenises a bare keyword sequence with no section headers', async () => {
    // A plain-text fallback yields exactly one colour. Two distinct token
    // colours on a three-line snippet is correct tokenisation, not a stub.
    const html = await highlight(SNIPPET, ROBOT_REPL)
    expect(colours(html).size).toBeGreaterThan(1)
  })

  it('still finds keyword calls without a section header for context', async () => {
    // This is the shape of every example extracted from Libdoc's HTML docs,
    // so if this regresses the whole keyword reference loses highlighting.
    const html = (await highlight(SNIPPET, ROBOT_REPL)).toLowerCase()
    expect(html).toContain('#3fc9bc')
  })
})

describe('other languages', () => {
  it('highlights the languages the comparison needs', async () => {
    for (const lang of ['python', 'typescript', 'javascript', 'bash'] as const) {
      const html = await highlight('const x = 1\n', lang)
      expect(html, `${lang} produced no output`).toContain('class="line')
    }
  })
})

describe('line marking', () => {
  it('marks the requested lines and no others', async () => {
    const html = await highlight(SUITE, ROBOT, { highlightLines: [6, 7] })
    expect((html.match(/is-marked/g) ?? []).length).toBe(2)
  })

  it('marks nothing when no lines are given', async () => {
    const html = await highlight(SUITE, ROBOT)
    expect(html).not.toContain('is-marked')
  })
})

describe('theme matches the design tokens', () => {
  const theme = JSON.parse(readFileSync(join(ROOT, 'themes/rfb-plate.json'), 'utf8'))
  const tokens = readFileSync(join(ROOT, 'app/assets/css/tokens.css'), 'utf8')

  const tokenValue = (name: string) =>
    tokens.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase()

  it('paints the plate with the plate tokens', () => {
    expect(theme.colors['editor.background']).toBe(tokenValue('--term-bg'))
    expect(theme.colors['editor.foreground']).toBe(tokenValue('--term-ink'))
  })

  it('uses only colours that exist in tokens.css', () => {
    // Shiki emits inline colours and cannot read CSS variables, so this is
    // the only thing keeping the syntax palette and the design system in sync.
    const allowed = new Set(
      [
        '--term-bg',
        '--term-chrome',
        '--term-tab',
        '--term-line',
        '--term-ink',
        '--term-dim',
        '--term-faint',
        '--term-red',
        '--term-teal',
        '--tok-sand',
        '--tok-amber',
        '--tok-violet',
      ].map(tokenValue),
    )

    const used = new Set<string>(
      theme.tokenColors
        .map((t: { settings: { foreground?: string } }) => t.settings.foreground?.toLowerCase())
        .filter(Boolean),
    )

    for (const colour of used) {
      expect(allowed, `${colour} is not a design token`).toContain(colour)
    }
  })
})

describe('language labels', () => {
  it('labels both robot grammars as Robot Framework', () => {
    // The reader should never see "robot-repl" — that is our plumbing.
    expect(LANG_LABEL[ROBOT]).toBe('Robot Framework')
    expect(LANG_LABEL[ROBOT_REPL]).toBe('Robot Framework')
  })
})
