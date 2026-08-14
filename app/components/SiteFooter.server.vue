<script setup lang="ts">
/**
 * Where to go when this site does not have the answer.
 *
 * Three links only, and all three leave: the project itself, the packages, and
 * the Libdoc page the keyword reference here is generated from. Site navigation
 * belongs in the header — repeating it down here would just be a second menu.
 *
 * Rendered from app.vue rather than added to each page, so it cannot be missing
 * from the one route somebody forgets.
 *
 * A SERVER COMPONENT: three links and two inline SVGs, none of it interactive.
 * As an ordinary component it shipped its markup, its styles and both marks to
 * every page's client bundle and pushed it 2 KB over budget. As an island it is
 * HTML and nothing else.
 */
const LIBDOC = 'https://marketsquare.github.io/robotframework-browser/Browser.html'
</script>

<template>
  <footer class="site-footer">
    <nav class="links" aria-label="Elsewhere">
      <a href="https://github.com/MarketSquare/robotframework-browser" rel="noopener">
        <GithubMark />
        <span>
          <b>GitHub</b>
          <small>Source, issues and releases</small>
        </span>
      </a>

      <a href="https://pypi.org/project/robotframework-browser/#history" rel="noopener">
        <PypiMark />
        <span>
          <b>PyPI</b>
          <small>Every published release</small>
        </span>
      </a>

      <a :href="LIBDOC" rel="noopener">
        <RobotMark class="rf" />
        <span>
          <b>Libdoc</b>
          <small>The original keyword documentation</small>
        </span>
      </a>
    </nav>

    <p class="colophon">
      Robot Framework<sup>®</sup> is a trademark of the Robot Framework Foundation.
    </p>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--line);
  background: var(--chrome);
  padding: var(--sp-8) var(--gutter) var(--sp-10);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.links {
  display: grid;
  /* Three across where there is room, stacking on its own below ~34rem. */
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--sp-4);
  max-width: 62rem;
}

.links a {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--panel);
  color: var(--ink);
  border-bottom: 1px solid var(--line);
}

.links a:hover,
.links a:focus-visible {
  border-color: var(--line-strong);
}

/* The marks are set at 1em; give them the size of the label they precede. */
.links :deep(.mark),
.links :deep(.rf-mark) {
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.1rem;
  color: var(--dim);
  flex: none;
}

.links a:hover :deep(.mark),
.links a:hover :deep(.rf-mark) {
  color: var(--red);
}

.links span {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.links b {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 400;
}

.links small {
  color: var(--faint);
  font-size: 0.78rem;
}

.colophon {
  margin: 0;
  color: var(--faint);
  font-size: 0.75rem;
}

@supports (corner-shape: bevel) {
  .links a {
    corner-shape: bevel;
  }
}
</style>
