# Where documentation lives: library vs site

**Date:** 2026-08-08
**Status:** Concept for discussion — nothing implemented
**Question:** What stays in the library's Libdoc documentation, what moves to Docs on the site, and how are the two linked?

---

## 1. What exists today

Three surfaces, written at different times, overlapping in places.

| Surface | Size | Contents |
|---|---|---|
| Library docstring (the Libdoc introduction) | **4,862 words**, 13 sections | Object model, selectors, assertions, waiting, scope, extending, translations, environment variables |
| `README.md` | 4,660 words | Installation, update, uninstall, short examples, plugins, development, contributors |
| `docs/plugins/README.md` | — | Plugin API |
| 151 keyword docstrings | — | Per-keyword reference |

The library introduction breaks down like this:

| Section | Words | Sub-sections | Code blocks |
|---|---:|---:|---:|
| Finding elements | **1,945** | 10 | 8 |
| Assertions | 853 | 2 | 2 |
| Browser, Context and Page | 479 | 3 | 1 |
| Extending with a JavaScript module | 314 | 3 | 4 |
| Language (translations) | 306 | 2 | 0 |
| Scope Setting | 215 | 0 | 0 |
| Automatic page and context closing | 200 | 0 | 0 |
| ENVIRONMENT VARIABLES | 183 | 0 | 0 |
| Preamble + table of contents | 101 | 1 | 0 |
| Experimental: re-using same node process | 85 | 0 | 0 |
| Implicit waiting | 79 | 0 | 0 |
| Experimental: node process parameters | 65 | 0 | 0 |
| Plugins | 37 | 0 | 0 |

**Finding elements is 40% of the whole introduction.** It is also the section a reader needs most often, so its size is not by itself a problem — but two of its sub-sections (WebComponents and Shadow DOM at 456 words, Text engine at 267) are essays rather than reference.

---

## 2. The principle: who is reading, and at what moment

The split should not be by topic or by length. It should be by **the moment the reader is in**, because that determines which surface they are actually looking at.

Libdoc is not only the HTML page we are replacing. It is also:

- **what an IDE shows.** RobotCode and RIDE surface the library and keyword documentation on hover and completion. This is the most frequent way the library documentation is read, and it happens *while writing a keyword call*.
- **what works offline**, in an air-gapped CI image or on a plane.
- **versioned with the code**, so it describes the version actually installed.

That gives a single test:

> **Would you need this to understand the arguments of the keyword you are typing right now?**
>
> Yes → it stays in the library.
> No → it belongs in Docs on the site.

Applied honestly, this keeps the *specification* of `selector`, `assertion_operator`, `scope` and the object model in the library, and moves *teaching, setup and operations* to the site.

### The corollary that matters

Whatever stays must be **self-sufficient for using the API offline**. A stub that says "see the website" where an argument's accepted values used to be documented is a regression, not a refactor. Moving a topic is only acceptable when what remains still answers "what do I pass here?".

---

## 3. The duplication we are about to create

Worth stating plainly, because it is the strongest argument for doing this at all.

The site's `/keywords` page renders the library introduction verbatim. If Docs on the site also explains selectors, assertions and waiting, **the site will carry two full explanations of the same things**, one of them generated from the library and impossible to edit here.

So this is not only about shrinking the library. It is about deciding, per topic, which of the two the site should show — and then not showing the other.

---

## 4. Proposed split, section by section

Three tiers, so the decision is about how far to go rather than all-or-nothing.

### Tier 1 — move pure how-to and operations *(recommended first step)*

Nothing here is needed to understand a keyword's arguments. All of it is setup, extension or operations, and all of it is better on a page that can be updated without a library release.

| Section | Words | Becomes |
|---|---:|---|
| Extending with a JavaScript module | 314 | `/docs/extending/javascript-modules` |
| Language (translations) | 306 | `/docs/translations` |
| ENVIRONMENT VARIABLES | 183 | `/docs/reference/environment-variables` |
| Experimental: re-using same node process | 85 | `/docs/ci/node-process` |
| Experimental: node process parameters | 65 | `/docs/ci/node-process` |
| Plugins | 37 | Stays as a pointer; already only a pointer |

**≈950 words out, about a 20% reduction.** Each leaves a one-sentence stub with a link. Risk is close to zero: none of it is argument semantics, and none of it is needed at the moment of writing a keyword call.

This matches "reduce the library part by a little".

### Tier 2 — move the teaching half of the two big sections

Only worth doing once Docs exists and has proven itself, because it touches the material people actually rely on.

