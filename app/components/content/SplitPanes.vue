<script setup lang="ts">
/**
 * Two panes side by side, either of which can be expanded to 75%.
 *
 * Generic: the panes hold whatever you put in them. Code blocks were only the
 * first use — a screenshot beside prose, a before and after, two tables.
 *
 * ::split-panes{left="Before" right="After"}
 * #left
 * Any Markdown, including a code block.
 * #right
 * Any Markdown.
 * ::
 *
 * Deliberately not a draggable divider: one interaction model on every screen
 * size, keyboard-operable natively, and no pointer-drag code. It is three
 * radios plus a grid-template-columns transition, so it works with JavaScript
 * disabled. The narrow pane is never hidden — keeping both visible is the
 * point — it keeps its own scroll instead.
 */
withDefaults(
  defineProps<{
    /** Optional labels; without them the panes carry no header. */
    left?: string
    right?: string
    /** Facts shown beneath, as a row of small caps. */
    notes?: string[]
  }>(),
  { notes: () => [] },
)

const uid = useId()
</script>

<template>
  <div class="split">
    <input :id="`${uid}-even`" class="split-radio" data-state="even" type="radio" :name="uid" checked>
    <input :id="`${uid}-left`" class="split-radio" data-state="left" type="radio" :name="uid">
    <input :id="`${uid}-right`" class="split-radio" data-state="right" type="radio" :name="uid">

    <div class="split-grid">
      <section class="split-pane" data-side="left">
        <header v-if="left || $slots.left" class="pane-head">
          <span class="pane-label">{{ left }}</span>
          <span class="pane-controls">
            <label class="pane-exp go" :for="`${uid}-left`" title="Expand this pane">⤢</label>
            <label class="pane-exp back" :for="`${uid}-even`" title="Restore both panes">⤡</label>
          </span>
        </header>
        <div class="pane-body"><slot name="left" /></div>
      </section>

      <section class="split-pane" data-side="right">
        <header v-if="right || $slots.right" class="pane-head">
          <span class="pane-label">{{ right }}</span>
          <span class="pane-controls">
            <label class="pane-exp go" :for="`${uid}-right`" title="Expand this pane">⤢</label>
            <label class="pane-exp back" :for="`${uid}-even`" title="Restore both panes">⤡</label>
          </span>
        </header>
        <div class="pane-body"><slot name="right" /></div>
      </section>
    </div>

    <ul v-if="notes.length" class="split-notes">
      <li v-for="note in notes" :key="note">{{ note }}</li>
    </ul>
  </div>
</template>

<style scoped>
.split-radio {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
  align-items: start;
  transition: grid-template-columns 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Selected by data-state, because the ids are per-instance. */
.split:has([data-state='left']:checked) .split-grid {
  grid-template-columns: 3fr 1fr;
}

.split:has([data-state='right']:checked) .split-grid {
  grid-template-columns: 1fr 3fr;
}

/* Panes must be allowed to shrink, or the grid ratio is ignored. */
.split-pane {
  min-width: 0;
}

.pane-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding-bottom: var(--sp-2);
  margin-bottom: var(--sp-2);
  border-bottom: 1px solid var(--line);
}

.pane-label {
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

.pane-controls {
  margin-left: auto;
  display: flex;
  gap: var(--sp-1);
}

.pane-exp {
  font-family: var(--font-display);
  font-size: var(--step--2);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  color: var(--dim);
  padding: 0.1rem 0.4rem;
  cursor: pointer;
  display: none;
}

.pane-exp:hover {
  color: var(--ink);
  border-color: var(--ink);
}

/*
 * A pane that is already expanded offers "restore"; every other pane offers
 * "expand". A label's `for` is static, so both are rendered and CSS picks one.
 */
.split:has([data-state='even']:checked) .pane-exp.go,
.split:has([data-state='left']:checked) [data-side='left'] .pane-exp.back,
.split:has([data-state='left']:checked) [data-side='right'] .pane-exp.go,
.split:has([data-state='right']:checked) [data-side='right'] .pane-exp.back,
.split:has([data-state='right']:checked) [data-side='left'] .pane-exp.go {
  display: inline-flex;
}

/*
 * A radio group exposes only its checked member to the tab order and moves
 * between members with the arrow keys. At rest that member is `even`, whose
 * own label is display:none — so ring every rendered control instead, and the
 * indicator lands on what is actually on screen.
 */
.split:has(.split-radio:focus-visible) .pane-exp {
  outline: 2px solid var(--red);
  outline-offset: 2px;
}

.pane-body :deep(> :first-child) {
  margin-top: 0;
}

.split-notes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-8);
  margin: var(--sp-4) 0 0;
  padding: var(--sp-3) 0 0;
  list-style: none;
  border-top: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.12em;
  color: var(--faint);
  text-transform: uppercase;
}

/*
 * Below 640px there is no side-by-side to preserve, so the panes stack and the
 * control retires rather than becoming a no-op the reader can still click.
 */
@media (max-width: 640px) {
  .split-grid,
  .split:has([data-state='left']:checked) .split-grid,
  .split:has([data-state='right']:checked) .split-grid {
    grid-template-columns: 1fr;
  }

  .pane-exp {
    display: none !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .split-grid {
    transition: none;
  }
}
</style>
