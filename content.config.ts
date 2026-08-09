import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    /**
     * Top-level pages — the landing page and /community — authored like every
     * other page on the site. `*.md` is deliberately not `**`: the docs have
     * their own collection with its own required frontmatter.
     */
    pages: defineCollection({
      type: 'page',
      source: '*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
      }),
    }),

    /** Component demos for the styleguide. Not routed; queried by /styleguide. */
    gallery: defineCollection({
      type: 'page',
      source: 'gallery/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number().default(99),
      }),
    }),

    /**
     * The comparison pages. Prose now rather than data: each one argues a case
     * and embeds its code example, so it is Markdown like every other page.
     */
    why: defineCollection({
      type: 'page',
      source: 'why/*.md',
      schema: z.object({
        title: z.string(),
        /** Display name, used in navigation. */
        tool: z.string(),
        /** Route under /why, e.g. `vs-cypress`. */
        slug: z.string(),
        tagline: z.string(),
        order: z.number().default(99),
        /** Versions the page was checked against. */
        comparedAgainst: z.string(),
      }),
    }),

    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        /** Chapter this page belongs to; see DOC_SECTIONS in the docs route. */
        section: z.string(),
        /** Position within the chapter. */
        order: z.number().default(99),
      }),
    }),
  },
})
