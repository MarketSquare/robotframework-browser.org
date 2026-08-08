<script setup lang="ts">
import type { EditorFile } from '~/components/Editor.vue'
import type { TerminalSession } from '~/components/Terminal.vue'

/**
 * The landing page. Spec §6.1, D16.
 *
 * Written for Robot Framework users who do not use Browser yet — it assumes
 * keywords and suites are familiar, and assumes the reader is on
 * SeleniumLibrary. It does not explain what a keyword is.
 *
 * Every benefit shows the code. A claim that cannot be shown as code was cut.
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

/** Each benefit is a claim plus the code that demonstrates it. */
const benefits: { title: string; body: string; file: EditorFile }[] = [
  {
    title: 'Waiting is built in',
    body: 'Every keyword waits for the element to be actionable — attached, visible, stable, enabled and unobscured — before it acts. There is no sleep to tune and no wait keyword to remember.',
    file: {
      name: 'waiting.robot',
      lang: 'robot-repl',
      code: `# No Sleep. No Wait Until Element Is Visible.
Click       text=Sign in
Fill Text   id=search    robot`,
    },
  },
  {
    title: 'The assertion is part of the keyword',
    body: 'Getters take an operator and an expected value, so reading a value and checking it is one line instead of three. The failure message names the selector and both values.',
    file: {
      name: 'assertions.robot',
      lang: 'robot-repl',
      code: `Get Text       h1               ==       Welcome
Get Title      contains         Robot
Get Element Count   .row        >        3
Get Attribute  a#next    href   matches  /page/\\d+`,
    },
  },
  {
    title: 'One process drives three engines',
    body: 'Chromium, Firefox and WebKit are driven from a single Node process — no driver binary per browser, no version to keep in step with an update.',
    file: {
      name: 'engines.robot',
      lang: 'robot-repl',
      code: `New Browser    chromium    headless=True
New Browser    firefox
New Browser    webkit`,
    },
  },
  {
    title: 'Selectors that go where CSS cannot',
    body: 'Chain strategies with >>, cross into iframes and pierce shadow DOM without switching context first. Selectors read left to right, in one string.',
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
    title: 'Evidence when it fails',
    body: 'Video, a Playwright trace and a screenshot on failure, attached to the Robot Framework log. A failure in CI comes with a recording of what the browser actually did.',
    file: {
      name: 'evidence.robot',
      lang: 'robot-repl',
      code: `New Context   tracing=True    videosPath=videos
New Browser   chromium
# On failure, the trace and video land in the log.`,
    },
  },
]

useHead({
  title: 'Robot Framework Browser — browser automation that does not flake',
  meta: [
    {
      name: 'description',
      content:
        'A modern web automation library for Robot Framework, powered by Playwright. Auto-waiting on every action, assertions inside the keywords, and one process for Chromium, Firefox and WebKit.',
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
          A web automation library for Robot Framework, built on Playwright. Every action waits for
          the element to be ready, every getter can assert, and one process drives all three
          engines.
        </p>
        <div class="cta">
          <NuxtLink class="btn primary" to="#start">Get started</NuxtLink>
          <NuxtLink class="btn" to="/keywords">{{ index.length }} keywords</NuxtLink>
        </div>
        <ul class="stats">
          <li><b>{{ index.length }}</b> keywords</li>
          <li><b>3</b> engines</li>
          <li><b>0</b> sleeps</li>
          <li><b>Apache 2.0</b></li>
        </ul>
      </div>
    </section>

    <!-- ---------- why ---------- -->
    <section class="why">
      <p class="label">Coming from SeleniumLibrary</p>
      <h2>What changes.</h2>
      <p class="section-lede">
        Your suites, variables, tags, reporting and CI all stay. What changes is how much
        scaffolding a test needs to be reliable.
      </p>

      <div v-for="(b, i) in benefits" :key="b.title" class="benefit" :class="{ flip: i % 2 === 1 }">
        <div class="benefit-text">
          <h3>{{ b.title }}</h3>
          <p>{{ b.body }}</p>
        </div>
        <Editor :files="[b.file]" :line-numbers="false" />
      </div>
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
            <code>rfbrowser init</code> downloads the browser binaries Playwright drives. It picks
            your shell automatically below.
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
        Next: <NuxtLink to="/guides/getting-started">the full getting-started guide</NuxtLink>, or
        the <NuxtLink to="/keywords">keyword reference</NuxtLink>.
      </p>
    </section>

    <!-- ---------- compare ---------- -->
    <section class="compare">
      <p class="label">Comparison</p>
      <h2>See it beside the alternatives.</h2>
      <p class="section-lede">
        The same scenario written with Browser and with Cypress, Playwright and Selenium — the real
        files, side by side. Facts underneath, no scores.
      </p>
      <NuxtLink class="btn" to="/compare">Compare the code</NuxtLink>
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
  max-width: 46ch;
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

/* ---------- benefits ---------- */
.benefit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
  padding-top: var(--sp-12);
}

.benefit.flip .benefit-text {
  order: 2;
}

.benefit-text {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.benefit-text p {
  color: var(--dim);
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
}

.next {
  margin-top: var(--sp-12);
  color: var(--dim);
}

/* ---------- compare ---------- */
.compare {
  border-bottom: 0;
}

.compare .btn {
  align-self: flex-start;
  display: inline-block;
  margin-top: var(--sp-6);
}

@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .mark {
    max-width: 15rem;
  }

  .benefit,
  .benefit.flip .benefit-text {
    grid-template-columns: 1fr;
    order: 0;
  }
}
</style>
