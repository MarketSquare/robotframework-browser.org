<script setup lang="ts">
import type { EditorFile } from '~/components/Editor.vue'

/**
 * Why Browser — the concepts, explained.
 *
 * This is where the reasoning lives. The landing page states what the library
 * gives you; this page explains how, and the comparisons underneath are the
 * evidence. Written for someone deciding, so every claim is followed by the
 * code that demonstrates it: a claim that could not be shown as code was cut.
 */
const { data: tools } = await useAsyncData('why-tools', async () =>
  import.meta.server ? await queryCollection('compare').all() : [],
)

interface Concept {
  id: string
  title: string
  body: string[]
  file: EditorFile
}

const concepts: Concept[] = [
  {
    id: 'waiting',
    title: 'Waiting is a property of the keyword, not your problem',
    body: [
      'Before it acts, every keyword waits for the element to be actionable: attached to the DOM, visible, stable — not animating — enabled, and not covered by something else. Only then does it click or type.',
      'This is why there is no Sleep in a Browser suite, and no Wait Until Element Is Visible in front of every action. The waiting is not something you remember to add; it is what the keyword does.',
      'When it does time out, the failure names which of those conditions was never met.',
    ],
    file: {
      name: 'waiting.robot',
      lang: 'robot-repl',
      code: `# No Sleep. No Wait Until Element Is Visible.
Click       text=Sign in
Fill Text   id=search    robot`,
    },
  },
  {
    id: 'assertions',
    title: 'Getters assert, so one line replaces three',
    body: [
      'Every getter takes an optional operator and expected value. Get Text reads the text and checks it in the same call, and the assertion retries until the timeout, so a value that arrives late still passes.',
      'The failure message names the selector, the actual value and the expected one — you rarely need to re-run with logging to find out what happened.',
      'The operators cover the comparisons that matter: equality, containment, regular expressions, and numeric greater/less on keywords that return numbers.',
    ],
    file: {
      name: 'assertions.robot',
      lang: 'robot-repl',
      code: `Get Text            h1            ==        Welcome
Get Title           contains      Robot
Get Element Count   .row          >         3
Get Attribute       a#next  href  matches   /page/\\d+`,
    },
  },
  {
    id: 'selectors',
    title: 'Selectors chain, and cross boundaries CSS cannot',
    body: [
      'Strategies combine in a single string with >>. You can start from a text match and walk to a sibling, cross into an iframe, or pierce shadow DOM — without switching context first and switching back afterwards.',
      'A selector that is not obviously CSS or XPath is inferred: text in quotes is a text selector, a leading // is XPath. That keeps the common cases short without making the uncommon ones impossible.',
    ],
    file: {
      name: 'selectors.robot',
      lang: 'robot-repl',
      code: `Click     text=Sign in
Click     "Sign in" >> xpath=../input
Get Text  iframe#preview >>> h1
Get Text  css=my-widget >> css=button`,
    },
  },
  {
    id: 'architecture',
    title: 'One process for three engines',
    body: [
      'Browser talks to a single Node process, which drives Chromium, Firefox and WebKit through Playwright. There is no driver binary per browser to install, and no driver version to keep in step with a browser update.',
      'Practically, that means testing WebKit — and therefore Safari behaviour — costs you a keyword argument rather than a machine.',
      'The browser, context and page layers are separate, so a context can carry its own viewport, locale, geolocation, permissions or HTTP credentials without launching a new browser.',
    ],
    file: {
      name: 'engines.robot',
      lang: 'robot-repl',
      code: `New Browser    chromium    headless=True
New Browser    firefox
New Browser    webkit

New Context    viewport={'width': 390, 'height': 844}    locale=de-DE`,
    },
  },
  {
    id: 'evidence',
    title: 'A failure comes with a recording',
    body: [
      'Contexts can record video and a Playwright trace. On failure the library attaches them to the Robot Framework log alongside a screenshot, so a red build in CI comes with what the browser actually did rather than a stack trace.',
      'The trace is the useful one: it steps through the run with a DOM snapshot at each action.',
    ],
    file: {
      name: 'evidence.robot',
      lang: 'robot-repl',
      code: `New Context   tracing=True    videosPath=videos
New Browser   chromium
# On failure the trace and video land in the log.`,
    },
  },
]

useHead({
  title: 'Why Browser — Robot Framework Browser',
  meta: [
    {
      name: 'description',
      content:
        'How Browser library works: auto-waiting, assertions inside the getters, chainable selectors, one process for three engines — and how it compares to Cypress, Playwright and SeleniumLibrary.',
    },
  ],
})
</script>

<template>
  <div>
    <SiteHeader />

    <main class="main">
      <header class="head">
        <p class="label">Why Browser</p>
        <h1>What the library actually does.</h1>
        <p class="lede">
          Four ideas do most of the work: waiting belongs to the keyword, getters assert, selectors
          chain, and one process drives every engine. Each one below is followed by the code that
          shows it.
        </p>
      </header>

      <nav class="toc" aria-label="On this page">
        <a v-for="c in concepts" :key="c.id" :href="`#${c.id}`">{{ c.title }}</a>
      </nav>

      <section v-for="c in concepts" :id="c.id" :key="c.id" class="concept">
        <h2>{{ c.title }}</h2>
        <div class="concept-body">
          <div class="prose">
            <p v-for="(para, i) in c.body" :key="i">{{ para }}</p>
          </div>
          <Editor :files="[c.file]" :line-numbers="false" />
        </div>
      </section>

      <section id="compare" class="compare">
        <p class="label">Comparison</p>
        <h2>Let the code speak.</h2>
        <p class="lede">
          The same scenario written with Browser and with the other tool, side by side — the real
          files from this repository, highlighted. Facts underneath, no scores and no winner
          declared. You are deciding, not us.
        </p>

        <ul class="tools">
          <li v-for="tool in tools" :key="tool.slug">
            <NuxtLink :to="`/why/${tool.slug}`">
              <span class="name">Browser vs {{ tool.tool }}</span>
              <span class="tag">{{ tool.tagline }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.main {
  padding: var(--sp-12) var(--gutter) var(--sp-24);
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
  max-width: 74rem;
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

h1 {
  font-size: var(--step-4);
}

.lede {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
}

/* ---------- on this page ---------- */
.toc {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--line);
  max-width: var(--measure);
}

.toc a {
  padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--line);
  color: var(--dim);
  font-size: 0.9rem;
}

.toc a:hover {
  color: var(--ink);
}

/* ---------- a concept ---------- */
.concept {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  scroll-margin-top: 5rem;
  padding-top: var(--sp-6);
  border-top: 2px solid var(--green);
}

.concept h2 {
  font-size: var(--step-2);
  max-width: 28ch;
}

.concept-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.prose {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  color: var(--dim);
}

/* ---------- comparison ---------- */
.compare {
  margin-top: var(--sp-8);
  padding-top: var(--sp-6);
  border-top: 2px solid var(--red);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  scroll-margin-top: 5rem;
}

.compare h2 {
  font-size: var(--step-3);
}

.tools {
  list-style: none;
  padding: 0;
  margin: var(--sp-4) 0 0;
  border-top: 1px solid var(--line);
  max-width: 58rem;
}

.tools li {
  border-bottom: 1px solid var(--line);
}

.tools a {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4) 0;
  border-bottom: 0;
  color: var(--ink);
}

.tools a:hover .name {
  color: var(--red-text);
}

.name {
  font-family: var(--font-display);
  font-size: var(--step-1);
}

.tag {
  color: var(--dim);
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .concept-body {
    grid-template-columns: 1fr;
  }
}
</style>
