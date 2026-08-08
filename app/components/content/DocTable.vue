<script setup lang="ts">
/** A table authored in Markdown frontmatter, so wide tables stay readable in source. */
defineProps<{ head: string[]; rows: string[][] }>()
</script>

<template>
  <div class="scroll-x">
    <table class="doc-table">
      <thead><tr><th v-for="h in head" :key="h">{{ h }}</th></tr></thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td v-for="(cell, j) in row" :key="j" v-html="cell.replace(/`([^`]+)`/g, '<code>$1</code>')" />
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
