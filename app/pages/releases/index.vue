<script setup lang="ts">
/**
 * /releases — every release we render, newest first.
 *
 * The notes themselves are generated in the library repository from closed
 * issues; this page is the index the library never had. What it adds is the
 * metadata that was previously buried in each note's boilerplate paragraph —
 * the date, and which Playwright version the release was tested against —
 * because "which Browser version has Playwright 1.62?" is a question people
 * actually ask, and it was unanswerable without opening a dozen files.
 */
const { data: releases } = await useAsyncData('releases-index', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('releases')
      .select('path', 'version', 'date', 'playwright', 'supports', 'headline')
      .all()
  }
  return []
})

interface Release {
  path: string
  version: string
  date: string
  playwright: string
  supports: string
  headline: string
}

const sorted = computed(() =>
  [...((releases.value ?? []) as Release[])].sort((a, b) => compareVersions(a.version, b.version)),
)

const latest = computed(() => sorted.value[0])

useHead({
  title: 'Release notes — Robot Framework Browser',
  meta: [{ name: 'description', content: 'What changed in each release of Browser library, newest first.' }],
})
</script>

<template>
  <div>
    <SiteHeader />

    <main class="main">
      <header class="head">
        <p class="label">Releases</p>
        <h1>What changed, and when.</h1>
        <p class="lede">
          Every release from {{ sorted.at(-1)?.version }} onwards, newest first. Each note is
          generated from the issues closed for that milestone, so it links straight back to the
          discussion behind a change.
        </p>
      </header>

      <ul class="list">
        <li v-for="r in sorted" :key="r.version" :class="{ current: r.version === latest?.version }">
          <NuxtLink :to="r.path" class="rel">
            <span class="v">
              {{ r.version }}
              <span v-if="r.version === latest?.version" class="tag">Latest</span>
            </span>
            <span class="body">
              <span v-if="r.headline" class="headline">{{ r.headline }}</span>
              <span class="meta">
                <span v-if="r.date">{{ r.date }}</span>
                <span v-if="r.playwright">Playwright {{ r.playwright }}</span>
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>

      <!--
        Everything below the Markdown cutover. Linked rather than rendered:
        those notes are reStructuredText, and converting 132 files to display
        them in our type would be a lot of machinery for a page nobody reads
        twice.
      -->
      <section class="archive">
        <h2>Archived release notes</h2>
        <p>
          Releases before {{ sorted.at(-1)?.version }} were noted in reStructuredText. They are
          kept in the library repository, unchanged.
        </p>
        <BtnRow>
          <Btn :to="ARCHIVE.releaseNotes" primary>All release notes on GitHub</Btn>
          <Btn :to="ARCHIVE.releases">Releases and downloads</Btn>
        </BtnRow>
      </section>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  max-width: 62rem;
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

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.rel {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: var(--sp-4);
  align-items: baseline;
  padding: var(--sp-4) var(--sp-3);
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}

.rel:hover {
  background: var(--panel);
}

.v {
  font-family: var(--font-display);
  font-size: var(--step-1);
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.tag {
  font-size: 0.55em;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--paper);
  background: var(--red);
  padding: 0.15em 0.5em;
  border-radius: var(--radius-sm);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.headline {
  overflow-wrap: anywhere;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--faint);
}

.archive {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-top: var(--sp-8);
  padding-top: var(--sp-6);
  border-top: 1px solid var(--line);
}

.archive h2 {
  font-size: var(--step-2);
}

.archive p {
  color: var(--dim);
  max-width: var(--measure);
}

@supports (corner-shape: bevel) {
  .tag {
    corner-shape: bevel;
  }
}

@media (max-width: 40rem) {
  .rel {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-1);
  }
}
</style>
