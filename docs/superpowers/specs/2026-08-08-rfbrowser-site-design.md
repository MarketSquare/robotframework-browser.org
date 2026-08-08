# robotframework-browser.org — Site Rebuild Design

**Date:** 2026-08-08
**Status:** Draft for review
**Scope:** Complete replacement of the public website, including a custom keyword-reference renderer.

---

## 1. Goal

Replace the current Vue 2 site with a statically generated, Markdown- and JSON-driven site that the community can edit by pull request, and make it the canonical keyword reference for the Browser library.

### Success criteria

1. A contributor can fix a typo or add a guide by editing one Markdown file in a pull request — no local build, no committed bundle.
2. Every one of the 151 keywords has its own deep-linkable URL in our own design.
3. The site builds to static files and deploys to GitHub Pages with no backend and no runtime API.
4. A first-time visitor can get from the landing page to a running test in under five minutes.

### Non-goals

- No CMS, no server, no database.
- No internationalisation.
- Not replacing the generated Libdoc HTML (it keeps being produced — see §10).
- Not redrawing the logo (recolour only — see §5.1).

---

## 2. Decisions

Every choice below is settled. Changing one means revisiting this document.

| # | Decision | Choice |
|---|---|---|
| D1 | Framework | Nuxt 4 + Nuxt Content 3, fully prerendered |
| D2 | Hosting | GitHub Pages, deployed by GitHub Action |
| D3 | Repository | **New repo**, cut over by moving the CNAME when ready |
| D4 | Keyword docs | Custom renderer over Libdoc JSON; site becomes canonical |
| D5 | Versions | Latest prerendered; older versions fetched client-side on demand |
| D6 | Libdoc delivery | CI in the library repo opens a PR into the site repo on release |
| D7 | Visual direction | **L1 "Paper"** — warm off-white ground, light default |
| D8 | Docs layout | Direction B — left rail with counts, breadcrumb, chips, argument table, side cards |
| D9 | Display face | OCR-A, restricted to headings, labels, chips and buttons |
| D10 | Text face | IBM Plex Sans (400/600) |
| D11 | Code face | IBM Plex Mono (400) |
| D12 | Brand red | `#D63A2E` |
| D13 | Logo | Recolour to the new red; add a light-ground variant |
| D14 | Themes | Light default, designed dark theme via toggle |
| D15 | Content | Full content pass — existing copy rewritten, not just ported |
| D16 | Landing audience | Robot Framework users who do not use Browser yet |
| D17 | Comparison | Named tools, factual, no scoring — **evidence is code, not a matrix** |
| D18 | Analytics | Plausible (cookieless, no consent banner) |
| D19 | Old Libdoc HTML | Keep generating it; add a banner linking to the new docs |
| D20 | Search | Pagefind over prerendered output |
| D21 | Code blocks | `<Terminal>` for literal shell only; `<Editor>` (VS Code homage) for all code |
| D22 | RF grammars | Vendored from robotcode (Apache-2.0): full suite + repl variants |
| D23 | Comparison UX | Click-to-expand panes, 50/50 ↔ 75/25; no draggable divider |

---

## 3. Architecture

```
                 robotframework-browser (library repo)
                            │
                  release tag triggers workflow
                            │
                 libdoc → Browser-<version>.json
                            │
                    opens PR into site repo
                            ▼
  ┌──────────────────────── site repo ────────────────────────┐
  │  content/            Markdown + JSON, hand-authored        │
  │  content/libdoc/     Browser-<version>.json, machine-authored │
  │  examples/           real .robot / .py / .ts / .js sources  │
  │  app/                Nuxt app, components, design tokens    │
  └───────────────────────────┬───────────────────────────────┘
                              │  nuxt generate  (build time)
                              ▼
              static HTML + split JSON payloads + Pagefind index
                              │
                              ▼
                       GitHub Pages
```

Everything expensive happens at build time. The browser receives static HTML, a small per-keyword JSON payload, and a search index.

---

## 4. Routes

