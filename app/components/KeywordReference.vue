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

/**
 * Which rail section is open.
 *
 * Still exactly one at a time — collapsing a section is the same action as
 * expanding its fallback, so the rail is never a row of three closed headings
 * with nothing under them. Clicking the open section falls back to the one a
 * reader most likely wants next: away from documentation and types you want
 * the keywords, and away from the keywords you want the documentation.
 */
const FALLBACK: Record<string, string> = {
  docs: 'kw',
  types: 'kw',
  kw: 'docs',
}

const open = ref<'docs' | 'kw' | 'types'>('kw')

/*
 * The radios drive the CSS, so without JavaScript a click still switches
 * section — it simply cannot collapse, which is the lesser loss. With
 * JavaScript, clicking the open one moves to its fallback instead.
 */
function toggle(section: 'docs' | 'kw' | 'types', event: Event) {
  if (open.value !== section) return
  event.preventDefault()
  open.value = FALLBACK[section] as typeof open.value
}
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

/*
 * The dialog a data type opens in is pure CSS (`:target`), so it works without
 * JavaScript and Back closes it. What CSS cannot do is offer a *visible* way
 * back to the keyword you were reading, because the anchor that opened it is
 * unknowable from the target. This adds one: a close button that goes back in
 * history, which restores the scroll position rather than dumping you at the
 * top of the Data types section.
 */
const route = useRoute()
const router = useRouter()

const openType = computed(() => route.hash.startsWith('#type--'))

function closeType() {
  if (window.history.length > 1) router.back()
  // Nothing to go back to — drop the hash rather than leaving it open.
  else router.replace({ hash: '' })
}

onMounted(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && openType.value) closeType()
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
})

/*
 * Which of the three sections the reader is currently in.
 *
 * The body has exactly three landmarks — #introduction, #keywords, #types —
 * so this is "the last one that has passed under the header", which is what a
 * reader means by "where am I". Cheaper and steadier than an
 * IntersectionObserver over 230 panels, and it cannot disagree with itself
 * when several are on screen at once.
 */
const SECTIONS = [
  { id: 'introduction', label: 'Documentation' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'types', label: 'Data types' },
] as const

const here = ref<string>(SECTIONS[0].label)

onMounted(() => {
  const marks = SECTIONS.map(s => ({ ...s, el: document.getElementById(s.id) }))
  let queued = false

  const update = () => {
    queued = false
    const line = (document.querySelector('.site')?.getBoundingClientRect().height ?? 60) + 8
    let current = marks[0]
    for (const m of marks) {
      if (m.el && m.el.getBoundingClientRect().top <= line) current = m
    }
    here.value = current!.label
  }

  const onScroll = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(update)
  }

  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
})

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
      <!--
        Sticky, and it says where you are rather than what it opens. A bar that
        reads "Documentation" while you are reading the introduction is worth
        more than one that reads "Keywords" everywhere, and it still opens the
        list.
      -->
      <a class="rail-open" href="#kw-nav">
        <span class="bars" aria-hidden="true"><i /><i /><i /></span>
        <span class="rail-open-label">{{ here }}</span>
        <span class="sr">— open the keyword list</span>
      </a>

      <nav id="kw-nav" class="rail" aria-label="Keywords">
        <div class="rail-top">
          <!--
            Inside the sticky block, not above it: two separately-sticky things
            both pinned to top: 0 simply overlap, and the close button lost —
            it was in the right place and behind the search field.
          -->
          <!--
            Close and the version picker share a row: on a phone this bar is
            the only chrome the panel has, and the picker belongs with the
            thing it changes.
          -->
          <div class="rail-bar">
            <a class="rail-close" href="#kw-top" aria-label="Close the keyword list">
              <span aria-hidden="true">×</span> Close
            </a>
            <VersionPicker :current="version" />
          </div>
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
          <input :id="`${railId}-docs`" v-model="open" class="acc-radio" type="radio" value="docs" :name="`${railId}-rail`">
          <label class="acc-head" :for="`${railId}-docs`" @click="toggle('docs', $event)">
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

          <input :id="`${railId}-kw`" v-model="open" class="acc-radio" type="radio" value="kw" :name="`${railId}-rail`">
          <label class="acc-head" :for="`${railId}-kw`" @click="toggle('kw', $event)">
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

          <input :id="`${railId}-types`" v-model="open" class="acc-radio" type="radio" value="types" :name="`${railId}-rail`">
          <label class="acc-head" :for="`${railId}-types`" @click="toggle('types', $event)">
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
        </header>

        <KeywordPanels :version="version" />

        <!--
          Rendered by the page rather than by the island, because it needs
          history and an island is static markup. Without JavaScript it never
          appears and Back is the way out, which is why the dialog does not
          depend on it.
        -->
        <div v-if="openType" class="type-backdrop" @click="closeType" />
        <button v-if="openType" type="button" class="type-close" @click="closeType">
          <span aria-hidden="true">×</span> Close
        </button>
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

