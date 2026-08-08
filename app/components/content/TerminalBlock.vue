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

defineProps<{ sessions: TerminalSession[]; title?: string }>()
</script>

<template>
  <Terminal :sessions="sessions" :title="title" />
</template>