| Route | Source | Prerendered |
|---|---|---|
| `/` | `content/index.md` | yes |
| `/guides/` and `/guides/[slug]` | `content/guides/*.md` | yes |
| `/keywords/` | latest Libdoc JSON | yes |
| `/keywords/[keyword]` | latest Libdoc JSON | yes — 151 routes |
| `/keywords/types/[type]` | Libdoc `typedocs` | yes — 81 routes |
| `/compare/` | `content/compare/*.json` + `examples/` | yes |
| `/compare/[tool]` | one JSON per tool | yes |
| `/examples/` | `examples/**` read at build | yes |
| `/releases/` and `/releases/[version]` | `content/releases/*.md` | yes |
| `/community/` | `content/community.md` + `contributors.json` | yes |
| `/privacy` | `content/privacy.md` | yes |

Older keyword versions are **not** separate routes. `/keywords/[keyword]?v=12.4.0` re-renders the same components client-side from a fetched JSON file.

---

## 5. Design system

### 5.1 Logo

The existing `browser_lib_logo.svg` is kept as drawn. Two changes:

1. Recolour `#E2574C` → `#D63A2E` and `#D65348` → `#B82E24` (the darker red is the shadow tone). Re-check the greens `#2EAD33` / `#1D8D22` and the slate `#324E5B` still balance against the new red.
2. Produce a light-ground variant. The current mark fills `cls-1`, `cls-2` and `cls-3` with `#fff`, so it is invisible on paper — those become `#1A1815`.

The SVG also carries Inkscape metadata and references `OCRAStd` as a live font for the wordmark. Both are cleaned up: strip the editor metadata, convert the wordmark to outlines so it renders without the font installed.

**The logo appears large on the landing page** as the hero's anchor — see §6.1.

### 5.2 Colour tokens

Light is the default. Dark is a designed second theme, not an inversion. Every colour is a custom property; no component is ever painted from inside a media query.

```css
:root {
  --paper:        #FBFAF7;   /* page ground */
  --chrome:       #F3F1EC;   /* rails, table headers, insets */
  --panel:        #FFFFFF;   /* cards */
  --line:         #E2DED5;
  --line-strong:  #CFC9BC;
  --ink:          #1A1815;
  --dim:          #6E6860;
  --faint:        #948C80;
  --red:          #D63A2E;   /* brand, UI, large text */
  --red-text:     #B82E24;   /* red used as small body text */
  --red-soft:     #FBEBE9;
  --teal:         #0F7F76;   /* Robot Framework, structural */
  --term-bg:      #14120F;   /* code and terminal plates */
  --term-chrome:  #1C1A16;
  --term-line:    #2E2A24;
  --term-ink:     #EDE9E1;
  --term-dim:     #A39C90;
  --term-red:     #FF6B5E;
  --term-teal:    #3FC9BC;
}
```

Dark theme redefines only these tokens, under both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`:

```css
--paper: #14120F;  --chrome: #1C1A16;  --panel: #201D19;
--line:  #2E2A24;  --line-strong: #454038;
--ink:   #EDE9E1;  --dim: #A39C90;     --faint: #7A7266;
--red:   #FF6B5E;  --red-text: #FF6B5E; --red-soft: #2E1815;
--teal:  #3FC9BC;
/* --term-* are unchanged: code plates look identical in both themes */
```

**Contrast, measured.** `#D63A2E` on `#FBFAF7` is 4.59:1 — passes AA for normal text, but with no margin, so red body text uses `--red-text` (5.96:1). `#FF6B5E` on `#14120F` is 6.66:1; `#3FC9BC` on `#14120F` is 9.09:1.

That the `--term-*` tokens do not change between themes is deliberate: code plates are dark in both, so syntax colours are defined once and the two themes cannot drift apart.

### 5.3 Type

