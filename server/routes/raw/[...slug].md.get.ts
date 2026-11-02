/**
 * `/raw/<path>.md` — one page of the site as Markdown, which `/llms.txt` links
 * to instead of the HTML. `/raw/index.md` is the landing page.
 *
 * Every one is prerendered (nuxt.config.ts lists them), so on the static host
 * these are plain files. See server/utils/llms.ts.
 */
export default defineEventHandler(async (event) => {
  /*
   * The catch-all's one parameter. Its name depends on how the file name is
   * turned into a route (`slug` or `slug.md`), so it is not looked up by name.
   */
  const slug = Object.values(getRouterParams(event))[0] ?? ''
  let path = `/${slug.replace(/\.md$/, '')}`
  if (path === '/index') path = '/'

  const found = await findDocument(event, path)
  if (!found) throw createError({ statusCode: 404, statusMessage: 'No such page' })

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return await documentMarkdown(found)
})
