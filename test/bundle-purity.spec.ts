import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

/**
 * The grammars are ~250 KB of TextMate JSON. They belong to the build only.
 *
 * They leaked once already: Editor.vue imported LANG_LABEL from
 * utils/highlight.ts, and that single static import pulled both grammar JSON
 * files into every client bundle. These are the source-level invariants that
 * stop it happening again; scripts/check-bundle.mjs verifies the built output.
 */
describe('grammar imports stay server-side', () => {
  /** Comments legitimately discuss the grammars; only real code counts. */
  const code = (p: string) =>
    read(p)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

  it('keeps utils/lang.ts free of grammar and highlighter imports', () => {
    const lang = code('app/utils/lang.ts')
    expect(lang).not.toContain('tmLanguage')
    expect(lang).not.toContain('createHighlighter')
    // A type-only import of shiki is erased at compile time and is fine.
    expect(lang).not.toMatch(/^import\s+\{(?!\s*type\s)[^}]*\}\s+from\s+'shiki'/m)
  })

  it('never lets a component statically import the highlighter', () => {
    for (const file of ['app/components/Editor.vue', 'app/components/ComparisonSplit.vue']) {
      const src = read(file)
      const staticImport = /^import\s[^\n]*from\s+'[~.][^']*utils\/highlight'/m
      expect(src, `${file} statically imports utils/highlight`).not.toMatch(staticImport)
    }
  })

  it('loads the highlighter only behind import.meta.server', () => {
    const src = read('app/components/Editor.vue')
    const dynamic = src.indexOf("import('~/utils/highlight')")
    expect(dynamic).toBeGreaterThan(-1)
    // The guard must appear before the import within the same block.
    const guard = src.lastIndexOf('import.meta.server', dynamic)
    expect(guard).toBeGreaterThan(-1)
    expect(dynamic - guard).toBeLessThan(120)
  })
})
