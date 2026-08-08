<script setup lang="ts">
/**
 * The core team, and the people who held it before.
 *
 * A server component so the contributor data never reaches the client — see
 * ContributorWall.server.vue, which imports the same file. Vite resolves both
 * to one module and neither is in a client chunk.
 *
 * ::core-team
 */
import data from '~/../content/contributors.json'

const { core, alumni } = data as unknown as {
  core: Person[]
  alumni: Person[]
}

interface Person {
  login: string
  name: string
  avatar: string
  profile: string
}
</script>

<template>
  <div class="team">
    <section class="group">
      <h3 class="group-name">Core team</h3>
      <p class="group-note">
        They review the pull requests, cut the releases and answer the hard
        questions. If you are wondering who decides, it is these two — in the
        open, on GitHub.
      </p>
      <ul class="row">
        <li v-for="p in core" :key="p.login">
          <a class="member" :href="p.profile">
            <img class="face" :src="p.avatar" alt="" width="88" height="88" loading="lazy" decoding="async">
            <span class="who">
              <span class="name">{{ p.name }}</span>
              <span class="login">@{{ p.login }}</span>
            </span>
          </a>
        </li>
      </ul>
    </section>

    <section class="group">
      <h3 class="group-name">Core team alumni</h3>
      <p class="group-note">
        Browser exists because they built it. Stepping back from the core team
        does not undo that, so they stay listed here.
      </p>
      <ul class="row">
        <li v-for="p in alumni" :key="p.login">
          <a class="member is-alum" :href="p.profile">
            <img class="face" :src="p.avatar" alt="" width="72" height="72" loading="lazy" decoding="async">
            <span class="who">
              <span class="name">{{ p.name }}</span>
              <span class="login">@{{ p.login }}</span>
            </span>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.team {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.group-name {
  font-family: var(--font-display);
  font-size: var(--step-1);
  font-weight: 400;
}

.group-note {
  color: var(--dim);
  max-width: 44rem;
}

.row {
  list-style: none;
  padding: 0;
  margin: var(--sp-2) 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
}

.member {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4) var(--sp-3) var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(var(--red), var(--red)) top left / 2px 100% no-repeat,
    var(--panel);
  color: var(--ink);
}

/* Alumni get the same card in the quieter accent — present, not foregrounded. */
.member.is-alum {
  background:
    linear-gradient(var(--teal), var(--teal)) top left / 2px 100% no-repeat,
    var(--panel);
}

.member:hover {
  border-color: var(--line-strong);
}

.face {
  border-radius: 50%;
  flex: none;
  background: var(--chrome);
}

.who {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.name {
  font-family: var(--font-display);
  font-size: 0.95rem;
}

.login {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--faint);
}

@supports (corner-shape: bevel) {
  .member {
    corner-shape: bevel;
  }
}
</style>