| Role | Face | Notes |
|---|---|---|
| Headings, labels, chips, buttons, section numbers | **OCR-A** | Never below 11px. Never for running text. Always with letter-spacing at small sizes. |
| Body, UI, tables | **IBM Plex Sans** 400/600 | Base 16px, line-height 1.65, measure 66ch |
| Code, terminal, argument values | **IBM Plex Mono** 400 | 13.5px in blocks, 0.92em inline |

Self-hosted as woff2, latin subset, ~80 KB total. No CDN request. `font-display: swap` on the text faces, `block` on OCR-A (a fallback-then-swap on a display face is very visible).

Scale: 11, 12, 13, 14, 16, 18, 24, 32, 44, 60 px. Spacing: 4px base — 4, 8, 12, 16, 24, 32, 48, 64, 96.

### 5.4 Two distinct block components

These get the most design attention, because the site alternates into them every few lines. Both are dark plates inset on the paper ground, but they are **different components with a strict usage rule** — the chrome tells the reader what kind of thing they are looking at before they read a character.

#### `<Terminal>` — literal terminal only

Used **only** for things actually typed at a shell: installing the library, `rfbrowser init`, running `robot`, CLI invocations. Never for code.

- Header: three dots in `--term-line`, title `bash` / `powershell` in OCR-A 11px.
- Lines prompt-prefixed with `$` in `--term-dim`; commands in `--term-ink`; output dimmed; `✓` in `--term-teal`, failures in `--term-red`.
- The `$` is **not selectable** (`user-select: none`), so copying a block copies runnable commands only.
- OS tabs where the command differs (`bash` / `PowerShell`).
- Not interactive, not animated by default. One optional typing animation is permitted on the landing page install block only, disabled under `prefers-reduced-motion`.

#### `<Editor>` — code examples

A **simplified homage to VS Code**, not a reproduction. It should read as "an editor" at a glance from its silhouette, using four cues and nothing more:

1. **Tab bar** — one tab per file or language variant. Active tab has a top accent border in `--red` and a lighter ground; inactive tabs are dimmed. A small monochrome file-type glyph precedes the filename (a simple pictogram set we draw ourselves — robot head for `.robot`, and marks for `.py`, `.ts`, `.js`). No coloured third-party icon fonts.
2. **Gutter** — line numbers in `--term-dim`, right-aligned, non-selectable so copy stays clean. Optional highlighted line ranges via `{3-5}` in the fence info string.
3. **Status strip** — a thin bottom bar, OCR-A 10px, showing language and line count. This is the detail that makes the homage land, and it costs almost nothing.
4. **Copy button** — top right, revealed on hover and always in the tab order; label flips to `COPIED` for 1.2s. No toast.

Deliberately excluded: no fake sidebar, no fake activity bar, no minimap, no window controls, no traffic lights. Those belong to `<Terminal>` or to nothing. The editor is chrome around code, not a screenshot of an IDE.

#### Syntax highlighting

