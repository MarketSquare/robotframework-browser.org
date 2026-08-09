<script setup lang="ts">
/**
 * A headline that rotates through several alternatives.
 *
 *   :::rotating-title
 *   ---
 *   titles:
 *     - Browser automation that doesn't flake.
 *     - Browser automation that doesn't suck.
 *   ---
 *   :::
 *
 * Frontmatter rather than a Markdown list, the same way DocTable and
 * TerminalBlock take their data: a list in the body reaches a component as
 * ProseLi vnodes, not <li>, so reading it back is guesswork about Nuxt
 * Content's internals. A YAML block is exactly what was written.
 *
 * Three things worth knowing about the behaviour:
 *
 * 1. **Every headline is in the server-rendered HTML.** Only one is visible,
 *    but they all sit in the same grid cell, so the hero reserves the height of
 *    the tallest and nothing below it moves when the text changes. It also
 *    means a reader without JavaScript gets a real headline.
 *
 * 2. **The scramble only touches characters that differ.** All the headlines
 *    begin "Browser automation", and re-randomising letters that are not going
 *    to change looks like noise. Diffing first makes the effect land on the
 *    part that is actually new, which reads as deliberate rather than as an
 *    effect applied to a heading.
 *
 * 3. **It stops when it should.** `prefers-reduced-motion` disables both the
 *    rotation and the scramble — auto-updating text is exactly what that
 *    setting is asking about — and hovering or focusing the headline pauses it,
 *    so nobody loses a sentence they were halfway through reading.
 */
const props = withDefaults(
  defineProps<{
    /** The headlines, in the order written. The one shown first is random. */
    titles?: string[]
    /** Milliseconds each headline is held. */
    every?: number
  }>(),
  { titles: () => [], every: 5_000 },
)

const titles = computed(() => props.titles.map(t => String(t).trim()).filter(Boolean))

/* Server-rendered index. The random pick happens on mount — see below. */
const index = ref(0)

/** What is painted. Equals titles[index] except mid-scramble. */
const shown = ref('')

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>*#%&$'
const SCRAMBLE_MS = 620

let timer: ReturnType<typeof setInterval> | undefined
let frame: number | undefined
let paused = false
let reduced = false

function stopScramble() {
  if (frame !== undefined) cancelAnimationFrame(frame)
  frame = undefined
}

/**
 * Resolve `to` out of `from`, one character at a time.
 *
 * Characters shared with the previous headline never scramble, and neither do
 * spaces — keeping the word shape means the line stays legible while it
 * resolves instead of turning into a block of noise.
 */
function scrambleTo(from: string, to: string) {
  stopScramble()

  const settleAt = [...to].map((ch, i) => {
    if (ch === ' ' || from[i] === ch) return 0
    // Staggered left to right, with a little jitter so it is not a wipe.
    return 0.15 + (i / to.length) * 0.55 + Math.random() * 0.3
  })

  const start = performance.now()

  const step = (now: number) => {
    const t = Math.min(1, (now - start) / SCRAMBLE_MS)
    let out = ''
    for (let i = 0; i < to.length; i++) {
      out += t >= settleAt[i]! ? to[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    }
    shown.value = out
    frame = t < 1 ? requestAnimationFrame(step) : undefined
    if (t >= 1) shown.value = to
  }

  frame = requestAnimationFrame(step)
}

function advance(to = (index.value + 1) % titles.value.length) {
  if (to === index.value || !titles.value.length) return
  const from = titles.value[index.value] ?? ''
  index.value = to
  const next = titles.value[to] ?? ''
  if (reduced) shown.value = next
  else scrambleTo(from, next)
}

function start() {
  clearInterval(timer)
  if (reduced || titles.value.length < 2) return
  timer = setInterval(() => {
    if (!paused) advance()
  }, props.every)
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  shown.value = titles.value[0] ?? ''

  if (reduced) return

  /*
   * The random start. The prerendered HTML can only contain one headline, so
   * the pick has to happen here — and arriving as a scramble makes it read as
   * the rotation beginning rather than as the page correcting itself.
   */
  const pick = Math.floor(Math.random() * titles.value.length)
  if (pick !== 0) advance(pick)

  start()
})

onBeforeUnmount(() => {
  clearInterval(timer)
  stopScramble()
})

const hold = () => {
  paused = true
}
const release = () => {
  paused = false
}
</script>

<template>
  <span
    class="rot"
    @mouseenter="hold"
    @mouseleave="release"
    @focusin="hold"
    @focusout="release"
  >
    <!--
      All headlines are rendered and stacked in one grid cell: the tallest sets
      the height, so nothing below the hero moves when the text changes. Only
      the live one is visible, and `visibility: hidden` keeps the rest out of
      the accessibility tree as well as out of sight.

      `rot-line` rather than `line`: Shiki gives every rendered code line that
      class, and two unrelated things sharing a name in one page is a trap for
      whoever debugs this next.
    -->
    <span
      v-for="(t, i) in titles"
      :key="t"
      class="rot-line"
      :class="{ on: i === index }"
      :aria-hidden="i === index ? undefined : 'true'"
    >{{ i === index ? (shown || t) : t }}</span>
  </span>
</template>

<style scoped>
/*
 * Inherits its type from whatever it sits in — an <h1> on the landing page.
 * Only the stacking is the component's business.
 */
.rot {
  display: grid;
}

.rot-line {
  grid-area: 1 / 1;
  visibility: hidden;
}

.rot-line.on {
  visibility: visible;
}
</style>
