<script setup lang="ts">
const route = useRoute()

/**
 * `.filter(Boolean)` is load-bearing, not tidiness.
 *
 * A catch-all route splits a trailing slash into an empty final segment, so
 * hard-loading `/guides/getting-started/` — which is exactly what a static
 * host serves, and what every direct link and search result uses — produced
 * the path `/guides/getting-started/`. That missed both the prerendered
 * payload and the content query, leaving `doc` null and the entire page
 * rendering blank after hydration. Client-side navigation hid it, because
 * NuxtLink hrefs carry no trailing slash.
 */
const path = computed(
  () => `/guides/${(route.params.slug as string[]).filter(Boolean).join('/')}`,
)

const { data: doc } = await useAsyncData(`guide-${path.value}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('guides').path(path.value).first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'Guide not found', fatal: true })
}

useHead(() => ({
  title: `${doc.value?.title} — Robot Framework Browser`,
  meta: [{ name: 'description', content: doc.value?.description ?? '' }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />
    <main class="main">
      <p class="label">Guide</p>
      <h1>{{ doc.title }}</h1>
      <p class="lede">{{ doc.description }}</p>
      <ContentRenderer :value="doc" class="doc guide" />
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 52rem;
}

.lede {
  color: var(--dim);
  font-size: var(--step-1);
}

.guide {
  max-width: none;
  margin-top: var(--sp-4);
  gap: var(--sp-6);
}

.guide :deep(h2) {
  font-size: var(--step-2);
  margin-top: var(--sp-6);
}
</style>
