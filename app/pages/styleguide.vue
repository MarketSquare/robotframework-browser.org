<script setup lang="ts">
import type { EditorFile } from '~/components/Editor.vue'
import type { TerminalSession } from '~/components/Terminal.vue'

useHead({ title: 'Styleguide — Robot Framework Browser' })

/*
 * Gallery. Each entry renders a Markdown file and shows that same file's
 * source, so the documented usage cannot drift from the demonstrated output.
 */
const RAW = import.meta.glob('~/../content/gallery/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const sources = Object.fromEntries(
  Object.entries(RAW).map(([file, text]) => [
    file.split('/').pop()!.replace(/\.md$/, ''),
    // Frontmatter is metadata for the gallery, not part of the usage.
    text.replace(/^---\n[\s\S]*?\n---\n+/, '').trimEnd(),
  ]),
)

const { data: demos } = await useAsyncData('gallery', async () => {
  // Server, plus the client in dev — see app/utils/content-guard.md
  if (import.meta.server || import.meta.dev) {
    return await queryCollection('gallery').select('path', 'title', 'description', 'order').all()
  }
  return []
})

const gallery = computed(() =>
  [...(demos.value ?? [])]
    .sort((a, b) => a.order - b.order)
    .map(d => ({ ...d, slug: d.path.split('/').pop()!, source: sources[d.path.split('/').pop()!] ?? '' })),
)

const install: TerminalSession[] = [
  {
    shell: 'bash',
    steps: [
      {
        command: 'pip install robotframework-browser',
        output: ['Successfully installed robotframework-browser-20.2.0'],
      },
      {
        command: 'rfbrowser init',
        output: ['Installing Playwright browser binaries…'],
        status: [
          { ok: true, text: 'chromium 141.0   downloaded' },
          { ok: true, text: 'firefox  142.0   downloaded' },
          { ok: true, text: 'webkit    26.0   downloaded' },
        ],
      },
    ],
  },
  {
    shell: 'powershell',
    steps: [
      {
        command: 'py -m pip install robotframework-browser',
        output: ['Successfully installed robotframework-browser-20.2.0'],
      },
      {
        command: 'py -m Browser.entry init',
        output: ['Installing Playwright browser binaries…'],
        status: [
          { ok: true, text: 'chromium 141.0   downloaded' },
          { ok: true, text: 'firefox  142.0   downloaded' },
          { ok: true, text: 'webkit    26.0   downloaded' },
        ],
      },
    ],
  },
]

const testRun: TerminalSession[] = [
  {
    shell: 'bash',
    steps: [
      {
        command: 'robot --variable BROWSER:chromium --outputdir results/ci --loglevel DEBUG --include smokeANDweb login.robot',
        output: ['=========================================================', 'Login'],
        status: [
          { ok: true, text: 'Sign In' },
          { ok: false, text: "Sign In With Bad Password — 'h1' was 'Invalid login'" },
        ],
      },
    ],
  },
]

const files: EditorFile[] = [
  {
    name: 'login.robot',
    lang: 'robot',
    highlightLines: [7, 8],
    code: `*** Settings ***
Library    Browser

*** Test Cases ***
Sign In
    New Page      https://example.com/login
    \${user} =     Set Variable    admin
    Fill Text     id=user    \${user}
    Fill Secret   id=pass    $PASSWORD
    Click         text=Sign in
    Get Text      h1    ==    Welcome
`,
  },
  {
    name: 'test_login.py',
    lang: 'python',
    code: `from Browser import Browser

browser = Browser()

def test_sign_in():
    browser.new_page("https://example.com/login")
    browser.fill_text("id=user", "admin")
    browser.click("text=Sign in")
    browser.get_text("h1", "==", "Welcome")
`,
  },
]

const snippet: EditorFile = {
  name: 'Click',
  lang: 'robot-repl',
  code: `New Page      https://example.com/login
Click         text=Sign in
Get Text      h1    ==    Welcome
`,
}

const cmpLeft: EditorFile = {
  name: 'login.robot',
  lang: 'robot',
  code: `*** Settings ***
Library    Browser

*** Test Cases ***
Sign In
    New Page     https://example.com/login
    Fill Text    id=user    admin
    Get Text     h1    ==    Welcome
`,
}

const cmpRight: EditorFile = {
  name: 'login.spec.ts',
  lang: 'typescript',
  code: `import { test, expect } from '@playwright/test';

test('sign in', async ({ page }) => {
  await page.goto(
    'https://example.com/login'
  );
  await page.fill('#user', 'admin');
  await page.click('text=Sign in');
  await expect(
    page.locator('h1')
  ).toHaveText('Welcome');
});
`,
}

const surfaces = ['--paper', '--chrome', '--panel', '--line', '--line-strong']
const inks = ['--ink', '--dim', '--faint']
const brand = ['--red', '--red-text', '--red-soft', '--teal']
const plate = ['--term-bg', '--term-chrome', '--term-tab', '--term-line', '--term-ink', '--term-dim', '--term-faint', '--term-red', '--term-teal']
const syntax = ['--tok-sand', '--tok-amber', '--tok-violet']
</script>

