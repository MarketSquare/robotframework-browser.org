<script setup lang="ts">
/**
 * Which version of the keyword reference you are reading, and how to reach
 * another one.
 *
 * Every version we hold data for is rendered here, in this design, at
 * /keywords/<version> — switching version keeps you on this site and in this
 * layout, which is the whole point of rebuilding the reference. Older releases
 * are not offered: they are on GitHub for anyone who needs them, and a menu
 * that lists them invites a reader to go somewhere worse.
 *
 * `prefetch="false"` matters more than it looks. Every one of these routes
 * carries that version's full keyword index in its payload, so with Nuxt's
 * default prefetch-on-visible, opening this menu fired 26 requests and pulled
 * roughly a megabyte before the reader had chosen anything — which is what
 * made the page feel slow.
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

/*
 * Which version is being fetched, if any.
 *
 * A version page carries its whole rendered reference — the largest is 866 KB —
 * so switching takes a few seconds on a normal connection. Nothing moved in
 * that time: the menu stayed open, the row stayed as it was, and the only
 * available conclusion was that the click had missed.
 *
 * The row says so itself rather than a bar at the top of the window, because
 * the question being answered is "did *that* click register".
 */
const pending = ref<string | null>(null)
const router = useRouter()

/*
 * Cleared on arrival *and* on failure. A navigation that errors or is
 * cancelled would otherwise leave the row spinning for good — and this
 * component survives the switch, since it is mounted on both pages.
 */
router.afterEach(() => { pending.value = null })
router.onError(() => { pending.value = null })
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
      <div class="panel-scroll">
        <ul class="list">
        <li v-for="v in versions" :key="v" :class="{ on: v === props.current }">
          <NuxtLink
            class="doc"
            :to="href(v)"
            :prefetch="false"
            :aria-busy="pending === v || undefined"
            @click="pending = v"
          >
            <span class="v">{{ v }}</span>
            <!-- One tag, not two: on the common case both applied and the row
                 grew to three lines in a narrow panel. -->
            <span v-if="pending === v" class="tag loading">
              <span class="spinner" aria-hidden="true" />loading
            </span>
            <span v-else-if="v === props.current" class="tag reading">reading</span>
            <span v-else-if="v === LATEST_VERSION" class="tag">latest</span>
          </NuxtLink>
          <NuxtLink class="notes" :to="`/releases/${v}`" :prefetch="false">Notes</NuxtLink>
        </li>
        </ul>
      </div>
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
  /* Was 0.7em, which rendered as a speck at this size. */
  font-size: 1em;
  line-height: 1;
}

[open] .caret {
  transform: rotate(180deg);
}

/*
 * The panel carries the bevel and clips; the list inside it scrolls.
 *
 * One element cannot do both. A scrollbar is drawn in the padding box, which
 * corner-shape does not clip, so it cut across the bevelled corners — exactly
 * the fault the code blocks had.
 */
.panel {
  position: absolute;
  z-index: 10;
  top: calc(100% + 4px);
  left: 0;
  width: max-content;
  max-width: min(17rem, 80vw);
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.panel-scroll {
  max-height: 18rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--sp-2);
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

.tag.loading {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  color: var(--teal);
}

.spinner {
  width: 0.7em;
  height: 0.7em;
  border: 1.5px solid currentcolor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/*
 * Without motion the ring would be a static broken circle, which reads as a
 * rendering fault. Pulse the whole tag instead.
 */
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: currentcolor;
  }

  .tag.loading {
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    50% { opacity: 0.45; }
  }
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

@supports (corner-shape: bevel) {
  summary,
  .panel {
    corner-shape: bevel;
  }
}

/*
 * On a phone this lives inside the keyword rail, which is itself a scroll box:
 * an absolutely positioned panel was clipped by it and only half appeared. In
 * the flow it simply pushes the list down, and the rail scrolls as usual.
 */
@media (max-width: 900px) {
  /* Its own row in the bar, so the list is full width and easy to hit. */
  .picker {
    flex: 1 1 100%;
  }

  .panel {
    position: static;
    width: auto;
    max-width: none;
    box-shadow: none;
    margin-top: var(--sp-2);
  }

  .panel-scroll {
    max-height: 40dvh;
  }

  summary {
    /* A comfortable touch target. */
    min-height: 2.75rem;
  }
}
</style>
