<script setup lang="ts">
/**
 * The argument table of a keyword panel, and of the library import under
 * Importing — the same shape, so the same markup. Styled globally from
 * keywords.css (`table.args`).
 *
 * Rendered only from inside KeywordPanels.server.vue, so it never reaches the
 * client either.
 */
import type { ResolvedArg } from '~/composables/useLibdoc'

defineProps<{ args: ResolvedArg[] }>()

/** `*name` / `**name`, written the way it appears in a suite. */
function display(arg: ResolvedArg): string {
  if (arg.variadic === 'positional') return `*${arg.name}`
  if (arg.variadic === 'named') return `**${arg.name}`
  return arg.name
}
</script>

<template>
  <div class="scroll-x">
    <table class="args">
      <thead>
        <tr><th>Name</th><th>Default</th><th>Type</th></tr>
      </thead>
      <tbody>
        <!--
          From specversion 4 an argument carries its own description,
          lifted out of the docstring's `Arguments:` list. It gets a row
          of its own under the argument rather than a fourth column: the
          descriptions run to paragraphs, and a column would squeeze the
          name, default and type into a sliver on a phone.
        -->
        <template v-for="arg in args" :key="arg.name">
          <tr :class="{ 'has-doc': arg.doc }">
            <td class="a-name">
              <span class="ident">{{ display(arg) }}</span>
              <span v-if="arg.required" class="req">required</span>
              <span v-else-if="arg.namedOnly" class="named">named only</span>
            </td>
            <td class="a-default">
              <span v-if="arg.defaultValue !== null" class="eq">=</span>
              <code v-if="arg.defaultValue !== null">{{ arg.defaultValue }}</code>
            </td>
            <td class="a-type">
              <a v-if="arg.typeHref" :href="arg.typeHref">{{ arg.typeName }}</a>
              <span v-else-if="arg.typeName">{{ arg.typeName }}</span>
            </td>
          </tr>
          <tr v-if="arg.doc" class="a-doc-row">
            <!--
              The wrapper carries .doc, not the cell: .doc sets its own
              display, and a <td> that is not a table-cell drops out of
              the colspan and takes the row's rule with it.
            -->
            <td colspan="3" class="a-doc">
              <!-- eslint-disable-next-line vue/no-v-html -- sanitized at build in lib/libdoc.ts -->
              <div class="doc" v-html="arg.doc" />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
