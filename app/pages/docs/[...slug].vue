<script setup lang="ts">
/**
 * The Docs shell: sidebar, prev/next, on-this-page.
 *
 * Chapters and their order live here rather than in each file's frontmatter,
 * because ordering is a property of the whole set — deriving it from a number
 * in every file means renumbering several files to insert one page.
 */
const route = useRoute()

/*
 * `.filter(Boolean)` is load-bearing: a catch-all route splits a trailing
 * slash into an empty segment, and a static host serves /docs/x/ with the
 * slash. Without this the query misses and the page renders blank.
 */
const path = computed(() => `/docs/${(route.params.slug as string[]).filter(Boolean).join('/')}`)

/** Chapter order and display names. */
const SECTIONS: { id: string; name: string }[] = [
  { id: 'start', name: 'Getting started' },
  { id: 'concepts', name: 'Core concepts' },
  { id: 'mobile', name: 'Mobile web' },
  { id: 'extending', name: 'Extending Browser' },
  { id: 'operations', name: 'Running it' },
]

const { data: doc } = await useAsyncData(`doc-${path.value}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('docs').path(path.value).first()
  }
  return null
})

const { data: all } = await useAsyncData('docs-nav', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('docs')
      .select('path', 'title', 'description', 'section', 'order')
      .all()
  }
  return []
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such page', fatal: true })
}

interface NavPage {
  path: string
  title: string
  description: string
  section: string
  order: number
}

const chapters = computed(() =>
  SECTIONS.map(s => ({
    ...s,
    pages: ((all.value ?? []) as NavPage[])
      .filter(p => p.section === s.id)
      .sort((a, b) => a.order - b.order),
  })).filter(c => c.pages.length),
)

/** Flat reading order, for previous/next. */
const flat = computed(() => chapters.value.flatMap(c => c.pages))

const neighbours = computed(() => {
  const i = flat.value.findIndex(p => p.path === path.value)
  return { prev: flat.value[i - 1], next: flat.value[i + 1] }
})

/** On-this-page, from the rendered headings. */
const toc = computed(() => doc.value?.body?.toc?.links ?? [])

useHead(() => ({
  title: `${doc.value?.title} — Robot Framework Browser`,
  meta: [{ name: 'description', content: doc.value?.description ?? '' }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />

    <div class="layout">
      <nav class="rail" aria-label="Documentation">
        <div v-for="chapter in chapters" :key="chapter.id" class="chapter">
          <p class="chapter-name">{{ chapter.name }}</p>
          <NuxtLink
            v-for="p in chapter.pages"
            :key="p.path"
            class="rail-link"
            :class="{ on: p.path === path }"
            :to="p.path"
          >{{ p.title }}</NuxtLink>
        </div>
      </nav>

      <main class="main">
        <header class="head">
          <p class="label">{{ SECTIONS.find(s => s.id === doc.section)?.name }}</p>
          <h1>{{ doc.title }}</h1>
          <p class="lede">{{ doc.description }}</p>
        </header>

        <ContentRenderer :value="doc" class="doc" />

        <nav class="neighbours" aria-label="Neighbouring pages">
          <NuxtLink v-if="neighbours.prev" class="sib" :to="neighbours.prev.path">
            <span class="label">Previous</span>{{ neighbours.prev.title }}
          </NuxtLink>
          <NuxtLink v-if="neighbours.next" class="sib next" :to="neighbours.next.path">
            <span class="label">Next</span>{{ neighbours.next.title }}
          </NuxtLink>
        </nav>
      </main>

      <aside v-if="toc.length" class="toc">
        <p class="toc-label">On this page</p>
        <a v-for="link in toc" :key="link.id" :href="`#${link.id}`" :class="`d${link.depth}`">
          {{ link.text }}
        </a>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr) 14rem;
  align-items: start;
}

/* ---------- rail ---------- */
.rail {
  border-right: 1px solid var(--line);
  background: var(--chrome);
  position: sticky;
  top: 3.25rem;
  max-height: calc(100vh - 3.25rem);
  overflow-y: auto;
  padding: var(--sp-4) 0 var(--sp-12);
  font-size: 0.85rem;
}

.chapter-name {
  margin: var(--sp-4) 0 var(--sp-1);
  padding: 0 var(--sp-4);
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--green);
}

.rail-link {
  display: block;
  padding: var(--sp-2) var(--sp-4);
  color: var(--dim);
  border-bottom: 0;
  border-left: 2px solid transparent;
}

.rail-link:hover {
  color: var(--ink);
  background: var(--paper);
}

.rail-link.on {
  color: var(--ink);
  background: var(--paper);
  border-left-color: var(--red);
}

/* ---------- main ---------- */
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

h1 {
  font-size: var(--step-3);
}

.lede {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
}

.neighbours {
  display: flex;
  gap: var(--sp-4);
  justify-content: space-between;
  margin-top: var(--sp-12);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--line);
}

.sib {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 0;
  font-size: 0.95rem;
}

.sib.next {
  text-align: right;
  margin-left: auto;
}

/* ---------- on this page ---------- */
.toc {
  position: sticky;
  top: 4rem;
  padding: var(--sp-8) var(--sp-4) var(--sp-8) 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 5rem);
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

@media (max-width: 1200px) {
  .layout {
    grid-template-columns: 16rem minmax(0, 1fr);
  }

  .toc {
    display: none;
  }
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .rail {
    position: static;
    max-height: 18rem;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}
</style>
