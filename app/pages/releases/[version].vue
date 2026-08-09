<script setup lang="ts">
/**
 * One release note.
 *
 * The Markdown is the library's, unedited apart from the preamble the importer
 * strips. What this page adds around it is context the note cannot carry on
 * its own: the version before and after it, the Playwright version it was
 * tested against, and a link straight to that version's keyword documentation.
 */
const route = useRoute()
const version = computed(() => String(route.params.version))

const { data: doc } = await useAsyncData(`release-${version.value}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('releases').where('version', '=', version.value).first()
  }
  return null
})

if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such release', fatal: true })
}

const { data: all } = await useAsyncData('releases-nav', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('releases').select('path', 'version').all()
  }
  return []
})

const sorted = computed(() =>
  [...((all.value ?? []) as { path: string; version: string }[])]
    .sort((a, b) => compareVersions(a.version, b.version)),
)

/** Newest first, so the *next* release is the entry before this one. */
const neighbours = computed(() => {
  const i = sorted.value.findIndex(r => r.version === version.value)
  return { newer: sorted.value[i - 1], older: sorted.value[i + 1] }
})

const isLatest = computed(() => sorted.value[0]?.version === version.value)

useHead(() => ({
  title: `Browser ${version.value} release notes — Robot Framework Browser`,
  meta: [{ name: 'description', content: doc.value?.headline || `What changed in Browser ${version.value}.` }],
}))
</script>

<template>
  <div v-if="doc">
    <SiteHeader />

    <main class="main">
      <nav class="crumb" aria-label="Breadcrumb">
        <NuxtLink to="/releases">Releases</NuxtLink><span>/</span><span>{{ doc.version }}</span>
      </nav>

      <header class="head">
        <h1>Browser {{ doc.version }}</h1>
        <p v-if="doc.date" class="date">Released {{ doc.date }}</p>

        <dl class="facts">
          <div v-if="doc.playwright">
            <dt>Playwright</dt>
            <dd>{{ doc.playwright }}</dd>
          </div>
          <div v-if="doc.supports">
            <dt>Supports</dt>
            <dd>{{ doc.supports }}</dd>
          </div>
        </dl>

        <BtnRow>
          <Btn :to="isLatest ? '/keywords' : `/keywords/${doc.version}`" primary>
            Keyword reference for {{ doc.version }}
          </Btn>
          <Btn :to="`https://github.com/MarketSquare/robotframework-browser/releases/tag/v${doc.version}`">
            On GitHub
          </Btn>
        </BtnRow>
      </header>

      <ContentRenderer :value="doc" class="doc" />

      <nav class="neighbours" aria-label="Neighbouring releases">
        <NuxtLink v-if="neighbours.older" class="sib" :to="neighbours.older.path">
          <span class="label">Previous</span>{{ neighbours.older.version }}
        </NuxtLink>
        <NuxtLink v-if="neighbours.newer" class="sib next" :to="neighbours.newer.path">
          <span class="label">Next</span>{{ neighbours.newer.version }}
        </NuxtLink>
      </nav>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
  max-width: 62rem;
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
  gap: var(--sp-3);
}

h1 {
  font-size: var(--step-4);
}

.date {
  color: var(--dim);
  font-size: var(--step-1);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-8);
  margin: 0;
  padding: var(--sp-3) 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.facts div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.facts dt {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

.facts dd {
  margin: 0;
  font-size: 0.9rem;
}

.neighbours {
  display: flex;
  gap: var(--sp-4);
  justify-content: space-between;
  margin-top: var(--sp-8);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--line);
}

.sib {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 0;
  font-family: var(--font-display);
}

.sib.next {
  text-align: right;
  margin-left: auto;
}
</style>
