<script setup lang="ts">
/**
 * /keywords — the current release.
 *
 * A thin route on purpose: the page itself is <KeywordReference>, which
 * /keywords/<version> renders too. The only difference is where the data
 * comes from — here it is the build-time import, there it is that version's
 * own chunk.
 */
const data = useKeywordIndex()
</script>

<template>
  <KeywordReference :data="data" />
</template>
