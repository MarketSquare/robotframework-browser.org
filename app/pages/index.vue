<script setup lang="ts">
/**
 * The landing page is content, not a component.
 *
 * It was hand-built Vue while every other page came from content/, which meant
 * its layouts — the pillar cards, the feature grid, the section headings —
 * were locked inside one file and could not be reused or edited in Studio.
 * They are MDC components now, and this route is just the frame.
 */
const { data: doc } = await useAsyncData('landing', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('landing').path('/').first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Landing content missing', fatal: true })
}

useHead(() => ({
  title: 'Robot Framework Browser — modern web automation, powered by Playwright',
  meta: [{ name: 'description', content: doc.value?.description ?? '' }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />
    <ContentRenderer :value="doc" class="landing" />
  </div>
</template>

<!--
  No styles here on purpose. Both rules that used to live in this block were
  restating something the components already do — <PageSection> sets its own
  h3 scale, and base.css styles links — and the link rule outscored the
  heading-anchor exemption in base.css, so every Markdown heading on the page
  rendered as a teal link.
-->
