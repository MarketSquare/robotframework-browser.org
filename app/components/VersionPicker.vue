<script setup lang="ts">
/**
 * Which version of the keyword reference you are reading, and how to reach
 * another one.
 *
 * The current release is rendered here, in this design. Everything older opens
 * the Libdoc page the library published at the time, on GitHub, in a new tab —
 * `target="_blank"` because it is a different site with a different look, and
 * swapping the page under someone without warning reads as a broken link.
 *
 * Only versions with a release note are offered. That is not arbitrary: those
 * are the releases that are installable and documented, and it keeps this list
 * from becoming 163 entries of which most are of interest to nobody.
 *
 * A native <select> on purpose. It is one tab stop, it is the control every
 * platform already knows how to open, and on a phone it becomes the system
 * picker rather than a menu we would have to build and then make accessible.
 */
const { version: current } = useKeywordIndex()

const { data: releases } = await useAsyncData('version-picker', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('releases').select('version').all()
  }
  return []
})

/** Newest first, current release excluded — it is the page you are on. */
const older = computed(() =>
  sortVersions(((releases.value ?? []) as { version: string }[]).map(r => r.version))
    .filter(v => v !== current),
)

/** Navigating is the whole behaviour; there is no state to keep. */
function go(event: Event) {
  const select = event.target as HTMLSelectElement
  const value = select.value
  select.value = current
  if (!value || value === current) return
  window.open(ARCHIVE.libdoc(value), '_blank', 'noopener')
}

const uid = useId()
</script>

<template>
  <div class="picker">
    <label class="picker-label" :for="uid">Version</label>
    <select :id="uid" class="picker-select" @change="go">
      <option :value="current">{{ current }} — current</option>
      <optgroup v-if="older.length" label="Older, on GitHub (opens a new tab)">
        <option v-for="v in older" :key="v" :value="v">{{ v }}</option>
      </optgroup>
    </select>
    <NuxtLink class="picker-notes" to="/releases">Release notes</NuxtLink>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.picker-label {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

.picker-select {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink);
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.5rem;
  /* The native arrow and the system menu come with the element. */
  cursor: pointer;
}

.picker-select:hover {
  border-color: var(--teal);
}

.picker-notes {
  font-size: 0.78rem;
}

@supports (corner-shape: bevel) {
  .picker-select {
    corner-shape: bevel;
  }
}
</style>
