<script setup lang="ts">
/** A table authored in Markdown frontmatter, so wide tables stay readable in source. */
const props = defineProps<{ head: string[]; rows: string[][] }>()

/*
 * Cells are YAML, and an unquoted scalar containing ": " is a *mapping* to a
 * YAML parser, not a string — so a cell reading
 *
 *     - Detected by `@media (pointer: coarse)`
 *
 * arrives here as an object and the page 500s with "src.replace is not a
 * function", naming neither the file nor the cell. Checking here turns that
 * into a message that says what to do.
 */
function cellText(cell: unknown, row: number, col: number): string {
  if (typeof cell === 'string') return cell
  throw new TypeError(
    `doc-table cell [${row}][${col}] is ${typeof cell}, not a string: ${JSON.stringify(cell)}. `
    + 'A YAML scalar containing ": " parses as a mapping — wrap the cell in double quotes.',
  )
}
</script>

<template>
  <div class="scroll-x">
    <table class="doc-table">
      <thead><tr><th v-for="h in props.head" :key="h">{{ h }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, i) in props.rows" :key="i">
          <!-- Cells come from YAML, so Markdown in them is inert until we render it. -->
          <td v-for="(cell, j) in row" :key="j" v-html="inlineMarkdown(cellText(cell, i, j))" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.doc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
  min-width: 30rem;
}

.doc-table th {
  text-align: left;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  border-bottom: 1px solid var(--line-strong);
  padding: 0 var(--sp-4) var(--sp-2) 0;
}

.doc-table td {
  padding: var(--sp-2) var(--sp-4) var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  vertical-align: baseline;
}

.doc-table :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--chrome);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.05em 0.3em;
}
</style>
