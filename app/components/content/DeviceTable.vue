<script setup lang="ts">
/**
 * Filters and sorts the device table. The table itself is DeviceRows.server.vue.
 *
 * Takes no props and has no slot, so there is nothing here for Nuxt Studio to
 * serialise wrongly — `::device-table` in Markdown round-trips as those two
 * words.
 *
 * NO DEVICE DATA REACHES THIS FILE. The descriptors are 84 KB and importing
 * them put the build 67 KB past the ceiling in check-bundle.mjs; splitting the
 * user agents out to fetch on demand was still 34 KB over, because the ceiling
 * had 2 KB spare. So the island renders the values into `data-` attributes and
 * everything below reads them back out of the DOM. It is the arrangement the
 * keyword reference already uses on 651 KB, for the same reason.
 *
 * Two consequences worth stating:
 *
 * Rows are hidden, never removed. A filter change is an attribute flip on a
 * `<tbody>` rather than a re-render of up to 207 of them. It does not make the
 * hidden ones findable — `hidden` is invisible to find-in-page — so the caption
 * counts what is showing, and that count is in the prerendered HTML.
 *
 * The landscape entries are separate rows rather than a rotation toggle on
 * their portrait namesake. That looked like duplication until the numbers said
 * otherwise: on 54 of the 100, landscape is not the portrait viewport with its
 * axes swapped, because the browser chrome is a different height across.
 * `Galaxy Z Fold 6` is 928×1004 upright and 1028×876 on its side. A toggle
 * would have been a tidier table showing invented figures.
 */
type Orientation = 'portrait' | 'landscape' | 'all'
type SortKey = 'name' | 'width' | 'dpr'

const query = ref('')
/** Portrait to begin with, matching what the island rendered. */
const orientation = ref<Orientation>('portrait')
const engine = ref('all')
const touchOnly = ref(false)

const sort = ref<SortKey>('name')
const descending = ref(false)

/** The island's wrapper, so nothing here reaches outside this component. */
const root = ref<HTMLElement | null>(null)

/**
 * Engines come from the rendered rows, not from a list kept in step by hand.
 * Empty until mounted, which is why the buttons are client-side only.
 */
const engines = ref<string[]>([])

const total = ref(0)
const shown = ref(0)

const bodies = () =>
  [...(root.value?.querySelectorAll<HTMLTableSectionElement>('tbody[data-name]') ?? [])]

function apply() {
  const q = query.value.trim().toLowerCase()
  let visible = 0

  for (const body of bodies()) {
    const d = body.dataset
    const show
      = (orientation.value === 'all' || d.orientation === orientation.value)
        && (engine.value === 'all' || d.engine === engine.value)
        && (!touchOnly.value || d.touch === 'yes')
        && (!q || (d.name ?? '').includes(q))

    body.toggleAttribute('hidden', !show)
    if (show) visible++
  }

  shown.value = visible
  const caption = root.value?.querySelector('.count')
  if (caption) caption.textContent = `${visible} of ${total.value} descriptors`
}

function sortRows() {
  const table = root.value?.querySelector('table')
  if (!table) return

  const dir = descending.value ? -1 : 1
  const key = sort.value

  const ordered = bodies().sort((a, b) => {
    if (key === 'width') return dir * (+a.dataset.width! - +b.dataset.width!)
    if (key === 'dpr') return dir * (+a.dataset.dpr! - +b.dataset.dpr!)
    return dir * (a.dataset.name ?? '').localeCompare(b.dataset.name ?? '')
  })

  /*
   * Appending a node that is already in the tree moves it, so this reorders in
   * place. Each device is its own <tbody> holding both its rows, so the user
   * agent travels with the device rather than being left behind.
   */
  for (const body of ordered) table.append(body)

  for (const th of table.querySelectorAll<HTMLElement>('th[data-sort]')) {
    const active = th.dataset.sort === key
    if (active) th.setAttribute('aria-sort', descending.value ? 'descending' : 'ascending')
    else th.removeAttribute('aria-sort')
    const caret = th.querySelector('.caret')
    if (caret) caret.textContent = active ? (descending.value ? '↓' : '↑') : ''
  }
}

function sortBy(key: SortKey) {
  if (sort.value === key) descending.value = !descending.value
  else {
    sort.value = key
    /* Names read A–Z; numbers are more useful largest first. */
    descending.value = key !== 'name'
  }
  sortRows()
}

function clearFilters() {
  query.value = ''
  orientation.value = 'all'
  engine.value = 'all'
  touchOnly.value = false
}

