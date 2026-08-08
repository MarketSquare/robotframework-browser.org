<script setup lang="ts">
/**
 * Spec §7.3.
 *
 * The generated Libdoc HTML makes the argument *kinds* hard to distinguish —
 * `*varargs`, `**kwargs` and named-only arguments all read as plain names.
 * Getting that right is a concrete improvement over the page this replaces,
 * so the kind is rendered into the name itself and stated in a legend.
 */
import type { ResolvedArg } from '~/composables/useLibdoc'

const props = defineProps<{ args: ResolvedArg[] }>()

/** `*name` / `**name`, matching how it is written in a suite. */
function display(arg: ResolvedArg): string {
  if (arg.variadic === 'positional') return `*${arg.name}`
  if (arg.variadic === 'named') return `**${arg.name}`
  return arg.name
}

const hasNamedOnly = computed(() => props.args.some(a => a.namedOnly))
const hasVariadic = computed(() => props.args.some(a => a.variadic))
</script>

<template>
  <div v-if="props.args.length" class="args">
    <div class="scroll-x">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="arg in props.args" :key="arg.name">
            <td class="name">
              <span class="ident">{{ display(arg) }}</span>
              <span v-if="arg.required" class="req" title="Required">required</span>
              <span v-else-if="arg.namedOnly" class="named" title="Must be given by name">named only</span>
            </td>
            <td class="type">
              <NuxtLink v-if="arg.typeHref" :to="arg.typeHref">{{ arg.typeName }}</NuxtLink>
              <span v-else-if="arg.typeName">{{ arg.typeName }}</span>
              <span v-else class="none">—</span>
            </td>
            <td class="default">
              <code v-if="arg.defaultValue !== null">{{ arg.defaultValue }}</code>
              <span v-else class="none">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="hasNamedOnly || hasVariadic" class="legend">
      <span v-if="hasVariadic"><code>*name</code> takes any number of positional values<span v-if="hasNamedOnly">; </span></span>
      <span v-if="hasNamedOnly"><b>named only</b> arguments must be given as <code>name=value</code></span>
    </p>
  </div>
  <p v-else class="empty">This keyword takes no arguments.</p>
</template>

<style scoped>
.args {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

table {
  width: 100%;
  min-width: 26rem;
  font-size: 0.9rem;
}

th,
td {
  text-align: left;
  padding: var(--sp-2) var(--sp-4) var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  vertical-align: baseline;
}

th {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
  border-bottom-color: var(--line-strong);
}

.ident {
  font-family: var(--font-mono);
}

.name {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: baseline;
  border-bottom: 0;
}

.req,
.named {
  font-family: var(--font-display);
  font-size: 0.625rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--faint);
}

.req {
  color: var(--red-text);
}

.type {
  font-family: var(--font-mono);
  color: var(--teal);
}

.default code {
  font-family: var(--font-mono);
  color: var(--dim);
}

.none {
  color: var(--faint);
}

.legend {
  font-size: 0.8rem;
  color: var(--dim);
}

.legend b {
  font-weight: 400;
  color: var(--ink);
}

.empty {
  color: var(--dim);
  font-size: 0.9rem;
}
</style>
