<script setup lang="ts">
/**
 * /keywords/<version> — the keyword reference for an older release, in this
 * design rather than as a link to the Libdoc page of the day.
 *
 * Prerendered for every version we hold data for, so this is a static page
 * like any other; the route exists to give each one a URL that can be linked,
 * bookmarked and shared.
 */
const route = useRoute()
const version = computed(() => String(route.params.version))

const { data } = await useAsyncData(`keywords-${version.value}`, async () => {
  /*
   * Server, plus the client in dev — see app/utils/content-guard.md.
   *
   * The glob is written inside the guard on purpose. Vite resolves it where it
   * stands, so keeping it here means the twelve version indexes are part of
   * the server build and are removed from the client one along with this
   * branch. Hoisting it to a composable put all 720 KB back into the client
   * graph — reachable JS went from 391 KB to 1050 KB.
   */
  if (import.meta.server || import.meta.dev) {
    const indexes = import.meta.glob('~/generated/index/*.json', { import: 'default' })
    const entry = Object.entries(indexes).find(([path]) => path.endsWith(`/${version.value}.json`))
    if (!entry) return null
    return (await entry[1]()) as KeywordIndex
  }
  /* In production the prerendered payload carries it. */
  return null
})

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'No documentation for that version', fatal: true })
}

/*
 * The current release is reachable both here and at /keywords, so say which
 * one is canonical rather than redirecting. A redirect would need a server,
 * and this site does not have one: /keywords/<latest> was a 404 with an empty
 * page for anyone who bookmarked or linked it.
 */
useHead(() => ({
  link: version.value === LATEST_VERSION
    ? [{ rel: 'canonical', href: 'https://robotframework-browser.org/keywords' }]
    : [],
}))
</script>

<template>
  <KeywordReference v-if="data" :data="data" />
</template>
