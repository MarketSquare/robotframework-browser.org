<script setup lang="ts">
/**
 * The top of a landing page: a large mark beside a headline.
 *
 * ::page-hero{logo="/logo/browser.svg"}
 * #title
 * Browser automation that doesn't flake.
 * #default
 * Lede, actions and stats.
 * ::
 */
defineProps<{ logo?: string }>()
</script>

<template>
  <section class="hero">
    <img v-if="logo" class="mark" :src="logo" alt="" width="1664" height="1219">
    <div class="hero-text">
      <h1><slot name="title" /></h1>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  padding: clamp(3rem, 8vw, 6rem) var(--gutter);
  background: var(--panel);
  border-bottom: 1px solid var(--line);
}

.mark {
  width: 100%;
  height: auto;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

h1 {
  font-size: clamp(2rem, 5.5vw, 3.5rem);
  line-height: 1.08;
}

.hero-text :deep(p) {
  font-size: var(--step-1);
  color: var(--dim);
  max-width: 48ch;
}

/*
 * MDC wraps a slot's Markdown in a paragraph, so the headline arrives as
 * <h1><p>…</p></h1> and picks up the lede rule above — which is why it
 * rendered at body size.
 *
 * The selector needs `.hero-text` to outscore that rule: `.hero-text p` is
 * (0,1,1) and a bare `h1 p` is only (0,0,2), so the lede would keep winning.
 */
.hero-text h1 :deep(p) {
  font: inherit;
  color: inherit;
  margin: 0;
  max-width: none;
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .mark {
    max-width: 15rem;
  }
}
</style>
