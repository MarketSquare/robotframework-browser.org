<script setup lang="ts">
/**
 * Which version of the keyword reference you are reading, and how to reach
 * another one.
 *
 * Every version we hold data for is rendered here, in this design, at
 * /keywords/<version> — switching version keeps you on this site and in this
 * layout, which is the whole point of rebuilding the reference. Releases older
 * than the ones we document link to the Libdoc page published at the time, on
 * GitHub, in a new tab: that is a different site with a different look, so
 * replacing the page under someone silently would read as a broken link.
 *
 * **These are real anchors inside a <details>, not a <select> with a handler.**
 * The first version of this used `window.open` on change, which works until it
 * does not: browsers block popups outside a click gesture, so it failed
 * silently in exactly the cases nobody tests. A link needs no permission, gets
 * the browser's own middle-click and open-in-new-tab behaviour for free, and —
 * like every other menu on this site — still works with JavaScript disabled.
 *
 * Only versions with a release note are listed. Those are the releases that are
 * installable and documented, which keeps this from becoming 163 entries of
 * which most interest nobody.
 */
const { version: current } = useKeywordIndex()

import manifest from '~/generated/versions.json'

const props = defineProps<{ current: string }>()

/*
 * Read from the generated manifest — a list of strings — rather than from the
 * indexes themselves, which are 60 KB each and belong on the server.
 */
const versions = computed(() => manifest.documented as string[])

/** The current release lives at /keywords, the rest under their version. */
const href = (v: string) => (v === LATEST_VERSION ? '/keywords' : `/keywords/${v}`)
</script>

<template>
  <details class="picker">
    <summary>
      <span class="label">Version</span>
      <span class="now">{{ props.current }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </summary>

    <div class="panel">
      <!--
        Two sibling links per row, never one nested in the other: an <a> inside
        an <a> is invalid, and assistive technology cannot offer a choice
        between two targets that are the same element.
      -->
      <ul class="list">
        <li v-for="v in versions" :key="v" :class="{ on: v === props.current }">
          <NuxtLink class="doc" :to="href(v)">
            <span class="v">{{ v }}</span>
            <span v-if="v === LATEST_VERSION" class="tag">latest</span>
            <span v-if="v === props.current" class="tag reading">reading</span>
          </NuxtLink>
          <NuxtLink class="notes" :to="`/releases/${v}`">Notes</NuxtLink>
        </li>
      </ul>

      <p class="panel-note">
        Releases before {{ versions.at(-1) }} are not rendered here.
        <a :href="ARCHIVE.libdoc('19.12.0')" target="_blank" rel="noopener">
          Their original documentation is on GitHub<span class="ext" aria-hidden="true"> ↗</span>
        </a>
      </p>
    </div>
  </details>
</template>

<style scoped>
.picker {
  position: relative;
  font-size: 0.85rem;
}

summary {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--panel);
  cursor: pointer;
  /* The default triangle would sit beside our own caret. */
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary:hover {
  border-color: var(--teal);
}

.label {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

.now {
  font-family: var(--font-mono);
}

.caret {
  color: var(--faint);
  font-size: 0.7em;
}

[open] .caret {
  transform: rotate(180deg);
}

.panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  min-width: 19rem;
  max-height: 22rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.panel-note {
  color: var(--faint);
  font-size: 0.72rem;
  margin: 0;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--line);
}

.list li.on .doc {
  background: var(--chrome);
}

.tag {
  font-family: var(--font-display);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--faint);
}

.tag.reading {
  color: var(--red);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.list li {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.doc {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex: 1;
  padding: var(--sp-2);
  border-radius: var(--radius-sm);
  border-bottom: 0;
  color: var(--ink);
}

.doc:hover {
  background: var(--chrome);
}

.v {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.ext {
  color: var(--faint);
  font-size: 0.8em;
}

.notes {
  font-size: 0.72rem;
  padding: var(--sp-2);
  flex: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.all {
  font-size: 0.78rem;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--line);
  border-bottom: 0;
}

@supports (corner-shape: bevel) {
  summary,
  .panel {
    corner-shape: bevel;
  }
}

@media (max-width: 40rem) {
  .panel {
    /* A fixed-width dropdown would run off a phone screen. */
    min-width: 0;
    width: min(88vw, 22rem);
  }
}
</style>
