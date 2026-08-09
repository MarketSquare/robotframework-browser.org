<script setup lang="ts">
/**
 * Site navigation.
 *
 * Top-level items that have children open a dropdown on hover — and on
 * keyboard focus, via :focus-within, which is what makes a hover menu usable
 * without a pointer. Every parent is itself a real link, so the menu is an
 * addition to navigation rather than a replacement for it: a reader who never
 * triggers the dropdown can still reach /why by clicking it.
 *
 * On small screens there is no hover, so the same structure becomes a panel
 * behind a menu button. Both the panel and the dropdowns are driven by a
 * checkbox and CSS, so navigation works with JavaScript disabled.
 */
const { version } = useKeywordIndex()

/** Kept in step with content/why/*.md rather than hard-coded twice. */
const { data: tools } = await useAsyncData('nav-compare', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    const all = await queryCollection('why').select('slug', 'tool', 'order').all()
    return all
      .sort((a, b) => a.order - b.order)
      .map(t => ({ to: `/why/${t.slug}`, label: `vs ${t.tool}` }))
  }
  return [] as { to: string; label: string }[]
})

interface NavItem {
  to: string
  label: string
  children?: { to: string; label: string; note?: string }[]
}

const nav = computed<NavItem[]>(() => [
  { to: '/', label: 'Intro' },
  {
    to: '/why',
    label: 'Why Browser',
    children: [
      { to: '/why', label: 'The concepts', note: 'Waiting, assertions, selectors, architecture' },
      ...(tools.value ?? []).map(t => ({ ...t, note: 'Same test, side by side' })),
    ],
  },
  {
    to: '/docs/start/getting-started',
    label: 'Docs',
    children: [
      { to: '/docs/start/getting-started', label: 'Getting started', note: 'Install, write a test, run it' },
      { to: '/docs/concepts/selectors', label: 'Finding elements', note: 'Which selector to reach for, and why' },
      { to: '/docs/concepts/architecture', label: 'How Browser works', note: 'Python, Node and Playwright' },
      { to: '/docs/extending/python-plugins', label: 'Extending Browser', note: 'Python plugins, JavaScript, translations' },
      { to: '/docs/operations/node-process', label: 'Running it', note: 'The Node process and its environment' },
    ],
  },
  { to: '/keywords', label: 'Keywords' },
  { to: '/community', label: 'Community' },
  { to: '/styleguide', label: 'Styleguide' },
])

const uid = useId()
</script>

<template>
  <header class="site">
    <NuxtLink to="/" class="brand">
      <img src="/logo/browser.svg" alt="" width="30" height="22">
      <span>BROWSER</span>
    </NuxtLink>

    <!-- Drives the small-screen panel. CSS-only, so it needs no JavaScript. -->
    <input :id="`${uid}-menu`" class="menu-toggle" type="checkbox">
    <label class="menu-button" :for="`${uid}-menu`">
      <span class="bars" aria-hidden="true"><i /><i /><i /></span>
      Menu
    </label>

    <nav class="nav" aria-label="Main">
      <div v-for="item in nav" :key="item.to" class="item" :class="{ 'has-menu': item.children }">
        <NuxtLink class="top" :to="item.to">
          {{ item.label }}
          <span v-if="item.children" class="caret" aria-hidden="true">▾</span>
        </NuxtLink>

        <div v-if="item.children" class="menu">
          <NuxtLink v-for="child in item.children" :key="child.to" class="menu-link" :to="child.to">
            <span class="menu-label">{{ child.label }}</span>
            <span v-if="child.note" class="menu-note">{{ child.note }}</span>
          </NuxtLink>
        </div>
      </div>
    </nav>

    <span class="right">
      <span class="ver" :title="`Documenting Browser ${version}`">v{{ version }}</span>
      <ThemeToggle />
    </span>
  </header>
</template>

<style scoped>
.site {
  display: flex;
  align-items: center;
  gap: var(--sp-6);
  padding: var(--sp-3) var(--gutter);
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--ink);
  border-bottom: 0;
  flex: none;
}

