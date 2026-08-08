<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.keyword))

const { index } = useKeywordIndex()
const { data: kw, error } = await useKeyword(slug.value)

if (!kw.value || error.value) {
  throw createError({ statusCode: 404, statusMessage: `No keyword “${slug.value}”`, fatal: true })
}

/** Previous and next within the same group, for sequential reading. */
const siblings = computed(() => {
  const group = index.filter(k => k.groupSlug === kw.value!.groupSlug)
  const i = group.findIndex(k => k.slug === slug.value)
  return { prev: group[i - 1], next: group[i + 1] }
})

const signature = computed(() =>
  kw.value!.args.length
    ? `${kw.value!.name}    ${kw.value!.args.map(a => a.repr).join('    ')}`
    : kw.value!.name,
)

useHead(() => ({
  title: `${kw.value?.name} — Robot Framework Browser`,
  meta: [{ name: 'description', content: kw.value?.shortdoc ?? '' }],
}))
</script>

<template>
  <div v-if="kw">
    <SiteHeader />
    <div class="layout">
      <KeywordRail :current="kw.slug" />

      <main class="main">
        <nav class="crumb" aria-label="Breadcrumb">
          <NuxtLink to="/keywords">Keywords</NuxtLink>
          <span>/</span>
          <NuxtLink :to="`/keywords#${kw.groupSlug}`">{{ kw.group }}</NuxtLink>
        </nav>

        <div class="title">
          <h1>{{ kw.name }}</h1>
          <span class="chips">
            <TagChip v-for="tag in kw.tags" :key="tag" :tag="tag" />
          </span>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -- escaped then inline-rendered in lib/libdoc.ts -->
        <p class="short" v-html="kw.shortdocHtml" />

        <div class="scroll-x sig">
          <code>{{ signature }}</code>
        </div>

        <div class="grid">
          <div class="col">
            <section>
              <h2 class="label">Arguments <i>{{ kw.args.length }}</i></h2>
              <ArgumentTable :args="kw.args" />
            </section>

            <section v-if="kw.doc">
              <h2 class="label">Documentation</h2>
              <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build time in lib/libdoc.ts -->
              <div class="doc" v-html="kw.doc" />
            </section>
          </div>

          <aside class="col side">
            <section v-if="kw.returnTypeName" class="card">
              <h2 class="label">Returns</h2>
              <p class="ret">
                <NuxtLink v-if="kw.returnTypeHref" :to="kw.returnTypeHref">{{ kw.returnTypeName }}</NuxtLink>
                <span v-else>{{ kw.returnTypeName }}</span>
              </p>
            </section>

            <section v-if="kw.args.some(a => a.typeHref)" class="card">
              <h2 class="label">Types used</h2>
              <ul class="types">
                <li v-for="t in [...new Map(kw.args.filter(a => a.typeHref).map(a => [a.typeName, a])).values()]" :key="t.typeName!">
                  <NuxtLink :to="t.typeHref!">{{ t.typeName }}</NuxtLink>
                </li>
              </ul>
            </section>

            <section v-if="kw.sourceUrl" class="card">
              <h2 class="label">Source</h2>
              <p>
                <a :href="kw.sourceUrl" rel="noopener noreferrer" target="_blank">
                  {{ kw.group }}, line {{ kw.lineno }}
                </a>
              </p>
            </section>
          </aside>
        </div>

        <nav class="siblings" aria-label="Neighbouring keywords">
          <NuxtLink v-if="siblings.prev" :to="`/keywords/${siblings.prev.slug}`" class="sib">
            <span class="label">Previous</span>{{ siblings.prev.name }}
          </NuxtLink>
          <NuxtLink v-if="siblings.next" :to="`/keywords/${siblings.next.slug}`" class="sib next">
            <span class="label">Next</span>{{ siblings.next.name }}
          </NuxtLink>
        </nav>
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
  padding: var(--sp-6) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
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

.crumb a:hover {
  color: var(--ink);
}

.title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--sp-3);
}

h1 {
  font-size: var(--step-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}

.short {
  color: var(--ink);
  font-size: var(--step-1);
  max-width: var(--measure);
}

.sig {
  background: var(--chrome);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--sp-3) var(--sp-4);
}

.sig code {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  white-space: pre;
  color: var(--dim);
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 15rem;
  gap: var(--sp-8);
  align-items: start;
  margin-top: var(--sp-4);
}

.col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  min-width: 0;
}

.side {
  gap: var(--sp-4);
}

section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

h2.label {
  display: flex;
  gap: var(--sp-2);
  align-items: baseline;
  margin: 0;
  padding-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

h2.label i {
  font-style: normal;
  color: var(--faint);
}

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--sp-3);
  gap: var(--sp-2);
}

.card h2.label {
  border-bottom: 0;
  padding-bottom: 0;
}

.ret,
.types {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.types {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.siblings {
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
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.sib.next {
  text-align: right;
  margin-left: auto;
}

@supports (corner-shape: bevel) {
  .sig,
  .card {
    corner-shape: bevel;
  }
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
    gap: var(--sp-6);
  }
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
