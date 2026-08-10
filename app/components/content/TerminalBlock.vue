<script setup lang="ts">
/**
 * <Terminal> for Markdown authors.
 *
 * ::terminal-block
 * ---
 * sessions:
 *   - shell: bash
 *     steps:
 *       - command: pip install robotframework-browser
 *         output: [Successfully installed]
 * ---
 * ::
 */
import type { TerminalSession } from '~/components/Terminal.vue'

const props = defineProps<{ sessions: TerminalSession[]; title?: string }>()

/*
 * Version tokens are resolved here, not before the content reaches the
 * renderer. Nuxt Studio serialises whatever object is handed to
 * <ContentRenderer> straight back to the file, so a resolved copy passed in
 * from above gets written to disk and the tokens are lost. Resolving inside the
 * component keeps `%%browser%%` in the source and in everything Studio sees.
 * See app/utils/version-tokens.ts.
 */
const shown = computed(() => resolveTokens(props.sessions))
</script>

<template>
  <Terminal :sessions="shown" :title="title" />
</template>
