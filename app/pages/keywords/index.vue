<script setup lang="ts">
const { index, groups, version } = useKeywordIndex()

useHead({
  title: 'Keyword reference — Robot Framework Browser',
  meta: [
    {
      name: 'description',
      content: `All ${index.length} keywords in the Robot Framework Browser library, version ${version}.`,
    },
  ],
})
</script>

<template>
  <div>
    <SiteHeader />
    <div class="layout">
      <KeywordRail />
      <main class="main">
        <p class="label">Keyword reference</p>
        <h1>{{ index.length }} keywords</h1>
        <p class="lede">
          Grouped by the module that defines them, which is the structure the library's own authors
          chose. Every keyword has its own page; every argument type links to what it accepts.
        </p>

        <section v-for="group in groups" :key="group.slug" :id="group.slug" class="group">
          <h2>
            {{ group.name }}
            <i>{{ group.count }}</i>
          </h2>
          <ul>
            <li v-for="kw in index.filter(k => k.groupSlug === group.slug)" :key="kw.slug">
              <NuxtLink :to="`/keywords/${kw.slug}`">{{ kw.name }}</NuxtLink>
              <!-- eslint-disable-next-line vue/no-v-html -- escaped then inline-rendered in lib/libdoc.ts -->
              <span v-html="kw.shortdocHtml" />
            </li>
          </ul>
        </section>

        <p class="more">
          <NuxtLink to="/keywords/types">Browse the {{ 81 }} argument types</NuxtLink>
        </p>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr);
  align-items: start;
}

.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
}

.lede {
  color: var(--dim);
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-top: var(--sp-6);
  scroll-margin-top: 4rem;
}

h2 {
  font-size: var(--step-2);
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

h2 i {
  font-style: normal;
  font-size: var(--step--2);
  color: var(--faint);
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0;
}

li {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: var(--sp-4);
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  align-items: baseline;
}

li a {
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

li span {
  color: var(--dim);
  font-size: 0.85rem;
}

.more {
  margin-top: var(--sp-8);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  li {
    grid-template-columns: 1fr;
    gap: var(--sp-1);
  }
}
</style>
