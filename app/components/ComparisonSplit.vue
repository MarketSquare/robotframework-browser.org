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
  /** Structural observations shown beneath. Facts only — no scoring. */
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

    <ul v-if="props.notes?.length" class="cmp-notes">
      <li v-for="note in props.notes" :key="note">{{ note }}</li>
    </ul>
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

.cmp-notes {
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
