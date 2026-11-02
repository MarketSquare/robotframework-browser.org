/**
 * Fills `/llms.txt` and `/llms-full.txt` (https://llmstxt.org), whose routes,
 * title and notes come from nuxt-llms and the `llms` block in nuxt.config.ts.
 * See server/utils/llms.ts for why Nuxt Content's own integration is off.
 */
import { DOC_SECTIONS } from '../../app/utils/doc-sections'
import VERSIONS from '../../app/generated/versions.json'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', async (event, options) => {
    const pages = await llmPages(event)
    const link = (p: LlmPage) => ({ title: p.title, description: p.description, href: `${SITE}${rawPath(p.path)}` })

    options.sections.push(
      {
        title: 'Start here',
        links: [
          ...pages.filter(p => p.path === '/').map(link),
          {
            title: `Keyword reference (Browser ${VERSIONS.browser})`,
            description: 'Every keyword with its arguments, types, defaults and documentation, and every argument type.',
            href: `${SITE}/keywords.md`,
          },
        ],
      },
      ...DOC_SECTIONS.map(s => ({
        title: `Docs: ${s.name}`,
        links: pages.filter(p => p.collection === 'docs' && p.section === s.id).map(link),
      })).filter(s => s.links.length),
      {
        title: 'Comparisons',
        description: 'Browser compared with other tools, each argued with a code example.',
        links: pages.filter(p => p.collection === 'why').map(link),
      },
      {
        title: 'Release notes',
        description: 'Newest first. Read these when upgrading: breaking changes are listed per release.',
        links: pages.filter(p => p.collection === 'releases').map(link),
      },
      {
        // "Optional" has a meaning in llms.txt: a reader short on context may skip it.
        title: 'Optional',
        links: pages.filter(p => p.collection === 'pages' && p.path !== '/').map(link),
      },
    )
  })

  /*
   * The full document is the landing page, the docs and the comparisons —
   * what someone writing Browser tests needs. The release notes and the
   * keyword reference are long and versioned, and stay behind their links.
   */
  nitroApp.hooks.hook('llms:generate:full', async (event, _options, contents) => {
    const pages = await llmPages(event)
    for (const page of pages.filter(p => ['pages', 'docs', 'why'].includes(p.collection) && p.path !== '/community')) {
      const found = await findDocument(event, page.path)
      if (found) contents.push(await documentMarkdown(found))
    }
  })
})
