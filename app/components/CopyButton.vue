<script setup lang="ts">
const props = defineProps<{ text: string; label?: string }>()
const { copied, copy } = useCopy()
</script>

<template>
  <button
    type="button"
    class="plate-copy"
    :data-copied="copied"
    :aria-label="copied ? 'Copied' : (props.label ?? 'Copy to clipboard')"
    @click="copy(props.text)"
  >
    {{ copied ? 'COPIED' : 'COPY' }}
  </button>
</template>
