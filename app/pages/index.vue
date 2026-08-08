<script setup lang="ts">
import type { EditorFile } from '~/components/Editor.vue'
import type { TerminalSession } from '~/components/Terminal.vue'

/**
 * The landing page. High level only.
 *
 * The voice is the one the project already had: "Robot Framework deserves a
 * browser automation solution that's designed for the 2020s", the three
 * pillars of speed, reliability and visibility, and "Use. Benefit.
 * Contribute." It sells the library on its own merits.
 *
 * Nothing here argues against another tool. The reasoning lives on /why and
 * the evidence in the comparisons beneath it — a landing page that opens by
 * positioning against SeleniumLibrary is picking a fight with a sibling
 * project on its own front page.
 */
const { index, version } = useKeywordIndex()

const install: TerminalSession[] = [
  {
    shell: 'bash',
    steps: [
      {
        command: 'pip install robotframework-browser',
        output: [`Successfully installed robotframework-browser-${version}`],
      },
      {
        command: 'rfbrowser init',
        output: ['Installing Playwright browser binaries…'],
        status: [
          { ok: true, text: 'chromium   downloaded' },
          { ok: true, text: 'firefox    downloaded' },
          { ok: true, text: 'webkit     downloaded' },
        ],
      },
    ],
  },
  {
    shell: 'powershell',
    steps: [
      {
        command: 'py -m pip install robotframework-browser',
        output: [`Successfully installed robotframework-browser-${version}`],
      },
      {
        command: 'py -m Browser.entry init',
        output: ['Installing Playwright browser binaries…'],
        status: [
          { ok: true, text: 'chromium   downloaded' },
          { ok: true, text: 'firefox    downloaded' },
          { ok: true, text: 'webkit     downloaded' },
        ],
      },
    ],
  },
]

const firstTest: EditorFile[] = [
  {
    name: 'first.robot',
    lang: 'robot',
    code: `*** Settings ***
Library     Browser

*** Test Cases ***
Search Robot Framework
    New Page      https://robotframework.org
    Fill Text     css=input[type="search"]    browser
    Keyboard Key  press    Enter
    Get Text      body    *=    Browser`,
  },
]

const run: TerminalSession[] = [
  {
    shell: 'bash',
    steps: [
      {
        command: 'robot first.robot',
        output: ['=========================================================', 'First'],
        status: [{ ok: true, text: 'Search Robot Framework' }],
      },
      // Output only — no command, so no bare prompt is rendered.
      { output: ['1 test, 1 passed, 0 failed'] },
    ],
  },
]

/** The three pillars the project has always led with. */
const pillars = [
  {
    name: 'Speed',
    body: 'One Node process drives Chromium, Firefox and WebKit. No driver binary per browser, no version to keep in step with an update.',
  },
  {
    name: 'Reliability',
    body: 'Every action waits for the element to be actionable before it acts. No sleeps to tune, and no flake to chase down.',
  },
  {
    name: 'Visibility',
    body: 'Video, a Playwright trace and a screenshot on failure, attached to the Robot Framework log.',
  },
]

/** The feature list, in the project's own words. */
const features = [
  'Conscientious assertions',
  'Precise and fast browser window and tab control',
  'Chainable selector strategies',
  'Good shadow DOM support',
  'Simple descriptors for mobile devices',
  'Sending HTTP requests',
]

useHead({
  title: 'Robot Framework Browser — modern web automation, powered by Playwright',
  meta: [
    {
      name: 'description',
      content:
        'A browser automation library for Robot Framework, powered by Playwright. Speed, reliability and visibility, with assertions built into the keywords.',
    },
  ],
})
</script>

