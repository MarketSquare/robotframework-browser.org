<script setup lang="ts">
/**
 * Every contributor the all-contributors bot knows about, filterable by the
 * kind of contribution.
 *
 * A SERVER COMPONENT. The wall is 206 people; as an ordinary component the
 * data would land in a client chunk *and* be serialised again into the page
 * payload, for markup that never changes after render.
 *
 * That makes it non-reactive, so the filter is CSS: a radio group ahead of the
 * grid, and each tile carrying a class per way it contributed. Same technique
 * as the keyword reference, and it keeps working with JavaScript disabled.
 *
 * Two shapes. The full one carries the filter and every name, for /community.
 * The compact one is faces only, for the foot of a page that is about something
 * else — there it is a picture of how many people there are, not a directory.
 *
 * ::contributor-wall
 * ::contributor-wall{compact}
 */
import data from '~/../content/contributors.json'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    /**
     * How many faces to show in the compact wall. 0 means all.
     *
     * All 206 is 926 KB and 207 requests — worth it on /community, where the
     * wall is the point, and not on a page where it is a band at the foot.
     * Lazy loading does not save it either: Chrome widens its threshold on a
     * slow connection, so every one of them loads anyway.
     */
    limit?: number
  }>(),
  { compact: false, limit: 0 },
)

interface Person {
  login: string
  name: string
  avatar: string
  profile: string
  ways: string[]
}

const { people, total } = data as unknown as { people: Person[]; total: number }

const shown = computed(() => (props.limit > 0 ? people.slice(0, props.limit) : people))
const rest = computed(() => total - shown.value.length)

/**
 * The filters, in the order the page introduces the ways of contributing —
 * so the wall reads as the same list, populated.
 */
const WAYS: { id: string; label: string }[] = [
  { id: 'report', label: 'Ideas and bug reports' },
  { id: 'support', label: 'Support and funding' },
  { id: 'docs', label: 'Documentation' },
  { id: 'testing', label: 'Testing releases' },
  { id: 'code', label: 'Code' },
]

const counts = computed(() =>
  Object.fromEntries(WAYS.map(w => [w.id, people.filter(p => p.ways.includes(w.id)).length])),
)

/*
 * Fixed ids rather than useId(): the CSS below has to name them, and the wall
 * appears once per page. If a page ever needs two, these become a prop.
 */
const inputId = (way: string) => `way-${way}`
</script>

<template>
  <!--
    Faces only. Each link needs its accessible name from the alt text here,
    because unlike the full wall there is no visible name to read.
  -->
  <ul v-if="props.compact" class="wall is-compact">
    <li v-for="p in shown" :key="p.login">
      <a class="person" :href="p.profile" :title="p.name">
        <img class="face" :src="p.avatar" :alt="p.name" width="40" height="40" loading="lazy" decoding="async">
      </a>
    </li>
    <!-- Says plainly that this is a sample, and where the rest are. -->
    <li v-if="rest > 0" class="rest">
      <a href="/community#hall">+{{ rest }}</a>
    </li>
  </ul>

  <div v-else class="wall-block">
    <!--
      Inputs first and flat, because the filtering below is a sibling selector.
      Visually hidden rather than display:none — a display:none radio is not
      focusable, which would put the whole filter out of reach of a keyboard.
    -->
    <input :id="inputId('all')" class="pick" type="radio" name="way" checked>
    <input v-for="w in WAYS" :id="inputId(w.id)" :key="w.id" class="pick" type="radio" name="way">

    <fieldset class="filters">
      <legend class="sr-only">Filter contributors by kind of contribution</legend>
      <label :for="inputId('all')">Everyone <span class="count">{{ total }}</span></label>
      <label v-for="w in WAYS" :key="w.id" :for="inputId(w.id)">
        {{ w.label }} <span class="count">{{ counts[w.id] }}</span>
      </label>
    </fieldset>

    <ul class="wall">
      <li v-for="p in people" :key="p.login" :class="p.ways.map(w => `w-${w}`)">
        <a class="person" :href="p.profile">
          <img class="face" :src="p.avatar" alt="" width="56" height="56" loading="lazy" decoding="async">
          <!-- alt is empty: the name is right here, and reading it twice helps nobody. -->
          <span class="name">{{ p.name }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.wall-block {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.pick {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ---------- filters ---------- */

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  border: 0;
  padding: 0;
  margin: 0;
}

.filters label {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dim);
  cursor: pointer;
  background: var(--panel);
}

.filters label:hover {
  color: var(--ink);
  border-color: var(--line-strong);
}

.count {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  /* --faint on the filter chip measured below AA at this size. */
  color: var(--dim);
  letter-spacing: 0;
}

/* The checked filter marks itself. */
#way-all:checked ~ .filters label[for='way-all'],
#way-report:checked ~ .filters label[for='way-report'],
#way-support:checked ~ .filters label[for='way-support'],
#way-docs:checked ~ .filters label[for='way-docs'],
#way-testing:checked ~ .filters label[for='way-testing'],
#way-code:checked ~ .filters label[for='way-code'] {
  color: var(--ink);
  border-color: var(--red);
  background: var(--chrome);
}

