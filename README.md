# robotframework-browser.org

The website for the [Robot Framework Browser](https://github.com/MarketSquare/robotframework-browser)
library. Nuxt 4 + Nuxt Content 3, prerendered to static files, served from GitHub Pages.

**Maintaining it? Read [CONTRIBUTING.md](CONTRIBUTING.md).** It covers editing
content, what is generated and must not be hand-edited, and how a release
reaches the site.

## Commands

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # vitest
pnpm libdoc         # transform content/libdoc/*.json into app/generated/
pnpm generate       # runs libdoc, then static output into .output/public
pnpm check:bundle   # fails if server-only weight reached the client
pnpm verify         # test + generate + check:bundle
```

- `/styleguide` renders every design token and every component in every state.
- `/keywords` is the keyword reference: 151 keyword pages and 81 type pages.

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
- **The keyword reference** is generated from Libdoc JSON at build time. Drop a
  new `content/libdoc/Browser-<version>.json` in, point `LATEST` at it, and
  `pnpm libdoc` emits a 36 KB index plus one payload per keyword and per type.
  Groups come from each keyword's defining module via
  `content/keyword-groups.json`, because Libdoc carries no group field.

## Deployment

Pushing to `main` runs the tests, generates the site, and deploys to GitHub
Pages. Every pull request gets its own surge.sh preview, commented on the PR.
When the library releases, a scheduled workflow opens a pull request here with
the new keyword reference, release note and version numbers.

`public/CNAME` carries the custom domain, which is what preserves it across a
deployment from an artifact.

Deployment is gated on the repository variable `PAGES_LIVE`. Until the cutover
it builds and tests on every push and publishes nothing, because Pages has one
source per repository and this one still serves the previous site from
`legacy-site`.