/*
 * A column of fixed height, not a long page that scrolls with the document.
 *
 * The rail used to scroll with the page, which meant the search field drifted
 * up under the header and lost its margin as you read. It is its own viewport
 * now: search and section headings stay put, and the only thing that scrolls
 * is the body of whichever section is open.
 */
.rail {
  position: sticky;
  top: var(--header-h, 3.85rem);
  height: calc(100dvh - var(--header-h, 3.85rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--line);
  background: var(--chrome);
  min-width: 0;
}

.rail-top {
  flex: none;
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
  flex: 1;
  min-height: 0;
}

.acc-head {
  flex: none;
}

/*
 * Exactly one body is open, and it takes whatever height is left. The three
 * headings are therefore always on screen — you can see the other two
 * sections exist without scrolling to find them, which is the point of
 * putting them in one rail.
 */
.acc-body {
  display: none;
  min-height: 0;
}

.acc-radio:checked + .acc-head + .acc-body {
  display: flex;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
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

/* Folded into the rule above; a second one here reset display and lost the
   scrolling that makes the headings stay put. */

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

/*
 * Dims the page behind the dialog, and closes it when clicked — which is what
 * a reader tries first. Rendered here rather than as a pseudo-element on the
 * panel so it is not trapped in the panel's stacking context, and so it can
 * carry a handler at all.
 */
.type-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  background: rgb(0 0 0 / 45%);
}

/*
 * Sits above the dialog, pinned to the viewport rather than to the panel, so
 * it stays reachable however far the type's documentation scrolls.
 */
.type-close {
  position: fixed;
  z-index: 61;
  /* Clear of the sticky header, which owns the top-right corner. */
  top: calc(var(--header-h, 3.85rem) + var(--sp-3));
  right: var(--sp-4);
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--panel);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.type-close:hover {
  border-color: var(--red);
}

@supports (corner-shape: bevel) {
  .type-close {
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

  /*
   * A bar rather than a button: it is stuck under the header for the whole
   * page, and it names the section you are in.
   */
  .rail-open {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    position: sticky;
    top: var(--header-h, 6.2rem);
    z-index: 14;
    margin: 0;
    padding: var(--sp-2) var(--gutter);
    border-bottom: 1px solid var(--line);
    background: var(--chrome);
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
    border-radius: 0;
  }

  .rail-open-label {
    color: var(--ink);
  }

  .rail-open::after {
    content: '▾';
    margin-left: auto;
    color: var(--faint);
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
   * Starts *below* the header, not behind it.
   *
   * Spanning the whole viewport and padding the content down looks the same
   * until you scroll: the panel's own top edge is then hidden under the
   * header, so `position: sticky; top: 0` pins the close button up there with
   * it and it disappears. Offsetting the box instead gives the close button a
   * visible edge to stick to.
   *
   * --header-h is measured and published by SiteHeader; the fallback covers
   * the two-row phone layout, which is the taller case.
   */
  .rail {
    position: fixed;
    top: var(--header-h, 6.2rem);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 15;
    max-height: none;
    padding-top: 0;
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

  .rail-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    flex-wrap: wrap;
  }

  /* Sticks with the filter block it lives in; needs no offset of its own. */
  .rail-close {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    align-self: start;
    margin: 0;
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
