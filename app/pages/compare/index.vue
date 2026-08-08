<script setup lang="ts">
/*
 * Server-only on purpose. Every route here is prerendered and Nuxt's payload
 * extraction carries the result to the client, so the browser never needs to
 * run a content query — and Nuxt Content only ships its client-side SQLite
 * WASM engine (~540 KB: sqlite3-worker1, an OPFS proxy and support code) when
 * a query can execute in the browser. Guarding the call keeps that out of the
 * bundle; scripts/check-bundle.mjs fails the build if it comes back.
 */
const { data: tools } = await useAsyncData('compare-index', async () =>
  import.meta.server ? await queryCollection('compare').all() : [],
)

useHead({
  title: 'Browser compared — Robot Framework Browser',
  meta: [
    {
      name: 'description',
      content:
        'The same test written with Robot Framework Browser and with Cypress, Playwright and Selenium. Facts and code, no scores.',
    },
  ],
})
</script>

<template>
  <div>
    <SiteHeader />
    <main class="main">
      <p class="label">Comparison</p>
      <h1>Let the code speak.</h1>
      <p class="lede">
        The same scenario, written twice: once with Browser, once with the other tool. Both panes
        are the real files from this repository, highlighted, side by side.
      </p>
      <p class="fine">
        No scores and no winner. The differences worth knowing are structural — where the waiting
        happens, where the assertion lives, how many processes are involved — so they are listed as
        facts under each pair and you can judge them yourself.
      </p>

      <ul class="tools">
        <li v-for="tool in tools" :key="tool.slug">
          <NuxtLink :to="`/compare/${tool.slug}`">
            <span class="name">Browser vs {{ tool.tool }}</span>
            <span class="tag">{{ tool.tagline }}</span>
          </NuxtLink>
        </li>
      </ul>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-12) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 52rem;
}

h1 {
  font-size: var(--step-4);
}

.lede {
  font-size: var(--step-1);
  color: var(--ink);
}

.fine {
  color: var(--dim);
  font-size: 0.92rem;
}

.tools {
  list-style: none;
  padding: 0;
  margin: var(--sp-6) 0 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line);
}

.tools li {
  border-bottom: 1px solid var(--line);
}

.tools a {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4) 0;
  border-bottom: 0;
  color: var(--ink);
}

.tools a:hover .name {
  color: var(--red-text);
}

.name {
  font-family: var(--font-display);
  font-size: var(--step-1);
}

.tag {
  color: var(--dim);
  font-size: 0.9rem;
}
</style>
