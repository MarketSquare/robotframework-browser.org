<script setup lang="ts">
const { types, version } = useKeywordIndex()

/** Enums first: they are the ones with concrete accepted values to look up. */
const ORDER = ['Enum', 'TypedDict', 'Custom', 'Standard'] as const

const byKind = computed(() =>
  ORDER.map(kind => ({
    kind,
    items: types
      .filter(t => t.kind === kind)
      .sort((a, b) => b.usedByCount - a.usedByCount || a.name.localeCompare(b.name)),
  })).filter(g => g.items.length),
)

const BLURB: Record<string, string> = {
  Enum: 'A fixed set of accepted values.',
  TypedDict: 'A dictionary with known keys.',
  Custom: 'Converted by the library from a string you write.',
  Standard: 'Standard Robot Framework conversion.',
}

useHead({
  title: 'Argument types — Robot Framework Browser',
  meta: [{ name: 'description', content: `The ${types.length} argument types in Browser ${version}.` }],
})
</script>

<template>
  <div>
    <SiteHeader />
    <main class="main">
      <nav class="crumb">
        <NuxtLink to="/keywords">Keywords</NuxtLink><span>/</span><span>Types</span>
      </nav>
      <h1>{{ types.length }} argument types</h1>
      <p class="lede">
        What each keyword argument actually accepts. Sorted by how many keywords use them, so the
        types worth knowing come first.
      </p>

      <section v-for="group in byKind" :key="group.kind">
        <h2>{{ group.kind }} <i>{{ group.items.length }}</i></h2>
        <p class="blurb">{{ BLURB[group.kind] }}</p>
        <ul>
          <li v-for="t in group.items" :key="t.slug">
            <NuxtLink :to="`/keywords/types/${t.slug}`">{{ t.name }}</NuxtLink>
            <span>{{ t.usedByCount }} {{ t.usedByCount === 1 ? 'keyword' : 'keywords' }}</span>
          </li>
        </ul>
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
  max-width: 60rem;
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

.lede {
  color: var(--dim);
}

section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-top: var(--sp-6);
}

h2 {
  font-size: var(--step-2);
  display: flex;
  gap: var(--sp-3);
  align-items: baseline;
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

h2 i {
  font-style: normal;
  font-size: var(--step--2);
  color: var(--faint);
}

.blurb {
  color: var(--dim);
  font-size: 0.85rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0 var(--sp-6);
}

li {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  align-items: baseline;
}

li a {
  font-family: var(--font-mono);
  font-size: 0.88rem;
}

li span {
  color: var(--faint);
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
