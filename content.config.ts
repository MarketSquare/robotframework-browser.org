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

    compare: defineCollection({
      type: 'data',
      source: 'compare/**.json',
      schema: z.object({
        tool: z.string(),
        slug: z.string(),
        tagline: z.string(),
        comparedAgainst: z.string(),
        scenario: z.string(),
        left: z.object({ file: z.string(), name: z.string(), lang: z.string() }),
        right: z.object({ file: z.string(), name: z.string(), lang: z.string() }),
        notes: z.array(z.string()),
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
