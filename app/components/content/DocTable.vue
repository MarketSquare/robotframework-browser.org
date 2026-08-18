<script setup lang="ts">
/** A table authored in Markdown frontmatter, so wide tables stay readable in source. */
const props = withDefaults(
  defineProps<{
    head: string[]
    rows: string[][]
    /**
     * Column indexes holding a single term — a rank, a selector prefix, a
     * keyword. They shrink to their content and never wrap, leaving the rest
     * of the row to the prose.
     *
     * Explicit rather than inferred. Treating an empty heading as "this is an
     * index column" seemed reasonable and was wrong: several tables use an
     * empty heading above a column of prose labels, and making those nowrap
     * pushed the table past the screen.
     */
    nowrap?: number[]
  }>(),
  { nowrap: () => [] },
)

/** Shrink-to-content columns; everything else shares what is left. */
const tight = (col: number) => props.nowrap.includes(col)

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
/*
 * Version tokens resolve here rather than before the content reaches the
 * renderer: Nuxt Studio writes whatever <ContentRenderer> is handed straight
 * back to the file, so resolving above it destroys the tokens in the source.
 * See app/utils/version-tokens.ts.
 */
function cellText(cell: unknown, row: number, col: number): string {
  if (typeof cell === 'string') return resolveTokenString(cell)
  throw new TypeError(
    `doc-table cell [${row}][${col}] is ${typeof cell}, not a string: ${JSON.stringify(cell)}. `
    + 'A YAML scalar containing ": " parses as a mapping — wrap the cell in double quotes.',
  )
}
</script>

<template>
  <div class="scroll-x">
    <table class="doc-table">
      <thead>
        <tr>
          <!-- scope, or every cell in a table this size reads as unassociated. -->
          <th v-for="(h, j) in props.head" :key="j" scope="col" :class="{ tight: tight(j) }">
            {{ resolveTokenString(h) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in props.rows" :key="i">
          <!-- Cells come from YAML, so Markdown in them is inert until we render it. -->
          <!--
            A cell under an empty heading has no header to be associated with,
            so the whole table reads as unlabelled. Those columns are the row's
            subject anyway — a rank, a property — so they become row headers.
          -->
          <!--
            `:innerHTML`, not `v-html`, and the difference is not cosmetic.

            Vue's SSR compiler drops `v-html` on a dynamic `<component :is>`:
            the element renders, its content does not. The site is prerendered,
            so every cell in every table shipped as `<td></td>` — headers
            interpolated fine, and the tables looked deliberately empty rather
            than broken. It reached production. `:innerHTML` is the same
            operation as a plain prop and survives both renderers.

            Keep it a dynamic component: the `th`/`td` choice below carries the
            table's accessibility semantics, and splitting it into two branches
            duplicates every attribute on the row-header path.
          -->
          <component
            :is="props.head[j] === '' ? 'th' : 'td'"
            v-for="(cell, j) in row"
            :key="j"
            :scope="props.head[j] === '' ? 'row' : undefined"
            :class="{ tight: tight(j) }"
            :data-label="props.head[j] || null"
            :innerHTML="inlineMarkdown(cellText(cell, i, j))"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.doc-table {
  /*
   * No min-width. `min-width: 30rem` forced every table to 480px, so tables
   * that would have fitted a phone scrolled sideways regardless — which is
   * what this started as. Below 40rem the layout changes shape entirely; see
   * the media query at the end of this block.
   */
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

/*
 * A single-term column takes exactly the width of its longest term and no
 * more, leaving the rest of the row to the prose. Without this the browser
 * shares the width evenly and wraps `data-test-id=` across two lines while
 * the description column has room to spare.
 */
.doc-table :is(th, td).tight {
  width: 1%;
  white-space: nowrap;
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

/* Row headers are cells too, visually. */
.doc-table tbody th {
  font-weight: 400;
  text-align: left;
}

.doc-table :is(td, tbody th) {
  overflow-wrap: break-word;
  padding: var(--sp-2) var(--sp-4) var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  vertical-align: baseline;
}

/*
 * Code in a cell keeps its spaces and stays on one line, like everywhere else
 * (base.css). A cell is the tightest column on the page, so the span scrolls
 * inside itself rather than widening the table.
 */
.doc-table :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--chrome);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0.05em 0.3em;
}

/*
 * Narrow screens scroll; they do not restack.
 *
 * This used to break each row into a stack of labelled cells below 40rem. It
 * fitted, but it stopped being a table: rows could no longer be compared down a
 * column, which is the only reason these tables exist. A comparison table read
 * as a list of unrelated paragraphs.
 *
 * So the table keeps its shape at every width and the wrapper scrolls instead.
 * `min-width` is what forces that scroll — without it the columns squeeze to
 * one word per line and the table technically fits while being unreadable.
 */
@media (max-width: 40rem) {
  .doc-table {
    min-width: 34rem;
  }
}

</style>
