# robotframework-browser.org

The website for the [Robot Framework Browser](https://github.com/MarketSquare/robotframework-browser)
library. Nuxt 4 + Nuxt Content 3, prerendered to static files, served from GitHub Pages.

> **Status: foundation (P1).** The design system and block components are built
> and verified. Content pages and the keyword reference are not yet built — see
> the plan below.

## Commands

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # vitest
pnpm generate       # static output into .output/public
pnpm check:bundle   # fails if server-only weight reached the client
pnpm verify         # test + generate + check:bundle
```

`/styleguide` renders every design token and every component in every state.

## Documents

| | |
|---|---|
| [Design spec](docs/superpowers/specs/2026-08-08-rfbrowser-site-design.md) | What we are building and every settled decision (D1–D23) |
| [P1 plan](docs/superpowers/plans/2026-08-08-p1-foundation.md) | Foundation phase task ledger |

## How it fits together

- **Content** is Markdown and JSON in `content/`, edited by pull request. No CMS.
- **Design tokens** live in `app/assets/css/tokens.css` and nowhere else. A test
  fails the build if a colour literal appears anywhere else under `app/`.
- **Themes.** Light is the default; dark is a designed token swap. The `--term-*`
  plate tokens are identical in both, so code blocks look the same either way and
  the syntax theme only has to be defined once.
- **Syntax highlighting** runs at build time via Shiki, using Robot Framework
  grammars vendored from [robotcode](https://github.com/robotcodedev/robotcode)
  (Apache-2.0, see `NOTICE`). No highlighter reaches the browser.
- **Components** use radio inputs and CSS for state, so Editor tabs and the
  ComparisonSplit expansion work with JavaScript disabled.

## Deployment

Pushing to `main` runs the tests, generates the site, and deploys to GitHub Pages.
No `CNAME` is committed yet — the custom domain moves here at cutover (spec §14),
so until then this deploys to the `github.io` preview URL.