/* ---------- the bar ---------- */

.nav {
  display: flex;
  gap: var(--sp-1);
}

.item {
  position: relative;
}

.top {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: var(--sp-2) var(--sp-3);
  font-size: 0.85rem;
  color: var(--dim);
  border-bottom: 2px solid transparent;
}

.top:hover,
.item:focus-within .top {
  color: var(--ink);
}

.top.router-link-active {
  color: var(--ink);
  border-bottom-color: var(--red);
}

.caret {
  font-size: 0.6em;
  color: var(--faint);
}

/* ---------- dropdown ---------- */

/*
 * Opened by hover OR by focus inside the item. The focus-within half is what
 * makes this reachable from a keyboard: tabbing to the parent link reveals
 * the children, and tabbing on past them closes it again.
 */
.menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 17rem;
  background: var(--panel);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition:
    opacity 0.12s,
    transform 0.12s,
    visibility 0.12s;
}

.has-menu:hover .menu,
.has-menu:focus-within .menu {
  opacity: 1;
  visibility: visible;
  transform: none;
}

.menu-link {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-sm);
  border-bottom: 0;
  color: var(--ink);
}

.menu-link:hover,
.menu-link:focus-visible {
  background: var(--chrome);
}

.menu-label {
  font-size: 0.85rem;
}

.menu-note {
  font-size: 0.72rem;
  color: var(--faint);
}

/* ---------- right ---------- */

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex: none;
}

.ver {
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  color: var(--teal);
  border: 1px solid color-mix(in srgb, var(--teal) 40%, transparent);
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
}

/* ---------- small screens ---------- */

.menu-toggle,
.menu-button {
  display: none;
}

@supports (corner-shape: bevel) {
  .ver,
  .menu,
  .menu-link {
    corner-shape: bevel;
  }
}

@media (max-width: 900px) {
  .site {
    flex-wrap: wrap;
    gap: var(--sp-3);
  }

  .menu-button {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-left: auto;
    order: 1;
    font-family: var(--font-display);
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    padding: var(--sp-2) var(--sp-3);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    color: var(--dim);
    cursor: pointer;
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

  .right {
    order: 2;
    margin-left: 0;
  }

  /*
   * No hover on a touch screen, so the whole structure becomes one panel and
   * every group is simply expanded — an accordion here would hide three items
   * behind an extra tap for no benefit.
   */
  .nav {
    order: 3;
    display: none;
    width: 100%;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--line);
    padding-top: var(--sp-2);
  }

  .menu-toggle:checked ~ .nav {
    display: flex;
  }

  /*
   * The open panel has to scroll itself.
   *
   * The header is sticky, so an open menu taller than the viewport does not
   * scroll with the page — its lower items are simply unreachable, and the
   * scroll gesture lands on the document behind it instead. Capping the header
   * at the viewport makes it the scroll container; `overscroll-behavior:
   * contain` stops a flick that reaches the end of the list from chaining into
   * that document.
   *
   * Scrolling the whole header, brand row included, rather than just the list:
   * the panel is a continuation of the bar, and one scroll container is easier
   * to reason about than a capped list inside a wrapping flex row.
   *
   * Without :has support this is inert and the menu behaves as it did before,
   * so there is nothing to fall back to.
   */
  .site:has(.menu-toggle:checked) {
    max-height: 100dvh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .top {
    padding: var(--sp-3) 0;
    font-size: 0.95rem;
    border-bottom: 1px solid var(--line);
  }

  .top.router-link-active {
    border-bottom-color: var(--red);
  }

  .caret {
    display: none;
  }

  .menu {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    border: 0;
    box-shadow: none;
    background: transparent;
    padding: var(--sp-1) 0 var(--sp-2) var(--sp-4);
    border-left: 2px solid var(--line);
    margin-left: var(--sp-2);
    min-width: 0;
  }
}
</style>
