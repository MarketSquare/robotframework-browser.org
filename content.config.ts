import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
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

    guides: defineCollection({
      type: 'page',
      source: 'guides/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        order: z.number().default(99),
      }),
    }),
  },
})
