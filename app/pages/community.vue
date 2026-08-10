<script setup lang="ts">
/**
 * /community — the same frame as the landing page, over content/community.md.
 *
 * The contributor list is not in the Markdown: it is generated from the
 * library's `.all-contributorsrc` into content/contributors.json, and rendered
 * by two server components the page places with ::core-team and
 * ::contributor-wall. The prose around them stays editable like any other page.
 */
const { data: doc } = await useAsyncData('community', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('pages').path('/community').first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Community content missing', fatal: true })
}

useHead(() => ({
  title: `${doc.value?.title} — Robot Framework Browser`,
  meta: [{ name: 'description', content: doc.value?.description ?? '' }],
}))

</script>

<template>
  <div v-if="doc">
    <SiteHeader />
    <ContentRenderer :value="doc" class="landing" />
  </div>
</template>
