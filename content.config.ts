import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
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
