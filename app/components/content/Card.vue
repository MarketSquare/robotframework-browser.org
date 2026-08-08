<script setup lang="ts">
/**
 * A panel with an optional accent stripe and title.
 *
 * ::card{title="Speed" accent="green"}
 * Body content, any Markdown.
 * ::
 */
const props = withDefaults(
  defineProps<{
    title?: string
    /** Painted stripe along the top edge. */
    accent?: 'none' | 'green' | 'red' | 'teal'
    /** Makes the whole card a link. */
    to?: string
  }>(),
  { accent: 'none' },
)

/*
 * `resolveComponent`, not the string 'NuxtLink'.
 *
 * `<component :is="'NuxtLink'">` looks like it works and does not: a string
 * `is` is treated as a native element name, so Vue emitted a literal
 * <NuxtLink> tag that the browser rendered as an unknown inline element. The
 * card looked right and simply was not clickable — and because 'article' *is*
 * a real tag, the non-link case gave no hint anything was wrong.
 */
const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : 'article'))
</script>

<template>
  <component :is="tag" :to="to" class="card" :class="`accent-${accent}`">
    <h3 v-if="title">{{ title }}</h3>
    <div class="card-body"><slot /></div>
  </component>
</template>

<style scoped>
/*
 * The accent is painted, not bordered. As a 2px border against 1px sides the
 * bevel has to change both colour and width along the diagonal, and renders a
 * notch at each corner — worse the wider the card.
 */
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  color: inherit;
  border-bottom: 1px solid var(--line);
}

.card.accent-green {
  background:
    linear-gradient(var(--green), var(--green)) top left / 100% 2px no-repeat,
    var(--panel);
}

.card.accent-red {
  background:
    linear-gradient(var(--red), var(--red)) top left / 100% 2px no-repeat,
    var(--panel);
}

.card.accent-teal {
  background:
    linear-gradient(var(--teal), var(--teal)) top left / 100% 2px no-repeat,
    var(--panel);
}

/*
 * A card that is a link has to look like one before it is hovered — a whole
 * clickable panel with no affordance is a panel people do not click. The
 * arrow is the cheapest signal that does not turn the title teal and fight
 * the accent stripe.
 */
a.card h3::after {
  content: ' →';
  color: var(--teal);
  white-space: nowrap;
}

a.card {
  transition: border-color 0.12s, transform 0.12s;
}

a.card:hover {
  border-color: var(--line-strong);
  transform: translateY(-2px);
}

a.card:hover h3::after {
  color: var(--red);
}

@media (prefers-reduced-motion: reduce) {
  a.card {
    transition: none;
  }

  a.card:hover {
    transform: none;
  }
}

h3 {
  font-family: var(--font-display);
  font-size: var(--step-2);
  font-weight: 400;
  margin: 0;
}

.card-body {
  color: var(--dim);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.card-body :deep(p) {
  margin: 0;
}

@supports (corner-shape: bevel) {
  .card {
    corner-shape: bevel;
  }
}
</style>
