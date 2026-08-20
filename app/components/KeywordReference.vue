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
 *
 * Which is only half the story for a reader who arrived at the dialog by
 * link — there is no same-page entry behind that one. type-dialog.ts holds
 * the rule and the reasoning; the two things it can ask for are here.
 */
const route = useRoute()
const router = useRouter()

const openType = computed(() => isTypeHash(route.hash))

/*
 * Fed from hashchange, and seeded at mount from the location rather than from
 * the route.
 *
 * Both halves matter. The server never sees a fragment, so the route starts
 * hydration without one and only picks the real hash up as the router readies
 * itself — watching the route would read that catch-up as the reader opening
 * the dialog, and a deep link would go back to a page it never came from.
 * hashchange fires for what the reader actually does and for nothing else:
 * a type link is a plain anchor, so the browser navigates the fragment itself,
 * and Back and Forward are traversals.
 */
let dialog = createTypeDialog('')

function closeType() {
  const exit = dialog.exit()

  if (exit.via === 'back') return router.back()

  /*
   * Not `router.replace({ hash })`: that is history.replaceState, which
   * changes the URL without moving the target element, and the panel would
   * stay lifted out of the page with nothing left to dismiss it. `replace`
   * rather than assigning `location.hash` so closing spends no history entry
   * — the dialog and the view behind it are one step, in both directions.
   */
  window.location.replace(exit.hash)
}

onMounted(() => {
  dialog = createTypeDialog(window.location.hash)

  const onHash = () => dialog.moveTo(window.location.hash)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && openType.value) closeType()
  }
  window.addEventListener('hashchange', onHash)
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => {
    window.removeEventListener('hashchange', onHash)
    window.removeEventListener('keydown', onKey)
  })
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
          <!--
            One row on a phone: close, the search field, and a toggle for the
            two filters that are not needed often. The panel opened with 314px
            of chrome above the first keyword — in landscape that is more than
            the panel is tall, so it showed no keywords at all.
          -->
          <div class="rail-bar">
            <div class="field grow">
              <label class="sr" for="kw-filter">Filter keywords</label>
              <!--
                `enterkeyhint` and the blur on Enter: on iOS the on-screen
                keyboard otherwise stays up after a search, and the only way
                out is the keyboard's own dismiss key.
              -->
              <input
                id="kw-filter"
                v-model="query"
                type="search"
                placeholder="Search…"
                autocomplete="off"
                enterkeyhint="search"
                @keyup.enter="($event.target as HTMLInputElement).blur()"
              >
              <button v-if="query" type="button" class="clear" aria-label="Clear search" @click="query = ''">×</button>
            </div>

            <!--
              A checkbox, not JavaScript: the whole panel is `:target`-driven
              and works with scripting off, and this has to keep that.
            -->
            <input :id="`${railId}-filters`" class="filters-toggle sr" type="checkbox">
            <!--
              It expands a panel, it does not apply a filter — "Filter" read as
              an action. The chevron says which way it goes.
            -->
            <label class="filters-button" :for="`${railId}-filters`">
              <span>Options</span><span class="chev" aria-hidden="true">▾</span>
              <span class="sr"> — version and tag filters</span>
            </label>

            <!-- Last, so it sits in the top-right corner where a dismiss belongs. -->
            <a class="rail-close" href="#kw-top" aria-label="Close the keyword list">
              <span aria-hidden="true">×</span><span class="rail-close-label"> Close</span>
            </a>
          </div>

          <div class="rail-filters">
            <VersionPicker :current="version" />

            <div class="field">
              <label class="sr" for="kw-tag">Filter by tag</label>
              <select id="kw-tag" v-model="tag">
                <option value="">— Show all tags —</option>
                <option v-for="[t, n] in allTags" :key="t" :value="t">{{ t }} ({{ n }})</option>
              </select>
            </div>
          </div>

          <!--
            No separate "x of 151 keywords" line: the section heads already
            carry both numbers, so it was a row spent restating them.
          -->
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
            Keywords <i>{{ matches.length }}<template v-if="filtering"><span class="of">/</span>{{ index.length }}</template></i>
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
            Data types <i>{{ matchingTypes.length }}<template v-if="filtering"><span class="of">/</span>{{ types.length }}</template></i>
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
  top: var(--header-h);
  height: calc(100dvh - var(--header-h));
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

/*
 * The browser draws its own clear button on `type="search"`, and this field
 * already has one — they overlapped as two × on top of each other. Ours stays,
 * because it is the one that is styled and keyboard-reachable.
 */
