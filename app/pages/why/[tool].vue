<script setup lang="ts">
/**
 * A comparison page.
 *
 * These began as JSON — a scenario, two file paths and a list of notes — which
 * was right while each page was a code diff with captions. They are arguments
 * now, so they are Markdown like the rest of the site, and the code diff is one
 * component inside the prose rather than the page itself.
 */
const route = useRoute()
const slug = computed(() => String(route.params.tool))

const { data: doc } = await useAsyncData(`why-${slug.value}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('why').where('slug', '=', slug.value).first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such comparison', fatal: true })
}

/** On-this-page, from the headings themselves. See app/utils/toc.ts. */
const toc = computed(() => tocFromBody(doc.value?.body?.value as MarkNode[] | undefined))

useHead(() => ({
  title: `${doc.value?.title} — Robot Framework Browser`,
  meta: [{ name: 'description', content: doc.value?.tagline ?? '' }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />

    <main class="main">
      <nav class="crumb" aria-label="Breadcrumb">
        <NuxtLink to="/why">Why Browser</NuxtLink><span>/</span><span>{{ doc.tool }}</span>
      </nav>

      <header class="head">
        <h1>{{ doc.title }}</h1>
        <p class="lede">{{ doc.tagline }}</p>
        <p class="versions">Compared against {{ doc.comparedAgainst }}</p>
      </header>

      <div class="cols">
        <ContentRenderer :value="doc" class="doc" />

        <aside v-if="toc.length" class="toc">
          <p class="toc-label">On this page</p>
          <a
            v-for="link in toc"
            :key="link.id"
            :href="`#${link.id}`"
            :class="`d${link.depth}`"
            :title="tocPlainText(link.nodes)"
          >
            <TocText :nodes="link.nodes" />
          </a>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.crumb {
  display: flex;
  gap: var(--sp-2);
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
}

.crumb a {
  color: var(--faint);
  border-bottom: 0;
}

.crumb a:hover {
  color: var(--ink);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

h1 {
  font-size: var(--step-4);
}

.lede {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
}

.versions {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--faint);
}

/*
 * The comparison component is deliberately allowed to run wider than the prose
 * — two code panes side by side inside a reading measure would be two columns
 * of nothing.
 */
.cols {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14rem;
  gap: var(--sp-8);
  align-items: start;
  margin-top: var(--sp-4);
}

.doc {
  min-width: 0;
}

.toc {
  position: sticky;
  top: 5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 7rem);
  overflow-y: auto;
}

.toc-label {
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 var(--sp-2);
}

.toc a {
  color: var(--dim);
  font-size: 0.8rem;
  border-bottom: 0;
  padding: 2px 0;
  line-height: 1.4;
}

.toc a:hover {
  color: var(--ink);
}

.toc a.d3 {
  padding-left: var(--sp-3);
  color: var(--faint);
}

@media (max-width: 1100px) {
  .cols {
    grid-template-columns: minmax(0, 1fr);
  }

  .toc {
    display: none;
  }
}
</style>
