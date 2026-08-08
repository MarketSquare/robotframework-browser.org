<script setup lang="ts">
/**
 * The left rail, grouped by defining module with counts. Spec §7.1, D8.
 *
 * Libdoc carries no group field, so these groups come from each keyword's
 * `source` path via content/keyword-groups.json — which maps exactly onto the
 * library's own 20 modules, and is therefore the structure its authors chose.
 *
 * Filtering is client-side over the 36 KB index. It degrades to the full list
 * without JavaScript, which is the correct fallback for a navigation aid.
 */
const props = defineProps<{ current?: string }>()

const { index, groups } = useKeywordIndex()

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return index
  return index.filter(
    k => k.name.toLowerCase().includes(q) || k.shortdoc.toLowerCase().includes(q),
  )
})

const byGroup = computed(() =>
  groups
    .map(g => ({ ...g, keywords: filtered.value.filter(k => k.groupSlug === g.slug) }))
    .filter(g => g.keywords.length),
)

const total = computed(() => filtered.value.length)
</script>

<template>
  <nav class="rail" aria-label="Keywords">
    <div class="search">
      <label class="sr" :for="'kw-filter'">Filter keywords</label>
      <input
        id="kw-filter"
        v-model="query"
        type="search"
        placeholder="Filter…"
        autocomplete="off"
      >
      <span class="count">{{ total }}</span>
    </div>

    <p v-if="!byGroup.length" class="none">No keyword matches “{{ query }}”.</p>

    <div v-for="group in byGroup" :key="group.slug" class="group">
      <p class="group-name">
        <span>{{ group.name }}</span>
        <i>{{ group.keywords.length }}</i>
      </p>
      <NuxtLink
        v-for="kw in group.keywords"
        :key="kw.slug"
        class="kw"
        :class="{ on: kw.slug === props.current }"
        :to="`/keywords/${kw.slug}`"
      >
        <span>{{ kw.name }}</span>
        <i>{{ kw.argCount }}</i>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
.rail {
  border-right: 1px solid var(--line);
  background: var(--chrome);
  padding-bottom: var(--sp-8);
  font-size: 0.82rem;
  align-self: start;
  position: sticky;
  top: 0;
  max-height: 100vh;
  overflow-y: auto;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  background: var(--chrome);
}

.search input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 0.3rem var(--sp-2);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--ink);
}

.count {
  font-family: var(--font-display);
  font-size: 0.625rem;
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.group-name {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  margin: 0;
  padding: var(--sp-4) var(--sp-3) var(--sp-1);
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--teal);
}

.group-name i {
  font-style: normal;
  color: var(--faint);
}

.kw {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: 0.2rem var(--sp-3);
  color: var(--dim);
  border-bottom: 0;
  border-left: 2px solid transparent;
}

.kw:hover {
  color: var(--ink);
  background: var(--paper);
}

.kw.on {
  color: var(--ink);
  background: var(--paper);
  border-left-color: var(--red);
}

.kw i {
  font-style: normal;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.none {
  padding: var(--sp-4) var(--sp-3);
  color: var(--dim);
  font-size: 0.8rem;
}

@supports (corner-shape: bevel) {
  .search input {
    corner-shape: bevel;
  }
}
</style>