<template>
  <div>
    <SiteHeader />

    <!-- ---------- hero ---------- -->
    <section class="hero">
      <img class="mark" src="/logo/browser.svg" alt="" width="1664" height="1219">
      <div class="hero-text">
        <h1>Browser automation<br>that doesn't flake.</h1>
        <p class="lede">
          Robot Framework deserves a browser automation solution designed for the 2020s. Browser
          library, powered by
          <a href="https://playwright.dev/" rel="noopener noreferrer" target="_blank">Playwright</a>,
          provides speed, reliability and visibility.
        </p>
        <div class="cta">
          <NuxtLink class="btn primary" to="#start">Get started</NuxtLink>
          <NuxtLink class="btn" to="/why">Why Browser</NuxtLink>
        </div>
        <ul class="stats">
          <li><b>{{ index.length }}</b> keywords</li>
          <li><b>3</b> engines</li>
          <li><b>0</b> sleeps</li>
          <li><b>Apache 2.0</b></li>
        </ul>
      </div>
    </section>

    <!-- ---------- three pillars ---------- -->
    <section class="pillars-section">
      <p class="label">What you get</p>
      <h2>Speed, reliability and visibility.</h2>

      <div class="pillars">
        <article v-for="p in pillars" :key="p.name" class="pillar">
          <h3>{{ p.name }}</h3>
          <p>{{ p.body }}</p>
        </article>
      </div>

      <ul class="features">
        <li v-for="f in features" :key="f">{{ f }}</li>
      </ul>

      <p class="more">
        <NuxtLink to="/why">How it works, and how it compares</NuxtLink>
      </p>
    </section>

    <!-- ---------- getting started ---------- -->
    <section id="start" class="start">
      <p class="label">Quick start</p>
      <h2>Running in five minutes.</h2>
      <p class="section-lede">
        Three blocks. Copy them in order and you have a passing test — nothing to configure in
        between.
      </p>

      <ol class="steps">
        <li>
          <div class="step-head"><span class="n">01</span><h3>Install the library and the browsers</h3></div>
          <p>
            <code>rfbrowser init</code> downloads the browser binaries Playwright drives. The tabs
            below pick your shell automatically.
          </p>
          <Terminal :sessions="install" />
        </li>

        <li>
          <div class="step-head"><span class="n">02</span><h3>Write a test</h3></div>
          <p>
            One import, no setup keyword, no explicit waits. <code>Get Text</code> both reads the
            value and asserts it.
          </p>
          <Editor :files="firstTest" />
        </li>

        <li>
          <div class="step-head"><span class="n">03</span><h3>Run it</h3></div>
          <p>Robot Framework as usual — the browser opens, acts and closes.</p>
          <Terminal :sessions="run" />
        </li>
      </ol>

      <p class="next">
        Next: the <NuxtLink to="/docs/start/getting-started">getting-started guide</NuxtLink>, or the
        <NuxtLink to="/keywords">keyword reference</NuxtLink>.
      </p>
    </section>

    <!-- ---------- community ---------- -->
    <section class="community">
      <p class="label">Community</p>
      <h2>Use. Benefit. Contribute.</h2>
      <p class="section-lede">
        Browser library is built in the open by the Robot Framework community. Questions, ideas and
        bug reports are how most contributors started, and how the library got this far.
      </p>
      <div class="links">
        <a class="btn" href="https://forum.robotframework.org/c/libraries/browser" rel="noopener noreferrer" target="_blank">Forum</a>
        <a class="btn" href="https://github.com/MarketSquare/robotframework-browser" rel="noopener noreferrer" target="_blank">GitHub</a>
        <a class="btn" href="https://github.com/MarketSquare/robotframework-browser/issues" rel="noopener noreferrer" target="_blank">Issues</a>
      </div>
      <p class="closing">Let's make the best Browser library.</p>
    </section>
  </div>
</template>

<style scoped>
section {
  padding: var(--sp-16) var(--gutter);
  border-bottom: 1px solid var(--line);
}

h2 {
  font-size: var(--step-3);
}

h3 {
  font-size: var(--step-1);
}

.section-lede {
  color: var(--dim);
  font-size: var(--step-1);
  max-width: var(--measure);
  margin-top: var(--sp-3);
}

/* ---------- hero ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 22rem) minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  padding-block: clamp(3rem, 8vw, 6rem);
  background: var(--panel);
}

.mark {
  width: 100%;
  height: auto;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

h1 {
  font-size: clamp(2rem, 5.5vw, 3.5rem);
  line-height: 1.08;
}

.lede {
  font-size: var(--step-1);
  color: var(--dim);
  max-width: 48ch;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-top: var(--sp-2);
}

.btn {
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  padding: var(--sp-3) var(--sp-6);
  border: 1px solid var(--ink);
  color: var(--ink);
  border-radius: var(--radius-sm);
  border-bottom-width: 1px;
}

.btn:hover {
  background: var(--ink);
  color: var(--paper);
}

.btn.primary {
  background: var(--red);
  border-color: var(--red);
  color: var(--panel);
}

.btn.primary:hover {
  background: var(--red-text);
  border-color: var(--red-text);
  color: var(--panel);
}

.stats {
  list-style: none;
  padding: var(--sp-4) 0 0;
  margin: var(--sp-2) 0 0;
  border-top: 1px solid var(--line);
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-8);
  font-family: var(--font-display);
  font-size: var(--step--2);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--faint);
}

.stats b {
  color: var(--ink);
  font-weight: 400;
}

/* ---------- pillars ---------- */
.pillars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--sp-4);
  margin-top: var(--sp-8);
}

.pillar {
  background: var(--panel);
  border: 1px solid var(--line);
  border-top: 2px solid var(--green);
  border-radius: var(--radius);
  padding: var(--sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.pillar h3 {
  font-family: var(--font-display);
  font-size: var(--step-2);
}

.pillar p {
  color: var(--dim);
}

.features {
  list-style: none;
  padding: 0;
  margin: var(--sp-8) 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 0 var(--sp-8);
  max-width: 62rem;
}

.features li {
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line);
  display: flex;
  gap: var(--sp-3);
  align-items: baseline;
}

.features li::before {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  flex: none;
  background: var(--red);
}

.more {
  margin-top: var(--sp-8);
}

/* ---------- quick start ---------- */
.steps {
  list-style: none;
  padding: 0;
  margin: var(--sp-8) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-12);
  max-width: 58rem;
}

.steps li {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.step-head {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
}

.step-head .n {
  font-family: var(--font-display);
  color: var(--red-text);
  font-size: 0.9rem;
}

.steps p {
  color: var(--dim);
  max-width: var(--measure);
}

.next {
  margin-top: var(--sp-12);
  color: var(--dim);
}

/* ---------- community ---------- */
.community {
  border-bottom: 0;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-top: var(--sp-6);
}

.closing {
  margin-top: var(--sp-8);
  font-family: var(--font-display);
  font-size: var(--step-1);
  color: var(--ink);
}

@supports (corner-shape: bevel) {
  .btn,
  .pillar {
    corner-shape: bevel;
  }
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .mark {
    max-width: 15rem;
  }
}
</style>
