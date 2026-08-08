<script setup lang="ts">
const { version } = useKeywordIndex()

const NAV = [
  { to: '/', label: 'Intro' },
  { to: '/why', label: 'Why Browser' },
  { to: '/guides/getting-started', label: 'Guides' },
  { to: '/keywords', label: 'Keywords' },
  { to: '/styleguide', label: 'Styleguide' },
]
</script>

<template>
  <header class="site">
    <NuxtLink to="/" class="brand">
      <img src="/logo/browser.svg" alt="" width="30" height="22">
      <span>BROWSER</span>
    </NuxtLink>

    <nav class="nav" aria-label="Main">
      <NuxtLink v-for="item in NAV" :key="item.to" :to="item.to">{{ item.label }}</NuxtLink>
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
  z-index: 10;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-display);
  font-size: 0.9rem;
  color: var(--ink);
  border-bottom: 0;
}

.nav {
  display: flex;
  gap: var(--sp-4);
  font-size: 0.82rem;
}

.nav a {
  color: var(--dim);
  border-bottom: 2px solid transparent;
  padding-bottom: 2px;
}

.nav a:hover {
  color: var(--ink);
}

.nav a.router-link-active {
  color: var(--ink);
  border-bottom-color: var(--red);
}

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
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

@supports (corner-shape: bevel) {
  .ver {
    corner-shape: bevel;
  }
}
</style>
