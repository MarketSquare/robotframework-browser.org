import { describe, expect, it } from 'vitest'

import { highlight as appHighlight } from '../app/utils/highlight'
import { highlight as buildHighlight } from '../lib/highlighter'
import { ROBOT, ROBOT_REPL } from '../app/utils/lang'

/**
 * Two highlighters exist because they load in different module systems: the
 * app copy is loaded by Vite during prerender (JSON imports just work), the
 * build copy by plain Node (which needs import attributes and file
 * extensions, so it reads the grammars off disk instead).
 *
 * They must stay behaviourally identical, or a keyword page's embedded
 * examples would be highlighted differently from an <Editor> on the same page.
 */
const SAMPLES: [string, typeof ROBOT | typeof ROBOT_REPL][] = [
  ['*** Test Cases ***\nSign In\n    Click    text=Sign in\n', ROBOT],
  ['New Page    https://example.com\nGet Text    h1    ==    Welcome\n', ROBOT_REPL],
  ['${x} =    Set Variable    1\n', ROBOT_REPL],
]

describe('the two highlighters agree', () => {
  it.each(SAMPLES)('produces identical HTML for %j', async (code, lang) => {
    expect(await buildHighlight(code, lang)).toBe(await appHighlight(code, lang))
  })

  it('agrees on marked lines too', async () => {
    const code = 'New Page    a\nClick    b\nGet Text    c\n'
    const opts = { highlightLines: [2] }
    expect(await buildHighlight(code, ROBOT_REPL, opts)).toBe(
      await appHighlight(code, ROBOT_REPL, opts),
    )
  })
})
