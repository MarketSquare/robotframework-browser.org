<script setup lang="ts">
import type { EditorFile } from '~/components/Editor.vue'

const route = useRoute()
const slug = computed(() => String(route.params.tool))

const { data: doc } = await useAsyncData(`compare-${slug.value}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('compare').where('slug', '=', slug.value).first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such comparison', fatal: true })
}

/** Both panes come from real files on disk; nothing is pasted. */
const left = computed<EditorFile>(() => ({
  name: doc.value!.left.name,
  lang: doc.value!.left.lang as EditorFile['lang'],
  code: exampleSource(doc.value!.left.file),
}))

const right = computed<EditorFile>(() => ({
  name: doc.value!.right.name,
  lang: doc.value!.right.lang as EditorFile['lang'],
  code: exampleSource(doc.value!.right.file),
}))

/** Stated rather than asserted — the reader can count the gutter. */
const lineNote = computed(() => {
  const a = exampleLineCount(doc.value!.left.file)
  const b = exampleLineCount(doc.value!.right.file)
  return `${a} lines vs ${b}`
})

useHead(() => ({
  title: `Browser vs ${doc.value?.tool} — Robot Framework Browser`,
  meta: [{ name: 'description', content: `${doc.value?.scenario} Written with Robot Framework Browser and with ${doc.value?.tool}.` }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />
    <main class="main">
      <nav class="crumb">
        <NuxtLink to="/why">Why Browser</NuxtLink><span>/</span><NuxtLink to="/why#compare">Comparison</NuxtLink><span>/</span><span>{{ doc.tool }}</span>
      </nav>

      <h1>Browser vs {{ doc.tool }}</h1>
      <p class="lede">{{ doc.tagline }}</p>

      <p class="scenario">
        <span class="label">Scenario</span>
        {{ doc.scenario }}
      </p>

      <ComparisonSplit :left="left" :right="right" :notes="[lineNote]" />

      <section class="differences">
        <h2 class="label">What actually differs</h2>
        <ul>
          <li v-for="note in doc.notes" :key="note">{{ note }}</li>
        </ul>
        <p class="fine">
          Compared against {{ doc.comparedAgainst }}. Both files live in
          <code>examples/{{ doc.left.file.split('/').slice(0, -1).join('/') }}/</code>
          and are read from disk at build time, so what you see here is what runs.
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 74rem;
}

.crumb {
  display: flex;
  gap: var(--sp-2);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
}

.crumb a {
  color: var(--dim);
  border-bottom: 0;
}

h1 {
  font-size: var(--step-3);
}

.lede {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
}

.scenario {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-3) var(--sp-4);
  background: var(--chrome);
  border-left: 2px solid var(--red);
  border-radius: var(--radius-sm);
  max-width: var(--measure);
  margin-bottom: var(--sp-2);
}

.differences {
  margin-top: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.differences h2 {
  margin: 0;
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

.differences ul {
  margin: 0;
  padding-left: var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  max-width: var(--measure);
}

.differences li {
  line-height: 1.7;
}

.fine {
  color: var(--dim);
  font-size: 0.85rem;
  max-width: var(--measure);
}

@supports (corner-shape: bevel) {
  .scenario {
    corner-shape: bevel;
  }
}
</style>
