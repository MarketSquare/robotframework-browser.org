<script setup lang="ts">
const route = useRoute()
const path = computed(() => `/guides/${(route.params.slug as string[]).join('/')}`)

const { data: doc } = await useAsyncData(`guide-${path.value}`, () =>
  queryCollection('guides').path(path.value).first(),
)

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
