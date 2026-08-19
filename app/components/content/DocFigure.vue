<script setup lang="ts">
/**
 * An image with a caption.
 *
 *   ::doc-figure{src="/images/selectors.png" alt="How a selector resolves to an element"}
 *   The path a selector takes from string to element.
 *   ::
 *
 * Named doc-figure, not figure: `figure` is a native HTML element, so MDC
 * would render `::figure` as the built-in tag and never reach this component.
 * The doc-note / doc-table components dodge the same collision the same way.
 *
 * `alt` is the screen-reader text and is required — it describes the image for
 * someone who cannot see it. The body is the visible caption below the image
 * and may hold Markdown (links, `code`, emphasis), so it is a slot rather than
 * a prop. A figure with no body renders the image alone, still with its alt.
 */
const props = defineProps<{
  /** Root-absolute path to a file in public/, e.g. /images/foo.png. */
  src: string
  /** Screen-reader description. Required; keep it a real description. */
  alt: string
}>()
</script>

<template>
  <figure class="figure">
    <img class="figure-img" :src="props.src" :alt="props.alt" loading="lazy" decoding="async" />
    <figcaption class="figure-caption"><slot /></figcaption>
  </figure>
</template>

<style scoped>
/*
 * fit-content shrinks the figure to the image's natural width, so the caption
 * box is exactly as wide as the image and `text-align: center` centres the
 * caption under the image rather than across the page. max-width keeps a wide
 * image from overflowing a narrow column.
 */
.figure {
  width: fit-content;
  max-width: 100%;
  margin: var(--sp-6) 0;
}

/* display:block + max-width:100% renders at natural size, never upscaled, and
 * only shrinks when the column is narrower than the image. */
.figure-img {
  display: block;
  max-width: 100%;
  height: auto;
}

/* An empty caption (image-only usage) leaves no stray gap. */
.figure-caption:empty {
  display: none;
}

.figure-caption {
  margin-top: var(--sp-2);
  font-size: var(--step--1);
  color: var(--faint);
  text-align: center;
}

.figure-caption :deep(p) {
  margin: 0;
}
</style>
