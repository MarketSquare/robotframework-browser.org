<script setup lang="ts">
/**
 * The release a behaviour arrived in.
 *
 * `:since{version="20.4.0"}` renders "New in Browser 20.4.0".
 *
 * This is the one place a version number is typed by hand, and it is the
 * exception CONTRIBUTING.md documents. Everywhere else a version is a
 * `%%token%%` because it must track the library: a `docker pull` line or an
 * "compared against" note is wrong the moment a release lands.
 *
 * A landed-in version is the opposite kind of fact. It is historical, like a
 * release note — the argument conversion arrived in 20.4.0 and always will
 * have — and substituting the current version for it would turn a true
 * statement into a false one on the next release. `versions.spec.ts` exempts
 * what appears inside this component for exactly that reason, and fails the
 * build on a hand-typed version anywhere else.
 *
 * It answers the version skew the docs-split spec §6 names: a reader arrives
 * here from the Libdoc of whatever release they have installed, and needs to
 * know whether what they are reading applies to it.
 */
const props = defineProps<{
  /** A full release, as it appears on /releases — `20.4.0`, not `20.4`. */
  version: string
}>()
</script>

<template>
  <span class="since">New in Browser {{ props.version }}</span>
</template>

<style scoped>
.since {
  display: inline-block;
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--teal);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  padding: 0.1em var(--sp-2);
  white-space: nowrap;
}
</style>
