<script setup lang="ts">
/**
 * One entry in the component gallery: the rendered demo, and the exact MDC
 * that produced it.
 *
 * The source is read from the same file the demo is rendered from, with its
 * frontmatter stripped. There is no second copy to keep in step — if the demo
 * changes, the shown code changes with it, because they are the same text.
 */
const props = defineProps<{
  title: string
  description: string
  /** Path of the gallery file, e.g. `/gallery/layout`. */
  path: string
  source: string
}>()

const anchor = computed(() => props.path.split('/').pop() ?? '')

const { data: doc } = await useAsyncData(`gallery-${props.path}`, async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('gallery').path(props.path).first()
  }
  return null
})

</script>

<template>
  <section :id="anchor" class="item">
    <header class="item-head">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </header>

    <div class="demo">
      <p class="demo-label">Rendered</p>
      <ContentRenderer v-if="doc" :value="doc" class="doc demo-body" />
    </div>

    <div class="source">
      <p class="demo-label">Markdown</p>
      <Editor :files="[{ name: `${anchor}.md`, lang: 'markdown', code: source }]" :line-numbers="false" />
    </div>
  </section>
</template>

<style scoped>
.item {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding-top: var(--sp-8);
  border-top: 2px solid var(--green);
  scroll-margin-top: 5rem;
}

.item-head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

h3 {
  font-size: var(--step-2);
}

.item-head p {
  color: var(--dim);
  max-width: var(--measure);
}

.demo-label {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 0 0 var(--sp-2);
}

/*
 * The demo is shown on the page ground it would really sit on, inside a frame
 * so it is obvious where the component ends and the styleguide resumes.
 */
.demo-body {
  border: 1px dashed var(--line-strong);
  border-radius: var(--radius);
  background: var(--paper);
  max-width: none;
}

.demo-body :deep(.page-section) {
  border-bottom: 0;
}

@supports (corner-shape: bevel) {
  .demo-body {
    corner-shape: bevel;
  }
}
</style>
