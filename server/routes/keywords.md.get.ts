/**
 * `/keywords.md` — the keyword reference of the current release as one
 * Markdown document, for language models. Linked from `/llms.txt`;
 * prerendered (nuxt.config.ts). The conversion is lib/libdoc-markdown.ts.
 *
 * Read from the committed libdoc JSON through `serverAssets` (nuxt.config.ts),
 * which works the same in dev, while prerendering and in tests.
 */
import { libdocToMarkdown } from '../../lib/libdoc-markdown'
import type { LibdocSpec } from '../../lib/libdoc'

export default defineEventHandler(async (event) => {
  const storage = useStorage('assets:libdoc')
  const latest = String(await storage.getItem('LATEST')).trim()
  const spec = await storage.getItem<LibdocSpec>(`Browser-${latest}.json`)
  if (!spec) throw createError({ statusCode: 404, statusMessage: `No libdoc for ${latest}` })

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return libdocToMarkdown(typeof spec === 'string' ? JSON.parse(spec) : spec, { sourceUrl: `${SITE}/keywords` })
})
