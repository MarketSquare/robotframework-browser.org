<script setup lang="ts">
/**
 * The keyword reference for one version: a scrolling page, as in the Libdoc
 * redesign. Both /keywords and /keywords/<version> render this; the only
 * difference between them is which version's data is handed in.
 *
 * The body is a server component, so all 151 rendered documentation bodies
 * reach the browser as markup and nothing else. This page owns only the
 * sidebar and the filtering, both of which run against the 54 KB index.
 *
 * Filtering therefore works by toggling `hidden` on panels that are already
 * in the DOM — there is no client-side copy of the documentation to
 * re-render from, and that is the point.
 */
const props = defineProps<{ data: KeywordIndex }>()

const { index, groups, types, version, introSections } = props.data

const railId = useId()
const query = ref('')
const tag = ref('')

/** Every tag in use, with counts, for the filter. */
const allTags = computed(() => {
  const counts = new Map<string, number>()
  for (const k of index) for (const t of k.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})

const matches = computed(() => {
  const q = query.value.trim().toLowerCase()
  return index.filter(k => {
    if (tag.value && !k.tags.includes(tag.value)) return false
    if (!q) return true
    return k.name.toLowerCase().includes(q) || k.shortdoc.toLowerCase().includes(q)
  })
})

const matchingTypes = computed(() => {
  const q = query.value.trim().toLowerCase()
  // A tag filter is about keywords; types carry none, so it hides them all.
  if (tag.value) return []
  if (!q) return types
  return types.filter(t => t.name.toLowerCase().includes(q))
})

const filtering = computed(() => Boolean(query.value.trim() || tag.value))

/**
 * Apply the filter to the server-rendered panels. Runs on the client only —
 * without JavaScript the full reference is shown, which is the right
 * fallback for a filter.
 */
function applyFilter() {
  if (!import.meta.client) return
  const keep = new Set(matches.value.map(k => k.slug))
  const keepTypes = new Set(matchingTypes.value.map(t => t.anchor))

  for (const el of document.querySelectorAll<HTMLElement>('.kw')) {
    const id = el.id
    // `type--`, not `type-`: the keyword "Type Text" starts with the latter.
    const show = id.startsWith('type--') ? keepTypes.has(id) : keep.has(id)
    el.toggleAttribute('hidden', !show)
  }
  for (const el of document.querySelectorAll<HTMLElement>('.group-heading')) {
    const isTypes = el.id === 'types'
    el.toggleAttribute('hidden', (isTypes ? keepTypes.size : keep.size) === 0)
  }
  const intro = document.getElementById('introduction')
  intro?.toggleAttribute('hidden', filtering.value)
}

watch([query, tag], () => nextTick(applyFilter))

/*
 * Short kind labels for the rail. Slicing the name gave "Stan" for Standard
 * and — worse — "Type" for TypedDict, which reads as a type rather than a
 * kind of type.
 */
const KIND_SHORT: Record<string, string> = {
  Enum: 'Enum',
  TypedDict: 'Dict',
  Standard: 'Std',
  Custom: 'Custom',
}

/** First letter emphasised, so the alphabetical list can be scanned. */
function split(name: string) {
  return { head: name.slice(0, 1), rest: name.slice(1) }
}

const isLatest = version === LATEST_VERSION

useHead({
  title: isLatest
    ? 'Keyword reference — Robot Framework Browser'
    : `Keyword reference ${version} — Robot Framework Browser`,
  meta: [
    {
      name: 'description',
      content: `All ${index.length} keywords and ${types.length} argument types in the Robot Framework Browser library, version ${version}.`,
    },
  ],
})
</script>

<template>
  <div>
    <SiteHeader />

    <div class="layout">
      <!--
        The rail becomes a second menu on a phone, opened by :target rather
        than by a checkbox or a click handler.
        
        That choice is what makes "tap a keyword and the panel closes behind
        you" free: every rail link is an in-page anchor, so following one moves
        the hash off #kw-nav, the panel stops matching :target, and the browser
        jumps to the keyword. No JavaScript, and nothing to keep in sync.
      -->
      <a class="rail-open" href="#kw-nav" aria-label="Open the keyword list">
        <span class="bars" aria-hidden="true"><i /><i /><i /></span>
        Keywords
      </a>

      <nav id="kw-nav" class="rail" aria-label="Keywords">
        <a class="rail-close" href="#kw-top" aria-label="Close the keyword list">
          <span aria-hidden="true">×</span> Close
        </a>
        <div class="rail-top">
          <div class="field">
            <label class="sr" for="kw-filter">Filter keywords</label>
            <input id="kw-filter" v-model="query" type="search" placeholder="Search…" autocomplete="off">
            <button v-if="query" type="button" class="clear" aria-label="Clear search" @click="query = ''">×</button>
          </div>

          <div class="field">
            <label class="sr" for="kw-tag">Filter by tag</label>
            <select id="kw-tag" v-model="tag">
              <option value="">— Show all tags —</option>
              <option v-for="[t, n] in allTags" :key="t" :value="t">{{ t }} ({{ n }})</option>
            </select>
          </div>

          <p class="counts">
            <span :class="{ on: filtering }">{{ matches.length }}</span> of {{ index.length }} keywords
          </p>
        </div>

        <!--
          Three sections, exactly one open. Radios rather than checkboxes or
          <details>: a radio group cannot have nothing selected, so a section
          is always expanded and closing one is the same action as opening the
          next. It is also CSS-only, so it works without JavaScript.
        -->
        <div class="accordion">
          <input :id="`${railId}-docs`" class="acc-radio" type="radio" :name="`${railId}-rail`">
          <label class="acc-head" :for="`${railId}-docs`">
            Documentation <i>{{ introSections.length }}</i>
          </label>
          <div class="acc-body">
            <a
              v-for="s in introSections"
              :key="s.slug"
              class="rail-kw rail-intro"
              :class="{ sub: s.level === 3 }"
              :href="`#${s.slug}`"
            ><span class="nm">{{ s.title }}</span></a>
          </div>

          <input :id="`${railId}-kw`" class="acc-radio" type="radio" :name="`${railId}-rail`" checked>
          <label class="acc-head" :for="`${railId}-kw`">
            Keywords <i>{{ matches.length }}</i>
          </label>
          <div class="acc-body">
            <a
              v-for="kw in matches"
              :key="kw.slug"
              class="rail-kw"
              :href="`#${kw.slug}`"
              :title="kw.shortdoc"
            ><span class="nm"><b>{{ split(kw.name).head }}</b>{{ split(kw.name).rest }}</span><i>{{ kw.argCount }}</i></a>
            <p v-if="!matches.length" class="rail-none">No keyword matches.</p>
          </div>

          <input :id="`${railId}-types`" class="acc-radio" type="radio" :name="`${railId}-rail`">
          <label class="acc-head" :for="`${railId}-types`">
            Data types <i>{{ matchingTypes.length }}</i>
          </label>
          <div class="acc-body">
            <a
              v-for="t in matchingTypes"
              :key="t.slug"
              class="rail-kw"
              :href="`#${t.anchor}`"
            ><span class="nm"><b>{{ split(t.name).head }}</b>{{ split(t.name).rest }}</span><i>{{ KIND_SHORT[t.kind] ?? t.kind }}</i></a>
            <p v-if="!matchingTypes.length" class="rail-none">No type matches.</p>
          </div>
        </div>
      </nav>

      <main class="main">
        <!-- Where the close button returns to; also the panel's un-target. -->
        <span id="kw-top" class="anchor-top" />

        <header class="lib">
          <h1>{{ index.length }} keywords</h1>
          <p class="lede">
            Everything in the Browser library, generated from the library itself. Every argument
            type links to what it accepts, and every keyword links back from the types that use it.
          </p>
          <p class="meta">
            <span>Browser <b>{{ version }}</b></span>
            <span>{{ groups.length }} modules</span>
            <span>{{ types.length }} argument types</span>
          </p>

          <VersionPicker :current="version" />
        </header>

        <KeywordPanels :version="version" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 19rem minmax(0, 1fr);
  align-items: start;
}

.sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

/* ---------- rail ---------- */

.rail {
  border-right: 1px solid var(--line);
  background: var(--chrome);
  position: sticky;
  top: 3.25rem;
  max-height: calc(100vh - 3.25rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-size: 0.85rem;
}

.rail-top {
  position: sticky;
  top: 0;
  background: var(--chrome);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  z-index: 1;
}

.field {
  position: relative;
  display: flex;
}

.field input,
.field select {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  padding: 0.35rem var(--sp-2);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--ink);
}

.clear {
  position: absolute;
  right: 0.2rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: 0;
  color: var(--faint);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0.2rem 0.4rem;
}

.clear:hover {
  color: var(--ink);
}

.counts {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--faint);
  text-transform: uppercase;
}

.counts .on {
  color: var(--red-text);
}

/* ---------- accordion ---------- */

.accordion {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.acc-radio {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.acc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dim);
  cursor: pointer;
  user-select: none;
}

.acc-head::after {
  content: '▸';
  color: var(--faint);
  font-size: 0.7em;
}

.acc-head:hover {
  color: var(--ink);
  background: var(--paper);
}

.acc-head i {
  font-style: normal;
  margin-left: auto;
  margin-right: var(--sp-2);
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.acc-radio:checked + .acc-head {
  color: var(--green);
  background: var(--paper);
}

.acc-radio:checked + .acc-head::after {
  content: '▾';
  color: var(--green);
}

.acc-radio:focus-visible + .acc-head {
  outline: 2px solid var(--red);
  outline-offset: -2px;
}

.acc-body {
  display: none;
  flex-direction: column;
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line);
}