| Moves | Words | Stays in the library |
|---|---:|---|
| *Finding elements* → the WebComponents and Shadow DOM essay, the Text engine discussion, the worked Examples block | ~850 | The strategy table, prefix syntax, implicit-strategy rules, chaining and `>>>` frame syntax, element reference syntax |
| *Assertions* → the worked examples and the `then` / `evaluate` closure tutorial | ~400 | The operator list and their semantics, retry behaviour, type rules |
| *Browser, Context and Page* → the "typical usage" walkthrough | ~250 | The three-layer model and what each layer owns |

**A further ~1,500 words out, roughly 50% total.**

### Tier 3 — reference only

Keep nothing but argument semantics; every narrative goes to the site. This would take the introduction to roughly 1,200 words. **I would not do this.** It optimises for a small Libdoc at the cost of the offline and IDE readers, who are the reason Libdoc carries prose at all.

### Never moves

`Implicit waiting` (79 words), `Scope Setting` (215), `Automatic page and context closing` (200). Each describes the behaviour of an import parameter or of every keyword, is short, and is exactly what someone wants in a tooltip.

---

## 5. What Docs on the site becomes

Structured by task, not by mirroring the library's section list.

```
/docs
  getting-started              install, first test, run it
  core-concepts
    browser-context-page       the object model, with the walkthrough
    selectors                  the full selector guide, incl. shadow DOM and iframes
    assertions                 operators, retries, then/evaluate, worked examples
    waiting                    auto-waiting, timeouts, what to do when it still flakes
  configuration
    scope-and-timeouts
    environment-variables      moved from the library
  ci
    running-in-ci              containers, parallelism with Pabot
    node-process               re-use and parameters, moved from the library
  extending
    javascript-modules         moved from the library
    plugins                    consolidated with docs/plugins/README.md
  translations                 moved from the library
  migrating-from-seleniumlibrary
  troubleshooting
```

Two things this deliberately does:

- **Absorbs the README's installation section.** Installation, update and uninstall are 5 sub-sections of the README today and are the single most-searched topic for any library. They belong on the site, with the README linking to them.
- **Consolidates plugins.** `docs/plugins/README.md` and the library's 37-word pointer become one page.

---

## 6. How the two are linked

This is the part that decides whether the split is maintainable or turns into rot.

**Links point at stable, version-agnostic paths.** `https://robotframework-browser.org/docs/selectors`, never a URL carrying a version or a heading anchor that a future edit may rename. Slugs become an API: renaming one is a breaking change and needs a redirect.

**Every stub is a sentence, not a signpost.** Not "See the documentation on the website." A moved section leaves enough that a reader who never follows the link still knows what the feature is and whether they need it:

> **Language.** Keyword names and documentation can be translated by installing a
> `robotframework_browser_translation_<lang>` package and setting `language=` on
> import. Full guide: https://robotframework-browser.org/docs/translations

**The site never renders a moved section twice.** Once a topic lives in Docs, `/keywords` shows only the library's remaining introduction, and the site links from there into Docs rather than repeating it.

**Version skew is real and needs an answer.** A reader on Browser 18 follows a link from their installed Libdoc into Docs describing the current release. Options, in order of preference:

1. Docs states the version a feature landed in, inline, the way the keyword pages already carry `SINCE` tags. Cheap, no infrastructure.
2. Docs carries a version selector like the keyword reference does. Only worth it if the guides start to diverge sharply between versions.
3. Ignore it. Acceptable only while the library moves slowly.

I would start with 1.

---

## 7. Risks

| Risk | Reality | Mitigation |
|---|---|---|
| Offline and air-gapped readers lose content | Genuine. Tier 1 moves nothing they need at the point of use | Keep argument semantics in the library, always; never stub out an accepted-values list |
| IDE tooltips get thinner | Only for the moved topics, none of which appear in a tooltip while typing a keyword | Tier 1 is chosen precisely to avoid this |
| Links rot | Certain, over years | Slugs are an API; add a redirect map to the site before the first library release that links out |
| The site and library drift and contradict each other | The main long-term risk | Each topic has exactly one home. A moved topic must be *deleted* from the library, not summarised twice |
| Docs describes a version the reader does not have | Certain | Inline "since" notes, per §6 |

---

## 8. What I need decided

1. **Tier 1 only, or Tier 1 then Tier 2?** Tier 1 is ~20% and near-zero risk; Tier 2 is ~50% and touches selectors and assertions, the two sections people actually rely on.
2. **Does the README's installation section move to Docs?** It is the most-searched content in the project and currently lives in the least linkable place.
3. **Is `/docs` the right name**, replacing `/guides` — and do the concept pages on `/why` stay separate from Docs, or become its first chapter?
4. **Version skew:** inline "since" notes to start, or a version selector from day one?

Once these are settled, the work is: build the Docs shell, write the pages that receive moved content, then a single library PR that deletes the moved sections and leaves stubs — in that order, so no link is ever published before its target exists.