<template>
  <div class="sg">
    <header class="sg-head">
      <img class="sg-logo" src="/logo/browser.svg" alt="Robot Framework Browser">
      <div class="sg-headtext">
        <p class="label">Styleguide</p>
        <h1>Every token, every component.</h1>
        <p class="sg-sub">
          The acceptance surface for the foundation phase. Tab switching and pane expansion are
          CSS-only, so they work with JavaScript disabled.
        </p>
      </div>
      <ThemeToggle />
    </header>

    <!-- ---------- colour ---------- -->
    <section>
      <h2>Colour</h2>
      <p class="sg-note">
        Surfaces, ink and brand swap with the theme. The plate and syntax tokens deliberately do
        not — code is dark in both themes, so the syntax palette is defined once.
      </p>
      <div v-for="group in [
        { name: 'Surfaces', tokens: surfaces },
        { name: 'Ink', tokens: inks },
        { name: 'Brand', tokens: brand },
        { name: 'Plate (frozen)', tokens: plate },
        { name: 'Syntax (frozen)', tokens: syntax },
      ]" :key="group.name" class="sg-swatches">
        <p class="label">{{ group.name }}</p>
        <div class="sg-row">
          <div v-for="t in group.tokens" :key="t" class="sg-swatch">
            <span class="sg-chip" :style="{ background: `var(${t})` }" />
            <code>{{ t }}</code>
          </div>
        </div>
      </div>
    </section>

    <!-- ---------- type ---------- -->
    <section>
      <h2>Type</h2>
      <p class="sg-note">
        OCR-A sets headings, labels, chips and buttons only — never running text, never below 11px.
        IBM Plex Sans carries the reading; IBM Plex Mono carries code.
      </p>
      <div class="sg-type">
        <p class="label">OCR-A · display</p>
        <h1>Browser automation</h1>
        <h2>that doesn't flake</h2>
        <h3>Keyword reference</h3>
        <p class="label">IBM Plex Sans · body</p>
        <p>
          Clicks the element found by <code>selector</code>. Waits for the element to be actionable
          before clicking — visible, stable, enabled and not obscured by another element. No
          explicit sleep is required.
        </p>
        <p class="label">IBM Plex Mono · code</p>
        <p><code>Get Text    h1    ==    Welcome</code></p>
      </div>
    </section>

    <!-- ---------- terminal ---------- -->
    <section>
      <h2>Terminal</h2>
      <p class="sg-note">
        Literal shell only. The shell tabs preselect your own OS on load; picking one manually wins
        from then on. Prompts are excluded from selection, so a drag-copy yields runnable commands.
      </p>
      <Terminal :sessions="install" />
      <p class="label sg-gap">Pass and fail states, and a command too long to fit</p>
      <Terminal :sessions="testRun" />
    </section>

    <!-- ---------- editor ---------- -->
    <section>
      <h2>Editor</h2>
      <p class="sg-note">
        All code. Tab bar with a file glyph, line-number gutter, status strip, copy button — and no
        sidebar, minimap or window controls. Lines 7–8 show the marked-range treatment.
      </p>
      <Editor :files="files" />
      <p class="label sg-gap">Snippet, robot-repl grammar, no line numbers</p>
      <Editor :files="[snippet]" :line-numbers="false" />
    </section>

    <!-- ---------- component gallery ---------- -->
    <section id="components">
      <h2>Components</h2>
      <p class="sg-note">
        Every content component, rendered from a Markdown file and shown beside that same
        file's source. The two cannot disagree — they are the same text.
      </p>

      <nav class="sg-toc">
        <a v-for="d in gallery" :key="d.slug" :href="`#${d.slug}`">{{ d.title }}</a>
      </nav>

      <div class="sg-gallery">
        <GalleryItem
          v-for="d in gallery"
          :key="d.slug"
          :title="d.title"
          :description="d.description"
          :path="d.path"
          :source="d.source"
        />
      </div>
    </section>

    <!-- ---------- comparison ---------- -->
    <section>
      <h2>ComparisonSplit</h2>
      <p class="sg-note">
        Click ⤢ on either pane to expand it to 75%; ⤡ restores parity. The other side is never
        hidden. Below 640px the panes stack and the control retires.
      </p>
      <ComparisonSplit
        :left="cmpLeft"
        :right="cmpRight"
        :notes="['8 lines vs 12', 'assertion in the keyword vs separate expect', 'no scores']"
      />
    </section>
  </div>
</template>

<style scoped>
.sg {
  display: flex;
  flex-direction: column;
}

.sg-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-6);
  padding: var(--sp-12) var(--gutter) var(--sp-8);
  background: var(--panel);
  border-bottom: 1px solid var(--line);
  position: relative;
}

.sg-head::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -1px;
  width: 9rem;
  height: 2px;
  background: var(--red);
}

.sg-logo {
  width: min(190px, 34vw);
}

.sg-headtext {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.sg-sub {
  color: var(--dim);
  font-size: 0.95rem;
}

section {
  padding: var(--sp-12) var(--gutter);
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.sg-note {
  color: var(--dim);
  font-size: 0.92rem;
}

.sg-gap {
  margin-top: var(--sp-4);
}

.sg-swatches {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.sg-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.sg-swatch {
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  border: 1px solid var(--line);
  background: var(--panel);
  padding: var(--sp-1) var(--sp-2);
  font-size: 0.7rem;
}

.sg-chip {
  border-radius: 2px;
  width: 1rem;
  height: 1rem;
  display: block;
  border: 1px solid var(--line-strong);
}

.sg-type {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.sg-toc {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-4);
  padding: var(--sp-3) 0;
  border-block: 1px solid var(--line);
  font-size: 0.85rem;
}

.sg-gallery {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
  margin-top: var(--sp-6);
}
</style>