/*
 * The radio is visually hidden, so its focus ring has to be drawn on the label
 * that stands in for it — one rule per filter, since a radio can only point at
 * its own label. Without this, tabbing into the group shows nothing at all.
 */
#way-all:focus-visible ~ .filters label[for='way-all'],
#way-report:focus-visible ~ .filters label[for='way-report'],
#way-support:focus-visible ~ .filters label[for='way-support'],
#way-docs:focus-visible ~ .filters label[for='way-docs'],
#way-testing:focus-visible ~ .filters label[for='way-testing'],
#way-code:focus-visible ~ .filters label[for='way-code'] {
  outline: 2px solid var(--red);
  outline-offset: 2px;
}

/* ---------- the wall ---------- */

.wall {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--sp-2);
}

/*
 * Each filter hides what it is not. Written as `:not()` rather than
 * hide-everything-then-show, so the default (no CSS applied at all, or a
 * browser that fails the selector) is everyone visible rather than nobody.
 */
#way-report:checked ~ .wall li:not(.w-report),
#way-support:checked ~ .wall li:not(.w-support),
#way-docs:checked ~ .wall li:not(.w-docs),
#way-testing:checked ~ .wall li:not(.w-testing),
#way-code:checked ~ .wall li:not(.w-code) {
  display: none;
}

/*
 * Compact: faces packed tight, so the block reads as a crowd at a glance
 * rather than as a list you are meant to scan.
 */
.wall.is-compact {
  grid-template-columns: repeat(auto-fill, minmax(2.5rem, 1fr));
  gap: var(--sp-1);
}

.wall.is-compact .person {
  padding: 0;
}

.rest a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px dashed var(--line-strong);
  border-bottom: 1px dashed var(--line-strong);
  font-family: var(--font-display);
  font-size: 0.62rem;
  color: var(--dim);
}

.rest a:hover {
  border-color: var(--red);
  color: var(--ink);
}

.wall.is-compact .face {
  transition: transform 0.1s;
}

.wall.is-compact .person:hover {
  background: none;
}

.wall.is-compact .person:hover .face {
  transform: scale(1.12);
}

@media (prefers-reduced-motion: reduce) {
  .wall.is-compact .face {
    transition: none;
  }

  .wall.is-compact .person:hover .face {
    transform: none;
  }
}

.person {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border-radius: var(--radius-sm);
  border-bottom: 0;
  color: var(--ink);
  min-width: 0;
}

.person:hover {
  background: var(--panel);
}

.face {
  border-radius: 50%;
  flex: none;
  background: var(--chrome);
}

.name {
  font-size: 0.82rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .wall {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  }
}
</style>
