/**
 * Build-time syntax highlighting. Spec §5.4.
 *
 * SERVER ONLY. This module statically imports ~250 KB of TextMate grammars,
 * so it must never be reachable from the client graph. Editor.vue imports it
 * behind `import.meta.server`, which Nuxt strips from the client build; the
 * client-safe half lives in ./lang.ts.
 *
 * Robot Framework grammars are vendored from robotcode (Apache-2.0, pinned in
 * syntaxes/.pinned-commit) rather than written from scratch. Both were
 * verified self-contained — neither `include`s an external scope — so
 * registering them together is sufficient and neither can silently degrade to
 * plain text through a missing dependency.
 */
import type { BundledLanguage, Highlighter, LanguageRegistration, ThemeRegistration } from 'shiki'
import { createHighlighter } from 'shiki'

import rfGrammar from '../../syntaxes/robotframework.tmLanguage.json'
import rfReplGrammar from '../../syntaxes/robotframework-repl.tmLanguage.json'
import plateTheme from '../../themes/rfb-plate.json'
import { type Lang, ROBOT, ROBOT_REPL, THEME } from './lang'

export { LANG_LABEL, ROBOT, ROBOT_REPL, THEME, type Lang } from './lang'

/** Languages the comparison and guides need, beyond Robot Framework. */
const BUNDLED: BundledLanguage[] = ['python', 'typescript', 'javascript', 'bash', 'json', 'yaml']

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
 * Returns the inner HTML only: one `<span class="line">` per line. The Editor
 * supplies its own chrome, so Shiki's <pre><code> shell would only have to be
 * stripped again downstream.
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
          if (marked.has(line)) this.addClassToHast(node, 'is-marked')
        },
      },
    ],
  })

  const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/)
  return match?.[1] ?? html
}
