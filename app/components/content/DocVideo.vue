<script setup lang="ts">
/**
 * A short, silent screen recording with a caption.
 *
 *   ::doc-video{src="/videos/recorder/quick-start.mp4" poster="/videos/recorder/quick-start.jpg" alt="Recording a login keyword"}
 *   Start, click through the page, save: the keyword is in the file.
 *   ::
 *
 * Adapted from the foundation site's VideoLoop, with one difference that
 * matters for documentation: the video shows *how* something is done, so it
 * has controls - a reader pauses, scrubs back, watches a step again. It plays
 * muted and in a loop like an animated image, but only while it is on screen,
 * and never by itself under reduced motion; the poster stands in until then.
 *
 * `alt` describes the recording for someone who cannot see it, as with
 * doc-figure. The body is the visible caption and may hold Markdown.
 *
 * A short loop that shows one gesture needs no controls - it reads like an
 * animated image:
 *
 *   ::doc-video{src="/videos/recorder/loop-pause.mp4" alt="…" :controls="false"}
 *
 * Under reduced motion it does not play by itself, so it gets controls anyway.
 */
const props = withDefaults(
  defineProps<{
    /** Root-absolute path to an MP4 (H.264) in public/, e.g. /videos/foo.mp4. */
    src: string
    /** Still shown before the video plays; also its first impression in print. */
    poster?: string
    /** Screen-reader description. Required; say what the recording shows. */
    alt: string
    /** CSS aspect-ratio, keeps the layout stable before the video loads. */
    aspect?: string
    /** Play controls. Off for a short loop that only shows one gesture. */
    controls?: boolean
  }>(),
  { aspect: '16/9', poster: undefined, controls: true },
)

const video = ref<HTMLVideoElement | null>(null)
const showControls = ref(props.controls)

onMounted(() => {
  const el = video.value
  if (!el) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    showControls.value = true
    return
  }
  // Play while visible, pause when scrolled away: a page with several
  // recordings does not decode them all at once.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) void el.play().catch(() => {})
      else el.pause()
    },
    { threshold: 0.4 },
  )
  observer.observe(el)
  onBeforeUnmount(() => observer.disconnect())
})
</script>

<template>
  <figure class="video">
    <video
      ref="video"
      class="video-media"
      :src="props.src"
      :poster="props.poster"
      :aria-label="props.alt"
      :style="{ aspectRatio: props.aspect }"
      muted
      loop
      playsinline
      :controls="showControls"
      preload="none"
    />
    <figcaption class="video-caption"><slot /></figcaption>
  </figure>
</template>

<style scoped>
.video {
  margin: var(--sp-6) 0;
}

/* Framed like a code block: the recording is a screen, not a photo. */
.video-media {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel);
}

.video-caption:empty {
  display: none;
}

.video-caption {
  margin-top: var(--sp-2);
  font-size: var(--step--1);
  color: var(--faint);
  text-align: center;
}

.video-caption :deep(p) {
  margin: 0;
}
</style>