.field input[type='search']::-webkit-search-cancel-button,
.field input[type='search']::-webkit-search-decoration {
  appearance: none;
  display: none;
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

/* Desktop keeps both filters open; the toggle is a phone affordance. */
.rail-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.filters-toggle,
.filters-button {
  display: none;
}

.field.grow {
  flex: 1 1 auto;
  min-width: 0;
}

/* The slash in "12/151": quieter than the numbers it separates. */
.acc-head .of {
  color: var(--faint);
  margin: 0 0.1em;
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

/*
 * The state arrow, at a size you can actually read. It was 0.7em of a 0.68rem
 * heading — about 7px — which conveyed neither "expandable" nor which way it
 * pointed. It also turns to face down when the section is open, so the shape
 * carries the state rather than only the colour.
 */
.acc-head::after {
  content: '▸';
  color: var(--faint);
  font-size: 1rem;
  line-height: 1;
  transition: transform 0.12s;
}

.acc-radio:checked + .acc-head::after {
  transform: rotate(90deg);
  color: var(--green);
}

@media (prefers-reduced-motion: reduce) {
  .acc-head::after {
    transition: none;
  }
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
  top: calc(var(--header-h) + var(--sp-3));
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
    top: var(--header-h);
    z-index: 14;
    margin: 0;
    /* 44px minimum: this is the main control on a phone. */
    min-height: 2.75rem;
    padding: var(--sp-3) var(--gutter);
    border-bottom: 1px solid var(--line);
    background: var(--chrome);
    font-family: var(--font-display);
    font-size: 0.8rem;
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
    font-size: 1.1rem;
    line-height: 1;
  }

  .bars i {
    width: 1.1rem;
    height: 2px;
  }

  /* Close is a touch target too. */
  .rail-close {
    min-height: 2.75rem;
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
    /*
     * Over the header, not below it.
     *
     * While the list is open nobody needs "BROWSER · Menu · AUTO", and in
     * landscape that bar is 61 of 390px — 16% of the screen spent on chrome
     * for a panel that had no room to begin with.
     */
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 25;
    /*
     * The desktop rule sets `height: calc(100dvh - var(--header-h))`, and a
     * used height wins over stretching between top and bottom — so the panel
     * stayed 61px short of the screen even sitting at top: 0.
     */
    height: auto;
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

  /*
   * One row, and it stays put while the list scrolls under it.
   *
   * Measured before this: 314px from the top of the panel to the first
   * keyword, the same in both orientations, because close, version, search,
   * tags, the counter and two accordion heads all stacked. In landscape the
   * panel is 329px tall — so it opened on zero of its 151 keywords.
   */
  .rail-bar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-wrap: nowrap;
    /*
     * Out to both edges. The bar lives inside `.rail-top`'s padding, so its
     * background stopped short of the panel edge and left a strip of the
     * surrounding colour either side — a band that ended for no visible
     * reason. Cancel the parent padding, then put it back inside.
     */
    margin-inline: calc(-1 * var(--sp-3));
    padding: var(--sp-2) var(--sp-3);
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }

  /*
   * One height for all three controls.
   *
   * They were three different heights: the input sized itself from its font,
   * the buttons from their own min-height. Next to each other that reads as
   * carelessness before it reads as anything else.
   */
  .rail-bar .field input,
  .rail-bar .filters-button,
  .rail-bar .rail-close {
    height: 2.75rem;
    min-height: 2.75rem;
    box-sizing: border-box;
  }

  .rail-bar .field input {
    /*
     * 1rem is not a preference. Below 16px, iOS zooms the page to the field on
     * focus and does not zoom back out afterwards — the reader is left on a
     * magnified page and has to pinch out by hand.
     */
    font-size: 1rem;
    padding-inline: var(--sp-3);
  }

  .filters-button .chev {
    margin-left: var(--sp-2);
    font-size: 0.9rem;
    line-height: 1;
    transition: transform 0.12s;
  }

  .filters-toggle:checked ~ .filters-button .chev {
    transform: rotate(180deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .filters-button .chev {
      transition: none;
    }
  }

  /* The word costs a line's width next to the search field; the × does not. */
  .rail-close-label {
    display: none;
  }

  .filters-button {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--dim);
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .filters-toggle:checked ~ .filters-button {
    background: var(--chrome);
    color: var(--ink);
    border-color: var(--ink);
  }

  /* Version and tag: two controls worth 90px, needed once a session. */
  .rail-filters {
    display: none;
    padding: var(--sp-3) 0;
    border-bottom: 1px solid var(--line);
  }

  .rail-bar:has(.filters-toggle:checked) + .rail-filters {
    display: flex;
  }

  /* Three stacked heads with a count and an arrow cost 129px. */
  .acc-head {
    min-height: 2.5rem;
    padding-top: 0;
    padding-bottom: 0;
  }

  /*
   * Landscape: wide and short. Two columns doubles what is reachable without
   * scrolling, and 844px is more width than a keyword name needs.
   */
  @media (orientation: landscape) {
    /*
     * Grid, not `columns`.
     *
     * Multicol was the obvious answer and the wrong one: inside a fixed-height
     * box that scrolls vertically, the columns flow sideways, so the list
     * stopped after six entries with empty space under them and the remaining
     * 145 unreachable. A two-track grid fills rows and keeps scrolling down.
     */
    .acc-radio:checked + .acc-head + .acc-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: var(--sp-5);
      align-content: start;
    }

    .rail-kw {
      break-inside: avoid;
    }
  }

  /*
   * Last in the bar, so it lands in the top-right corner where a dismiss is
   * looked for, and larger than the Filter button beside it: it is the one
   * control that undoes opening the panel, and at the same size it read as
   * just another option.
   */
  .rail-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    margin: 0;
    padding: 0;
    min-width: 2.75rem;
    background: var(--panel);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    /* Same ink as the label beside it; it was the only white thing in the row. */
    color: var(--dim);
    font-size: 1.5rem;
    line-height: 1;
    letter-spacing: 0;
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
