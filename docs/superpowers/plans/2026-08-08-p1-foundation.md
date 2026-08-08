# P1 Foundation Implementation Plan

**Goal:** Stand up the new robotframework-browser.org repo with its design system and the three block components, proven by a styleguide route and verified in a real browser.

**Architecture:** Nuxt 4 + Nuxt Content 3, prerendered to static files by `nuxt generate` and served from GitHub Pages. Design tokens are plain CSS custom properties in one layer, so no framework owns the visual language. The three block components (`Terminal`, `Editor`, `ComparisonSplit`) are built on a shared dark "plate" primitive and use radio inputs + CSS for state, so tab switching and pane expansion survive with JavaScript disabled.

**Tech Stack:** Nuxt 4, @nuxt/content 3, Shiki, Vitest + @nuxt/test-utils + happy-dom, Playwright (MCP) for browser verification, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-08-rfbrowser-site-design.md`

> **Execution note:** The user handed this off for autonomous inline execution and will review the finished result. This plan is therefore a task ledger with file boundaries, interfaces and test strategy — not a step-by-step transcript for a context-free engineer. Each task still ends with tests passing and a commit.

## Global Constraints

- Node 22, pnpm. No CDN requests at runtime — fonts and grammars are vendored.
- Static output only. No server routes, no runtime API, no backend.
- Light is the default theme; dark is a designed token swap, never an inversion.
- Every colour comes from a token. No colour may be defined only inside a media query or `[data-theme]` block.
- `--term-*` tokens are identical in both themes — code plates never change.
- OCR-A is for headings, labels, chips and buttons only. Never running text, never below 11px.
- Brand red `#D63A2E`; `#B82E24` when red is small body text.
- WCAG 2.2 AA. Visible focus on every interactive element. `prefers-reduced-motion` respected.
- Vendored grammars keep their Apache-2.0 attribution in `NOTICE`.

---

## File structure

```
app/
  assets/
    css/tokens.css          design tokens, both themes           (T2)
    css/base.css            reset, type scale, prose defaults    (T2)
    fonts/*.woff2 *.woff    OCR-A, Plex Sans 400/600, Plex Mono  (T2)
  components/
    Plate.vue               shared dark chrome primitive         (T5)
    Terminal.vue            literal shell only                   (T5)
    TerminalLine.vue        prompt/output/status line            (T5)
    Editor.vue              all code                             (T6)
    FileGlyph.vue           monochrome file-type pictograms      (T6)
    ComparisonSplit.vue     two editors, click-to-expand         (T7)
    ThemeToggle.vue         light/dark/system                    (T2)
  composables/
    useOsDetect.ts          bash vs powershell preselection      (T5)
    useCopy.ts              clipboard + COPIED feedback          (T5)
  utils/
    highlight.ts            Shiki singleton + grammar registry   (T4)
  pages/
    styleguide.vue          P1 acceptance surface                (T8)
public/
  logo/browser-dark.svg     recoloured, for dark grounds         (T3)
  logo/browser-light.svg    recoloured, for paper grounds        (T3)
syntaxes/                   vendored robotcode grammars          (T4)
themes/rfb-plate.json       our Shiki theme                      (T4)
test/                       vitest specs, one per component
.github/workflows/deploy.yml
```

Files that change together live together: each component owns its own styles rather than a global stylesheet, so a component can be reasoned about in one file.

---

## Tasks

Each task: write the failing test, watch it fail, implement minimally, watch it pass, commit.

### T1 — Repo and scaffold
`git init`, Nuxt 4 + Content 3, `nitro.preset: 'github-pages'`, Vitest wired, deploy workflow. **Done when** `pnpm build` emits static HTML into `.output/public` and `pnpm test` runs green.

### T2 — Tokens and fonts
`tokens.css` with the full light palette on bare `:root`, dark redefined under both `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`. Fonts self-hosted, subset latin. `ThemeToggle` writes `data-theme` and persists to `localStorage`; an inline head script applies it before first paint so there is no flash.
**Tests:** every token named in the spec exists; no colour literal appears outside `tokens.css`; toggle cycles system → light → dark.

### T3 — Logo
Recolour, strip editor metadata, outline the wordmark, emit dark and light variants.
**Tests:** neither variant contains `#E2574C`/`#D65348`, `sodipodi`, `inkscape`, or a `font-family` reference; both parse as valid SVG.

### T4 — Shiki and grammars
Vendor both robotcode grammars at a pinned commit with `NOTICE`. Register `robotframework` and `robotframework-repl`; resolve the repl grammar's embedded scopes. Author `rfb-plate.json` from the `--term-*` palette.
**Tests:** a suite sample tokenises to more than one distinct scope (proving no plain-text fallback); a bare keyword sequence tokenises under the repl grammar; the theme covers every scope the grammars emit.

### T5 — Terminal (+ OS auto-detection)
Shared `Plate` primitive lands here. Prompts are `user-select: none`; copy payload excludes them. `useOsDetect` picks powershell on Windows and bash otherwise, from `navigator.userAgentData.platform` falling back to `navigator.platform`; SSR renders bash so prerendered HTML is stable, and detection applies on mount. Manual selection wins and persists.
**Tests:** detection returns powershell for Win32 / "Windows" and bash for Mac/Linux/unknown; copy payload contains no `$`; a manual pick is not overwritten by detection.

### T6 — Editor
Tab bar with `FileGlyph`, gutter, highlighted ranges, status strip, copy.
**Tests:** tab switching without JS (radio `checked` drives pane visibility); gutter is `user-select: none`; copy payload equals source exactly including indentation; status strip line count matches source lines.

### T7 — ComparisonSplit
Radio + `grid-template-columns` transition, 50/50 ↔ 75/25, stacks below 640px, honours reduced motion.
**Tests:** three states render three column ratios; no `@media (max-width:640px)` rule leaves a pane hidden; transition is suppressed under reduced motion.

### T8 — Styleguide
`/styleguide` renders the token set, type scale and every component in every state. This is the acceptance surface.

### T9 — Browser verification
Playwright MCP against the built static output: theme in both directions, OS detection and override, editor tabs, comparison expand with JS disabled, mobile stacking, keyboard focus, reduced motion. Screenshots captured.

---

## Self-review against the spec

Covered by P1: §5.1 logo (T3), §5.2 tokens (T2), §5.3 type (T2), §5.4 both block components and grammars (T4–T6), §6.4 ComparisonSplit interaction (T7), §12 accessibility budgets (T2, T7, T9), D21/D22/D23 (T5, T4, T7).

Deferred to later phases by design, not omission: §6 content pages, §7 keyword engine, §8 content model, §9 search, §10 Libdoc banner, §11 analytics, §14 cutover.