.acc-radio:checked + .acc-head + .acc-body {
  display: flex;
}

.rail-kw {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: 0.15rem var(--sp-3);
  color: var(--dim);
  border-bottom: 0;
  border-left: 2px solid transparent;
}

/*
 * The name is a single flex item. Without the wrapper, space-between treats
 * the bolded initial as its own item and pushes it to the far left, so
 * "Click" renders as "C     lick".
 */
.rail-kw .nm {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The bolded initial is what makes an alphabetical list scannable. */
.rail-kw b {
  font-weight: 600;
  color: var(--ink);
}

.rail-kw:hover,
.rail-link:hover {
  background: var(--paper);
  color: var(--ink);
}

.rail-kw i {
  font-style: normal;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  color: var(--faint);
  font-variant-numeric: tabular-nums;
}

.rail-intro.sub {
  padding-left: var(--sp-6);
  font-size: 0.8rem;
  color: var(--faint);
}

.rail-none {
  padding: var(--sp-3);
  color: var(--faint);
}

/* ---------- main ---------- */

.main {
  padding: var(--sp-8) var(--gutter) var(--sp-24);
  min-width: 0;
}

.lib {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-8);
}

.lib h1 {
  font-size: var(--step-3);
}

.lede {
  color: var(--dim);
  max-width: var(--measure);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-6);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0;
}

.meta b {
  color: var(--ink);
  font-weight: 400;
}

@supports (corner-shape: bevel) {
  .field input,
  .field select {
    corner-shape: bevel;
  }
}

/* Desktop: the rail is always there, and the mobile controls are not. */
.rail-open,
.rail-close {
  display: none;
}

.anchor-top {
  /* A target, not a box. */
  display: block;
  height: 0;
  scroll-margin-top: 5rem;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .rail-open {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    align-self: start;
    margin: var(--sp-4) var(--gutter) 0;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .bars {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .bars i {
    width: 0.85rem;
    height: 1.5px;
    background: currentcolor;
    display: block;
  }

  /*
   * Full height under the header rather than over it: the header is sticky at
   * z-index 20 and opaque, so a panel below it in the stack is covered exactly
   * where it should be, whatever height the header happens to wrap to — 98px
   * at 390px wide, 61px above that. Padding keeps the *scrollable* content
   * clear of it.
   */
  .rail {
    position: fixed;
    inset: 0;
    z-index: 15;
    max-height: none;
    height: 100dvh;
    padding-top: 6.5rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--paper);
    border-right: 0;
    /* Out of the way, and out of the tab order, until opened. */
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.12s, visibility 0.12s;
  }

  .rail:target {
    visibility: visible;
    opacity: 1;
  }

  .rail-close {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0 0 var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    background: var(--panel);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    align-self: start;
  }

  @supports (corner-shape: bevel) {
    .rail-open,
    .rail-close {
      corner-shape: bevel;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rail {
      transition: none;
    }
  }
}
</style>