/** Delegated, because the buttons belong to the island and are never re-rendered. */
function onClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  const head = target.closest<HTMLElement>('th[data-sort]')
  if (head) {
    sortBy(head.dataset.sort as SortKey)
    return
  }

  const button = target.closest<HTMLElement>('.expand-button')
  if (!button) return

  const body = button.closest('tbody')
  const detail = body?.querySelector('.detail')
  if (!detail) return

  const open = detail.hasAttribute('hidden')
  detail.toggleAttribute('hidden', !open)
  button.setAttribute('aria-expanded', String(open))
  button.textContent = open ? '−' : '+'
}

onMounted(() => {
  const all = bodies()
  total.value = +(root.value?.querySelector('table')?.dataset.total ?? all.length)
  engines.value = [...new Set(all.map(b => b.dataset.engine!))].sort()
  apply()
})

watch([query, orientation, engine, touchOnly], apply)

const id = useId()
</script>

<template>
  <div class="devices">
    <div class="controls">
      <div class="field">
        <label :for="`${id}-q`">Device</label>
        <input
          :id="`${id}-q`"
          v-model="query"
          type="search"
          placeholder="iPhone, Pixel, Galaxy…"
          autocomplete="off"
          spellcheck="false"
        >
      </div>

      <fieldset class="field">
        <legend>Orientation</legend>
        <div class="segmented">
          <button
            v-for="o in (['portrait', 'landscape', 'all'] as const)"
            :key="o"
            type="button"
            :aria-pressed="orientation === o"
            @click="orientation = o"
          >{{ o === 'all' ? 'Both' : o[0]!.toUpperCase() + o.slice(1) }}</button>
        </div>
      </fieldset>

      <fieldset v-if="engines.length" class="field">
        <legend>Engine</legend>
        <div class="segmented">
          <button type="button" :aria-pressed="engine === 'all'" @click="engine = 'all'">Any</button>
          <button
            v-for="e in engines"
            :key="e"
            type="button"
            :aria-pressed="engine === e"
            @click="engine = e"
          >{{ e }}</button>
        </div>
      </fieldset>

      <label class="check">
        <input v-model="touchOnly" type="checkbox">
        Touch only
      </label>
    </div>

    <p v-if="total && !shown" class="empty" role="status">
      No device matches.
      <button type="button" class="linkish" @click="clearFilters">Clear the filters</button>.
    </p>

    <!--
      The island's own click handling, delegated from its wrapper: the markup
      inside is server-rendered and Vue never touches it again.
    -->
    <div ref="root" @click="onClick">
      <DeviceRows />
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--sp-3) var(--sp-6);
  margin-bottom: var(--sp-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.field :is(label, legend) {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  padding: 0;
}

.field input[type='search'] {
  font: inherit;
  /* 16px, or iOS zooms the page in when the field takes focus. */
  font-size: 1rem;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 0.35em 0.6em;
  min-width: 14rem;
}

.segmented {
  display: flex;
}

.segmented button {
  font: inherit;
  font-size: 0.92rem;
  color: var(--dim);
  background: var(--paper);
  border: 1px solid var(--line-strong);
  margin-left: -1px;
  padding: 0.35em 0.7em;
  cursor: pointer;
}

.segmented button:first-child {
  margin-left: 0;
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.segmented button:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.segmented button[aria-pressed='true'] {
  color: var(--paper);
  background: var(--ink);
  border-color: var(--ink);
  /* Sits above its neighbours so the shared border reads as this button's. */
  position: relative;
}

.check {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 0.92rem;
  color: var(--dim);
  /* Aligns with the bottom of the controls beside it, not their labels. */
  padding-bottom: 0.4em;
}

.empty {
  font-size: 0.92rem;
  color: var(--faint);
  margin: 0 0 var(--sp-2);
}

.linkish {
  font: inherit;
  color: var(--ink);
  background: none;
  border: 0;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

/*
 * The island's markup is not this component's, so `scoped` does not reach it.
 * `:deep` is the whole reason these rules are here rather than in the island:
 * the styling belongs with the controls it has to match.
 */
:deep(.device-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

:deep(.device-table caption) {
  caption-side: top;
  text-align: left;
  font-size: 0.92rem;
  color: var(--faint);
  padding-bottom: var(--sp-2);
}

:deep(.device-table th[scope='col']) {
  text-align: left;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  border-bottom: 1px solid var(--line-strong);
  padding: 0 var(--sp-4) var(--sp-2) 0;
  /*
   * Containing block for the visually-hidden label in the last column.
   * Without it that absolutely positioned span is placed against the page
   * rather than the cell, escapes the `.scroll-x` clip, and stretches the
   * document to 487px on a 390px phone — the page then scrolls sideways, which
   * is the very fault the pages around this one teach readers to catch.
   */
  position: relative;
}

:deep(.device-table th[data-sort] button) {
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

:deep(.device-table th[data-sort] button:hover) {
  color: var(--ink);
}

:deep(.device-table .caret) {
  /* Reserved whether or not this column is the sorted one, so nothing shifts. */
  display: inline-block;
  width: 1em;
  text-align: right;
}

:deep(.device-table :is(td, tbody th)) {
  padding: var(--sp-2) var(--sp-4) var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  vertical-align: baseline;
  white-space: nowrap;
}

:deep(.device-table tbody th) {
  /*
   * Undoing `.doc th` in doc.css, which uppercases and letter-spaces column
   * headings. Correct for a heading; wrong here, where the row header is a
   * device name and `Get Device` takes it case-sensitively — the table was
   * rendering `IPHONE 13`, a string the keyword rejects.
   */
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: inherit;
  letter-spacing: normal;
  text-transform: none;
  text-align: left;
  color: var(--ink);
  /* The names are the widest thing here; the column takes what they need. */
  width: 1%;
}

/*
 * Inline code scrolls inside itself everywhere else on the site, so that a long
 * span cannot widen its column. The device name is the one string that must
 * never be cut: it is what you type. `IPHONE 11 |` with the rest scrolled out
 * of view is not a name anyone can use.
 */
:deep(.device-table tbody th code) {
  max-width: none;
  overflow: visible;
}

/*
 * The head is deliberately not sticky.
 *
 * It was, and it cost more than it gave. A sticky <th> covers whatever scrolls
 * under it and takes the press: driving the page, clicking a device's expand
 * button retried until it timed out because a <th> was intercepting pointer
 * events, and `scroll-margin-top` did not move the row clear. On top of that
 * the table sits in a horizontally scrolling wrapper, which is the scroll
 * container the stickiness actually attached to — so it was never going to
 * behave the way it read.
 *
 * The first column is a row header, so a row still says what it is without one.
 */
:deep(.device-table :is(tbody, tr, th, td)) {
  scroll-margin-top: calc(var(--header-h) + 1rem);
}

:deep(.device-table code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
}

:deep(.device-table .num) {
  font-variant-numeric: tabular-nums;
}

:deep(.device-table .expand) {
  width: 1%;
  padding-right: 0;
}

:deep(.expand-button) {
  font: inherit;
  font-family: var(--font-mono);
  color: var(--faint);
  background: none;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  /* Big enough to tap without making the row taller. */
  width: 1.9em;
  height: 1.9em;
  line-height: 1;
  cursor: pointer;
}

:deep(.expand-button:hover),
:deep(.expand-button:focus-visible) {
  color: var(--ink);
  border-color: var(--line-strong);
}

:deep(.device-table .detail td) {
  white-space: normal;
  padding-bottom: var(--sp-3);
}

:deep(.device-table .detail dl) {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--sp-1) var(--sp-4);
  margin: 0;
}

:deep(.device-table .detail dt) {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

:deep(.device-table .detail dd) {
  margin: 0;
  min-width: 0;
}

/*
 * The one place a user agent may wrap. Everywhere else on this site inline code
 * keeps its line; here the alternative is a 167-character string setting the
 * width of a seven-column table.
 */
:deep(.device-table .detail dd code) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Same definition as VersionPicker and ContributorWall; there is no global one. */
:deep(.sr-only) {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/*
 * Without JavaScript the collapsing is what breaks, not the content: the button
 * could not open anything and the user agents would sit in the page
 * unreachable. So the fallback is to stop collapsing — every user agent shows,
 * and the control that cannot work is removed.
 *
 * `scripting: none` rather than a <noscript> element. Nuxt inserts island
 * markup with innerHTML, and an innerHTML parse treats <noscript> contents as
 * elements rather than text, so the fallback stylesheet went live in browsers
 * that *had* JavaScript and hid every expand button on the page.
 */
@media (scripting: none) {
  :deep(.device-table .detail) {
    display: table-row;
  }

  :deep(.expand-button) {
    display: none;
  }
}

@media (max-width: 40rem) {
  :deep(.device-table) {
    min-width: 34rem;
  }

  .field input[type='search'] {
    min-width: 0;
  }
}
</style>
