<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.type))

const { data: type, error } = await useKeywordType(slug.value)

if (!type.value || error.value) {
  throw createError({ statusCode: 404, statusMessage: `No type “${slug.value}”`, fatal: true })
}

const KIND_BLURB: Record<string, string> = {
  Enum: 'One of a fixed set of values. Written as a plain string in a suite; case does not matter.',
  TypedDict: 'A dictionary with known keys.',
  Custom: 'Converted by the library from the string you write.',
  Standard: 'Converted by Robot Framework itself.',
}

useHead(() => ({
  title: `${type.value?.name} — argument type — Robot Framework Browser`,
  meta: [
    {
      name: 'description',
      content: `${type.value?.name}: ${KIND_BLURB[type.value?.kind ?? ''] ?? ''} Used by ${type.value?.usedBy.length} keywords.`,
    },
  ],
}))
</script>

<template>
  <div v-if="type">
    <SiteHeader />
    <main class="main">
      <nav class="crumb">
        <NuxtLink to="/keywords">Keywords</NuxtLink><span>/</span>
        <NuxtLink to="/keywords/types">Types</NuxtLink><span>/</span>
        <span>{{ type.name }}</span>
      </nav>

      <div class="title">
        <h1>{{ type.name }}</h1>
        <span class="kind">{{ type.kind }}</span>
      </div>

      <p class="lede">{{ KIND_BLURB[type.kind] }}</p>

      <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build time in lib/libdoc.ts -->
      <div v-if="type.doc" class="doc" v-html="type.doc" />

      <section v-if="type.members.length">
        <h2 class="label">Accepted values <i>{{ type.members.length }}</i></h2>
        <ul class="members">
          <li v-for="m in type.members" :key="m.name">
            <code>{{ m.name }}</code>
          </li>
        </ul>
      </section>

      <section v-if="type.items.length">
        <h2 class="label">Keys</h2>
        <div class="scroll-x">
          <table>
            <thead><tr><th>Key</th><th>Type</th><th>Required</th></tr></thead>
            <tbody>
              <tr v-for="i in type.items" :key="i.key">
                <td><code>{{ i.key }}</code></td>
                <td class="t">{{ i.type }}</td>
                <td>{{ i.required ? 'yes' : 'no' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="type.accepts.length">
        <h2 class="label">Converts from</h2>
        <p class="accepts"><code v-for="a in type.accepts" :key="a">{{ a }}</code></p>
      </section>

      <section v-if="type.usedBy.length">
        <h2 class="label">Used by <i>{{ type.usedBy.length }}</i></h2>
        <ul class="used">
          <li v-for="k in type.usedBy" :key="k.slug">
            <NuxtLink :to="`/keywords/${k.slug}`">{{ k.name }}</NuxtLink>
          </li>
        </ul>
      </section>
      <p v-else class="unused">
        No keyword currently takes or returns this type directly — it appears nested inside another.
      </p>
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

.title {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  flex-wrap: wrap;
}

h1 {
  font-size: var(--step-3);
}

.kind {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  color: var(--teal);
  border: 1px solid color-mix(in srgb, var(--teal) 45%, transparent);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
}

.lede {
  color: var(--dim);
}

section {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-top: var(--sp-4);
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

.members,
.used {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-4);
}

.used {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0 var(--sp-6);
}

.used li {
  padding: var(--sp-1) 0;
  border-bottom: 1px solid var(--line);
}

.used a,
.members code,
.accepts code {
  font-family: var(--font-mono);
  font-size: 0.88rem;
}

.members code,
.accepts code {
  background: var(--chrome);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.1em 0.4em;
}

.accepts {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

table {
  width: 100%;
  min-width: 24rem;
  font-size: 0.88rem;
}

th, td {
  text-align: left;
  padding: var(--sp-2) var(--sp-4) var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
}

th {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

td .t, td.t {
  font-family: var(--font-mono);
  color: var(--teal);
}

.unused {
  color: var(--dim);
  font-size: 0.9rem;
}

@supports (corner-shape: bevel) {
  .kind {
    corner-shape: bevel;
  }
}
</style>
