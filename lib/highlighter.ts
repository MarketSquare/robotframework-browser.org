/**
 * Shiki for the build scripts. Spec §7.2.
 *
 * A sibling of app/utils/highlight.ts, not a replacement. The two exist
 * because they run in different module systems: the app copy is loaded by
 * Vite/Nitro during prerender, where `import x from './g.json'` just works;
 * this copy is loaded by plain Node, which needs import attributes for JSON
 * and explicit file extensions. Reading the grammars off disk sidesteps both.
 *
 * They must produce byte-identical output. test/highlight-parity.spec.ts
 * asserts exactly that, so the two cannot drift.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { BundledLanguage, Highlighter, LanguageRegistration, ThemeRegistration } from 'shiki'
import { createHighlighter } from 'shiki'

import { type Lang, ROBOT, ROBOT_REPL, THEME } from '../app/utils/lang.ts'

const ROOT = resolve(import.meta.dirname, '..')
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))

const BUNDLED: BundledLanguage[] = ['python', 'typescript', 'javascript', 'bash', 'json', 'yaml']

let instance: Promise<Highlighter> | undefined

export function getHighlighter(): Promise<Highlighter> {
  instance ??= createHighlighter({
    themes: [read('themes/rfb-plate.json') as ThemeRegistration],
    langs: [
      { ...(read('syntaxes/robotframework.tmLanguage.json') as LanguageRegistration), name: ROBOT, aliases: ['robotframework'] },
      { ...(read('syntaxes/robotframework-repl.tmLanguage.json') as LanguageRegistration), name: ROBOT_REPL, aliases: ['robotframework-repl'] },
      ...BUNDLED,
    ],
  })
  return instance
}

/** Must stay behaviourally identical to app/utils/highlight.ts#highlight. */
export async function highlight(
  code: string,
  lang: Lang,
  options: { highlightLines?: number[] } = {},
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
  const inner = match?.[1] ?? html
  return inner.replace(/<\/span>\n(?=<span class="line)/g, '</span>')
}