Shiki at build time, zero client JS. Robot Framework grammars are **vendored from [robotcode](https://github.com/robotcodedev/robotcode/tree/main/syntaxes)** rather than written from scratch — they are Apache-2.0, the same licence as Browser, and they are maintained by people who do this full time.

Two grammars are registered as separate Shiki languages, and the correct one is chosen per block:

| File | Scope | Use for |
|---|---|---|
| `robotframework.tmLanguage.json` | `source.robotframework` | Complete suites — anything with `*** Settings ***` / `*** Test Cases ***`. Landing page, guides, examples, comparison. |
| `robotframework-repl.tmLanguage.json` | `source.robotframework-repl` | Bare keyword sequences with no section headers — keyword-reference snippets, inline fragments in guides. |

A third file in that directory, `codeblock_robotframework.tmLanguage.json`, is a *markdown injection* that delegates ` ```robot ` fences to `source.robotframework`. Shiki resolves languages itself, so it is not used — the fence language (`robot` vs `robot-repl`) selects the grammar directly.

Grammars are vendored into `app/syntaxes/` at a pinned commit, with attribution in `NOTICE`, and a scheduled job checks upstream for updates. **Verify at implementation time** whether `source.robotframework-repl` embeds `source.robotframework` scopes; if it does, both must be registered together or highlighting silently degrades to plain text.

### 5.5 Component inventory

`SiteHeader` · `ThemeToggle` · `VersionSwitcher` · `SearchDialog` · `Editor` · `Terminal` · `KeywordRail` · `KeywordCard` · `ArgumentTable` · `TypeCard` · `TagChip` · `Callout` · `ComparisonSplit` · `ContributorGrid` · `ContributionPath` · `Prose`

---

## 6. Pages

### 6.1 Landing — `/`

Written for **Robot Framework users who do not use Browser yet** (D16). It assumes RF knowledge and assumes the reader is on SeleniumLibrary. It does not explain what a keyword is.

Order:

1. **Hero.** The large recoloured logo is the anchor, set on a paper ground with the headline in OCR-A beside or beneath it. One sentence of positioning, one primary action (`GET STARTED`), one secondary (`KEYWORDS`).
2. **Benefits.** Four to six, each a concrete claim with evidence, not an adjective:
   - Auto-waiting on every action — no `Sleep`, no `Wait Until Element Is Visible` scaffolding
   - Assertions built into the keywords — `Get Text  h1  ==  Welcome` is one line, not three
   - One process drives Chromium, Firefox and WebKit
   - Selectors that chain across frames and shadow DOM
   - Faster and more stable than WebDriver in CI
   - Trace viewer and video on failure
   Each benefit shows the Browser code beside the equivalent it replaces. Claims that cannot be shown as code get cut.
3. **Getting started, inline.** Not a link — the actual path, on the landing page:
   - `<Terminal>` with `pip install robotframework-browser` then `rfbrowser init`
   - `<Editor>` with a complete, runnable first test
   - `<Terminal>` with `robot first.robot` and its passing output
   - Then a link to the full `/guides/getting-started`
   A reader must be able to copy three blocks and have a passing test without leaving `/`.
4. **Comparison teaser** — one code split, linking to `/compare`.
5. **Community strip** — contributor avatars, linking to `/community`.

### 6.2 Guides — `/guides/*`

Markdown with frontmatter, MDC so a guide can embed `<Editor>`, `<Terminal>` or a live `<KeywordCard>` inline. Launch set:

`getting-started` · `selectors` · `assertions` · `waiting-and-timeouts` · `ci-and-docker` · `migrating-from-seleniumlibrary` · `extending-with-plugins`

### 6.3 Keyword reference — `/keywords/*`

Direction B's layout (D8). Detailed in §7.

### 6.4 Comparison — `/compare/*`

**Let the code speak** (D17). The existing `examples/` directory already holds the right material: the same scenario written in Robot Framework Browser, Cypress, Playwright and Selenium.

Each tool page is a `<ComparisonSplit>` — the same test, side by side. Underneath, a short factual list of what differs structurally (auto-waiting, assertion syntax, setup required, lines of code). No scores, no winner, no adjectives. The reader decides.

**Both panes are fully syntax highlighted**, each in its own language: `robotframework` on the left; `typescript`, `javascript` or `python` on the right, from Shiki's bundled grammars. Both panes are `<Editor>` instances, so the comparison reads as two editors open side by side.

**Expansion.** Panes rest at 50/50. Clicking or tapping either expands it to 75% and shrinks the other to a 25% stub — clicking again restores parity. The other side is never fully hidden; keeping it visible is the entire point of the page.

- One interaction model on every screen size. No pointer-drag code, no separate mobile behaviour, no divider to make keyboard-accessible.
- Built as a radio-input + CSS-grid pattern (`grid-template-columns` transitions between `1fr 1fr`, `3fr 1fr` and `1fr 3fr`), so it is keyboard-operable natively, announces state to assistive tech, and **still works with JavaScript disabled**.
- The width transition respects `prefers-reduced-motion`.
- Below 640px the panes stack vertically at full width and the expand control becomes a no-op — at that width there is no side-by-side to preserve.

Line numbers are on in this component, since "the Browser version is 4 lines and the other is 11" is one of the strongest factual observations the page makes, and it should be countable rather than asserted.

The `.robot`, `.js`, `.ts` and `.py` sources are read from disk at build time — **the pasted Pygments HTML is deleted**. This is what kills the current drift between the runnable example and the shown example.

Per-tool JSON (`content/compare/cypress.json`) carries only the metadata: tool name, version compared against, source file paths, and the structural notes. The code is never duplicated into JSON.

### 6.5 Examples — `/examples`

The runnable sources, highlighted, grouped by topic, each with a copy button and a link to the file on GitHub.

### 6.6 Releases — `/releases/*`

`docs/releasenotes` ported to Markdown, newest first, with a version timeline.

### 6.7 Community — `/community`

Three jobs, in this order:

1. **How to contribute** — `<ContributionPath>` cards, each with a real first step and a direct link:
   - *Report a bug* → issue template link, plus what makes a good report for this project
   - *Suggest an idea* → discussion/issue link
   - *Improve the docs* → which file to edit, how docs are generated from docstrings, how to preview
   - *Open a pull request* → link to `CONTRIBUTING.md`, dev setup, how to run `utest` and `atest`
   - *Write a plugin* → links to the plugin documentation in the library repo, so the community can extend without waiting on the core team
2. **Contributor gallery** — all 206 contributors from `.all-contributorsrc`, rendered as `<ContributorGrid>`. Avatars come from `avatar_url`; they are **downloaded and resized at build time**, not hotlinked, because 206 live requests to `avatars.githubusercontent.com` would dominate page load. Grid is filterable by contribution type (`bug` 127, `ideas` 52, `code` 44, `doc` 16, and the rest). The contribution-type counts are themselves an argument for contributing — most people here started by filing a bug.
3. **Where to talk** — Slack, forum, GitHub Discussions. Sponsors.

`.all-contributorsrc` is consumed directly as the JSON source. No second copy.

---

## 7. The keyword docs engine

### 7.1 What the data actually is

Verified against a real generated file (RF 7.4.2, Browser 20.2.0, 0.83 MB):

```
specversion, name, doc, version, generated, type, scope,
docFormat, source, lineno, tags, inits[], keywords[], typedocs[]
```

- `keywords[]` — 151 entries: `name`, `args[]`, `returnType`, `doc`, `shortdoc`, `tags[]`, `source`, `lineno`
- `args[].type` — `{name, typedoc, nested[], union}`; `typedoc` is the join key into `typedocs[]`
- `args[].kind` — `POSITIONAL_OR_NAMED`, `VAR_POSITIONAL`, `NAMED_ONLY`, `VAR_NAMED`
- `typedocs[]` — 81 entries: `type` (`Enum` / `TypedDict` / `Standard` / `Custom`), `name`, `doc`, `usages[]`, `accepts[]`, and `members[]` for enums

Three consequences that shape the implementation:

**`docFormat` is `HTML`.** Keyword documentation arrives already rendered — `<p>`, `<code>`, `<ul>`, `<table>`. The renderer does **not** parse markup. It sanitizes the HTML against an allowlist and rewrites it: `<code>` gets our inline-code styling, `<pre>` blocks are re-highlighted through Shiki into `<Editor>` (using the `robotframework-repl` grammar — keyword-doc snippets are bare sequences, not suites), and keyword cross-references become internal links. (The current file contains no `href="#..."` anchors and no external links, so link rewriting is about *adding* cross-references, not fixing existing ones.)

**There is no group field.** Grouping is derived from `source` — the keyword's defining `.py` file — which yields exactly the 20 groups of the library's own module layout:

```
interaction 32 · getters 28 · playwright_state 23 · browser_control 16 ·
webapp_state 8 · cookie 5 · promises 5 · evaluation 4 · clock 4 ·
credential 4 · network 4 · waiter 4 · locator_handler 3 · coverage 3 ·
pdf 2 · device_descriptors 2 · crawling 1 · runonfailure 1 ·
assertion_formatter 1 · strict_mode 1
```

A hand-maintained `content/keyword-groups.json` maps each module filename to a display name and sort order (`interaction.py` → "Interaction", `playwright_state.py` → "Browser, Context & Page"). Any module missing from that map falls back to a title-cased filename and the build logs a warning — so a new module never silently disappears from the rail.

`tags` are cross-cutting, not hierarchical, and are surfaced as filter chips instead: `Setter` 84, `PageContent` 82, `Getter` 45, `BrowserControl` 40, `Assertion` 31, `Wait` 13, `Config` 7, and the long tail.

**Upstream bug found.** `Download` is tagged `Page Content` (with a space) while 82 other keywords use `PageContent`. This produces a spurious 14th tag. It is a one-character fix in the library; the site normalises tags defensively regardless.

### 7.2 Build-time transform

`nuxt generate` runs a transform over the JSON that emits, per version:

| Artifact | Contents | Size (approx) |
|---|---|---|
| `keywords/<slug>.json` | one keyword, resolved | 2–15 KB each |
| `index.json` | name, shortdoc, group, tags, arg count | ~40 KB |
| `types/<slug>.json` | one typedoc with resolved usages | small |

"Resolved" means the transform has already: joined `args[].type.typedoc` to its typedoc, sanitized and re-highlighted the `doc` HTML, computed the group from `source`, normalised tags, and built the reverse index of which keywords use which type.

The 0.83 MB source file is **never shipped to the browser**. A keyword page loads its own payload plus the shared index.

### 7.3 Keyword page

Per D8: breadcrumb · keyword name in OCR-A · tag chips · `shortdoc` as lede · full `doc` · `<ArgumentTable>` · `<Editor>` examples extracted from the doc · side cards for the resolved types and for "keywords that use this type" · a source link to the exact `source` + `lineno` on GitHub.

`<ArgumentTable>` shows name, type, default and required. Types link to `/keywords/types/[type]`. `VAR_POSITIONAL` renders as `*name`, `VAR_NAMED` as `**name`, `NAMED_ONLY` gets a marker — the current Libdoc HTML makes these hard to distinguish, and getting it right is a concrete improvement.

### 7.4 Version switching

Latest is prerendered. The switcher fetches `/libdoc/Browser-<version>/keywords/<slug>.json` and re-renders in place, setting `?v=`. If the keyword does not exist in that version, the page says so and offers the nearest version that has it. Older versions are `noindex`; latest is canonical.

### 7.5 Release automation

A workflow in the library repo, on release:

1. `libdoc Browser Browser-<version>.json` alongside the existing HTML generation
2. Commit it to the site repo on a branch and open a PR
3. PR body lists added, removed and signature-changed keywords versus the previous version — a human-readable diff of the public API
4. Merging triggers the site build

Backfilling the ~40 archived versions is a one-off script; it can run after launch, since D5 only requires latest at launch.

---

## 8. Content model

```
content/
  index.md                 landing copy and benefit blocks
  guides/*.md              frontmatter: title, description, order, updated
  compare/*.json           tool metadata + source file paths + structural notes
  releases/*.md            frontmatter: version, date
  community.md             contribution paths
  keyword-groups.json      module filename → display name, order
  privacy.md
  libdoc/
    Browser-<version>.json  machine-authored, PR'd in by CI
examples/                   real runnable sources, read at build time
```

Guides and releases are Markdown. Everything structured is JSON. Both are queryable through Nuxt Content the same way.

---

## 9. Search

Pagefind, indexing the prerendered HTML, so guides, keywords and comparison pages are all searchable from one dialog. Keyword hits are boosted and show `shortdoc` in the result. Opens on `/` and `⌘K`.

---

## 10. The existing Libdoc HTML

Per D19, `tasks.py` keeps generating `docs/Browser.html` exactly as today. Two changes:

1. It also emits `Browser-<version>.json`.
2. The generated HTML gets a banner: "A new keyword reference is available at robotframework-browser.org/keywords" — deep-linked to the equivalent keyword where the anchor allows it.

The dead Google Analytics injection (`UA-106835747-3`, which has collected nothing since Universal Analytics stopped processing in 2023) is removed from the generation code at the same time.

Nothing about existing inbound links breaks. Deprecation is revisited once traffic has moved.

---

## 11. Analytics and privacy

Plausible (D18). Cookieless, no personal data stored, so no consent banner. One script tag; it is the site's only third-party request. `privacypolicy.html` — currently 17 KB of Google Analytics boilerplate — is replaced by a short, honest `/privacy` describing Plausible, GitHub Pages access logs, and nothing else.

---

## 12. Accessibility and performance budgets

- WCAG 2.2 AA. Contrast values in §5.2 are measured, not assumed.
- Visible focus on every interactive element. The copy button and version switcher are keyboard-operable.
- `prefers-reduced-motion` disables the one landing-page typing animation.
- Budget: < 100 KB JS on the landing page, < 150 KB on a keyword page, fonts ~80 KB. Lighthouse ≥ 95 on performance and accessibility.
- Every page works with JavaScript disabled except version switching and search.

---

## 13. Phasing

This spec is too large for one implementation plan. It decomposes into four phases, each independently reviewable and each leaving the preview site in a working state:

| Phase | Delivers | Depends on |
|---|---|---|
| **P1 — Foundation** | New repo, Nuxt 4 + Content 3 scaffold, Pages deploy, design tokens (§5.2), fonts (§5.3), recoloured logo (§5.1), `Editor` / `Terminal` (§5.4), vendored robotcode grammars, theme toggle. Ends with a styleguide route proving every token and component. | — |
| **P2 — Keyword engine** | Build-time transform (§7.2), `/keywords` routes, `ArgumentTable`, `TypeCard`, version switching. The highest-risk phase; done second so it gets the most runway. | P1 |
| **P3 — Content surfaces** | Landing (§6.1), guides, comparison (§6.4), examples, releases, community (§6.7), Pagefind. Includes the full content pass (D15). | P1 |
| **P4 — Automation & cutover** | Release workflow (§7.5), Libdoc banner (§10), Plausible, avatar caching, CNAME move (§14). | P2, P3 |

P2 and P3 are independent and can run in parallel.

## 14. Cutover

Per D3, built in a new repo and switched at the end.

1. New repo, Nuxt scaffold, design system, deploying to its default `github.io` Pages URL.
2. Build components and the keyword engine against the current Libdoc JSON.
3. Full content pass (D15). Review happens on the preview URL.
4. Wire up the release automation in the library repo (§7.5).
5. Move the `CNAME` to the new repo; remove it from the old one. DNS is unchanged — both are GitHub Pages, so this is a repo-level switch.
6. Archive the old repo read-only, its README pointing at the new one.

The live site is untouched until step 5.

---

## 15. Risks

| Risk | Mitigation |
|---|---|
| Libdoc's HTML `doc` contains markup our sanitizer strips, silently losing content | Build-time check: assert no keyword's rendered output is shorter than a threshold ratio of its source; fail the build |
| Keyword grouping breaks when a new module is added | Unmapped modules fall back to a title-cased filename and log a build warning (§7.1) |
| Vendored robotcode grammars may not load cleanly into Shiki (scope embedding, `.template.json` confusion) | Spike this in P1, not P2 — it is one afternoon and it de-risks every code block on the site. Plain-text fallback if it slips |
| 206 build-time avatar downloads make builds slow or flaky | Cache in the repo; refresh on a schedule, not every build |
| Full content rewrite (D15) becomes the long pole | Content is authored in Markdown from day one, so it can land incrementally after the components are done |
| Libdoc JSON schema changes in a future RF release | `specversion` is asserted at build time; an unexpected version fails loudly |

---

## 16. Deferred

- Backfilling all ~40 archived versions (post-launch, §7.5)
- Deprecating the generated Libdoc HTML (revisit after traffic moves)
- Interactive/runnable examples in the browser
- Search across older keyword versions
