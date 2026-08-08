/**
 * Build-time syntax highlighting. Spec §5.4.
 *
 * Shiki runs during `nuxt generate` and emits static HTML, so the browser
 * downloads no highlighter and no grammars.
 *
 * Robot Framework grammars are vendored from robotcode (Apache-2.0, pinned in
 * syntaxes/.pinned-commit) rather than written from scratch. Two are
 * registered because Robot Framework snippets come in two shapes:
 *
 *   robot       full suites, with *** Settings *** / *** Test Cases ***
 *   robot-repl  bare keyword sequences with no section headers — what the
 *               keyword reference's extracted examples look like
 *
 * Both grammars were verified to be self-contained (no external `include`
 * of another scope), so registering them together is sufficient and neither
 * can silently degrade to plain text through a missing dependency.
 */
import type { BundledLanguage, Highlighter, LanguageRegistration, ThemeRegistration } from 'shiki'
import { createHighlighter } from 'shiki'

import rfGrammar from '../../syntaxes/robotframework.tmLanguage.json'
import rfReplGrammar from '../../syntaxes/robotframework-repl.tmLanguage.json'
import plateTheme from '../../themes/rfb-plate.json'

export const THEME = 'rfb-plate'

/** Our own aliases. `robot` is what a Markdown fence will say. */
export const ROBOT = 'robot'
export const ROBOT_REPL = 'robot-repl'

/** Languages the comparison and guides need, beyond Robot Framework. */
const BUNDLED: BundledLanguage[] = ['python', 'typescript', 'javascript', 'bash', 'json', 'yaml']

export type Lang = typeof ROBOT | typeof ROBOT_REPL | BundledLanguage

const robot = {
  ...(rfGrammar as unknown as LanguageRegistration),
  name: ROBOT,
  aliases: ['robotframework'],
}

const robotRepl = {
  ...(rfReplGrammar as unknown as LanguageRegistration),
  name: ROBOT_REPL,
  aliases: ['robotframework-repl'],
}

let instance: Promise<Highlighter> | undefined

/** One highlighter for the whole build; creating it per block is very slow. */
export function getHighlighter(): Promise<Highlighter> {
  instance ??= createHighlighter({
    themes: [plateTheme as unknown as ThemeRegistration],
    langs: [robot, robotRepl, ...BUNDLED],
  })
  return instance
}

export interface HighlightOptions {
  /** 1-based line numbers to mark with the highlighted-range treatment. */
  highlightLines?: number[]
}

/**
 * Returns the `<pre>`-free inner HTML: one `<span class="line">` per line.
 * The Editor and Terminal components supply their own chrome, so wrapping
 * markup from Shiki would only have to be stripped again.
 */
export async function highlight(
  code: string,
  lang: Lang,
  options: HighlightOptions = {},
): Promise<string> {
  const highlighter = await getHighlighter()
  const marked = new Set(options.highlightLines ?? [])

  const html = highlighter.codeToHtml(code.replace(/\n+$/, ''), {
    lang,
    theme: THEME,
    transformers: [
      {
        line(node, line) {
          if (marked.has(line)) {
            this.addClassToHast(node, 'is-marked')
          }
        },
      },
    ],
  })

  // Strip Shiki's <pre><code> shell; keep the lines.
  const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
  return match?.[1] ?? html
}

/** Language label for the Editor status strip. */
export const LANG_LABEL: Record<string, string> = {
  [ROBOT]: 'Robot Framework',
  [ROBOT_REPL]: 'Robot Framework',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  bash: 'Bash',
  json: 'JSON',
  yaml: 'YAML',
}
