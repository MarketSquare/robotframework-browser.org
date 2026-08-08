<script setup lang="ts">
useHead({ title: 'Robot Framework Browser' })
</script>

<template>
  <main class="home">
    <h1>Robot Framework Browser</h1>
    <p>Foundation scaffold. See <NuxtLink to="/styleguide">the styleguide</NuxtLink>.</p>
  </main>
</template>

<style scoped>
.home {
  padding: var(--sp-16) var(--gutter);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
