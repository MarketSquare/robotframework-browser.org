<script setup lang="ts">
/**
 * <ComparisonSplit> — let the code speak. Spec §6.4, D23.
 *
 * Two <Editor> instances side by side, each fully highlighted in its own
 * language. Clicking a pane's ⤢ expands it to 75%; ⤡ restores parity.
 *
 * Deliberately not a draggable divider: one interaction model on every
 * screen size, no pointer-drag code, no separate mobile behaviour, and
 * nothing to retrofit for the keyboard. It is three radios plus a
 * grid-template-columns transition, so it works with JavaScript disabled.
 *
 * The narrow pane is never hidden — keeping both visible is the entire
 * point of the page. It keeps its own horizontal scroll instead.
 */
import type { EditorFile } from './Editor.vue'

const props = defineProps<{
  left: EditorFile
  right: EditorFile
  /**
   * A short measurement, e.g. "12 lines vs 9". Set in the display face as a
   * chip, which is what that face is for.
   */
  metric?: string
  /**
   * Structural observations shown beneath. Facts only — no scoring. Inline
   * Markdown is rendered, so `code` in a note looks like code.
   */
  notes?: string[]
}>()

const uid = useId()
</script>

<template>
  <div class="cmp-wrap">
    <input :id="`${uid}-even`" class="cmp-radio" data-state="even" type="radio" :name="uid" checked>
    <input :id="`${uid}-left`" class="cmp-radio" data-state="left" type="radio" :name="uid">
    <input :id="`${uid}-right`" class="cmp-radio" data-state="right" type="radio" :name="uid">

    <div class="cmp">
      <div class="cmp-pane" data-side="left">
        <Editor :files="[props.left]" :line-numbers="true">
          <template #actions>
            <label class="cmp-exp cmp-exp--go" :for="`${uid}-left`" title="Expand this pane">⤢</label>
            <label class="cmp-exp cmp-exp--back" :for="`${uid}-even`" title="Restore both panes">⤡</label>
          </template>
        </Editor>
      </div>

      <div class="cmp-pane" data-side="right">
        <Editor :files="[props.right]" :line-numbers="true">
          <template #actions>
            <label class="cmp-exp cmp-exp--go" :for="`${uid}-right`" title="Expand this pane">⤢</label>
            <label class="cmp-exp cmp-exp--back" :for="`${uid}-even`" title="Restore both panes">⤡</label>
          </template>
        </Editor>
      </div>
    </div>

    <div v-if="props.metric || props.notes?.length" class="cmp-below">
      <p v-if="props.metric" class="cmp-metric">{{ props.metric }}</p>
      <ul v-if="props.notes?.length" class="cmp-notes">
        <!-- Notes come from frontmatter, so their Markdown is inert until rendered. -->
        <li v-for="note in props.notes" :key="note" v-html="inlineMarkdown(note)" />
      </ul>
    </div>
  </div>
</template>

<style scoped>
.cmp-radio {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.cmp {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
  align-items: start;
  transition: grid-template-columns 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

/*
 * Selected by data-state rather than id, because the ids are per-instance.
 * :has() lets the checked radio drive a sibling subtree's layout.
 */
.cmp-wrap:has([data-state='left']:checked) .cmp {
  grid-template-columns: 3fr 1fr;
}

.cmp-wrap:has([data-state='right']:checked) .cmp {
  grid-template-columns: 1fr 3fr;
}

/* Panes must be allowed to shrink, or the grid ratio is ignored. */
.cmp-pane {
  min-width: 0;
}

.cmp-exp {
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  border: 1px solid var(--term-line);
  background: transparent;
  color: var(--term-dim);
  padding: 0.22rem 0.45rem;
  cursor: pointer;
  display: none;
  align-items: center;
}

.cmp-exp:hover {
  color: var(--term-ink);
  border-color: var(--term-faint);
}

/*
 * Which control each pane shows depends on the current state: a pane that is
 * already expanded offers "restore", every other pane offers "expand". A
 * label's `for` is static, so both are rendered and CSS picks one.
 */
.cmp-wrap:has([data-state='even']:checked) .cmp-exp--go,
.cmp-wrap:has([data-state='left']:checked) [data-side='left'] .cmp-exp--back,
.cmp-wrap:has([data-state='left']:checked) [data-side='right'] .cmp-exp--go,
.cmp-wrap:has([data-state='right']:checked) [data-side='right'] .cmp-exp--back,
.cmp-wrap:has([data-state='right']:checked) [data-side='left'] .cmp-exp--go {
  display: inline-flex;
}

/*
 * Focus. A radio group exposes only its *checked* member to the tab order and
 * moves between members with the arrow keys. At rest that member is `even`,
 * whose own label (⤡ restore) is display:none — so focusing the group used to
 * show the reader nothing at all.
 *
 * Ringing every rendered control instead means the ring lands on whatever is
 * actually on screen, and reads as "you are on the split controls; arrow keys
 * change the split".
 */
.cmp-wrap:has(.cmp-radio:focus-visible) .cmp-exp {
  outline: 2px solid var(--red);
  outline-offset: 2px;
}

.cmp-below {
  margin-top: var(--sp-4);
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

/*
 * The measurement is a label, so it keeps the display face. The notes are
 * sentences, so they do not: OCR-A, uppercased and letter-spaced, is for two
 * or three words at a time and becomes hard work at sentence length.
 */
.cmp-metric {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  color: var(--faint);
  text-transform: uppercase;
  margin: 0;
}

.cmp-notes {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  margin: 0;
  padding: 0 0 0 var(--sp-4);
  list-style: disc;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--dim);
}

.cmp-notes li::marker {
  color: var(--faint);
}

.cmp-notes :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--chrome);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.05em 0.3em;
}

/*
 * Below 640px there is no side-by-side to preserve, so the panes stack and
 * the expand control retires rather than becoming a no-op the reader can
 * still click.
 */
@media (max-width: 640px) {
  .cmp,
  .cmp-wrap:has([data-state='left']:checked) .cmp,
  .cmp-wrap:has([data-state='right']:checked) .cmp {
    grid-template-columns: 1fr;
  }

  .cmp-exp {
    display: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cmp {
    transition: none;
  }
}
</style>
