# Library introduction vs. site Docs: deduplication audit

**Date:** 2026-08-09
**Scope:** the class docstring of `Browser/browser.py` (lines 157–840), rendered as
`content/libdoc/Browser-20.3.0.json` → `doc`, against every page under
`content/docs/**/*.md`.
**Policy:** `docs/superpowers/specs/2026-08-08-docs-split-concept.md`. URLs come from
its §9 "Actually built" column.
**Status:** read-only analysis. No file was modified.

Word counts below are **docstring source words** — what a PR diff actually removes —
not rendered words. Two sections render much larger than they read in source because
of the `%AUTO_CLOSING_LEVEL%` and `%ASSERTION_TABLE%` placeholders; both figures are
given where they differ.

Source total across preamble + 13 sections: **4,550 words**.

---

## Part 1 — Contradictions and drift (fix these first)

These matter more than the deduplication, because each one is a place where a reader
gets a different answer depending on which surface they opened.

### C1. The library's selector strategy list is stale and self-contradictory

`Browser/browser.py:273-277` lists exactly four strategies:

> | = Strategy = |     = Match based on =     |         = Example =                |
> | ``css``      | CSS selector.              | ``css=.class > \\#login_btn``      |
> | ``xpath``    | XPath expression.          | ``xpath=//input[@id="login_btn"]`` |
> | ``text``     | Browser text engine.       | ``text=Login``                     |
> | ``id``       | Element ID Attribute.      | ``id=login_btn``                   |

and `browser.py:388-390` repeats the claim in prose:

> "Browser library supports the same selector strategies as the underlying
> Playwright node module: xpath, css, id and text."

Three problems:

1. **It contradicts the library itself.** 160 lines later, `=== id, data-testid,
   data-test-id, data-test and their :light counterparts ===` documents four more
   engines, and `=== CSS:light ===` / `=== text:light ===` two more. The table and
   the prose sentence are both wrong by the docstring's own account.
2. **It contradicts the site.** `content/docs/concepts/selectors.md` opens with a
   ranked table whose **number one entry is `role=`** — "This is the default choice"
   — a strategy the library documentation never mentions once. `role=` appears in
   zero of the 151 keyword docstrings in `Browser-20.3.0.json`.
3. **The site documents four more things the library does not have at all:**
   `nth=` and `visible=` filters (including the warning that filter *order* changes
   the result), the Playwright CSS pseudo-classes (`:has()`, `:has-text()`,
   `:text-is()`, `:nth-match()` …), and the layout selectors (`:right-of()`,
   `:below()` …).

This is the single largest correctness gap in the audit, and it is the opposite of
the split the concept doc is about: here the site is **more complete** than the
library on a topic the governing rule says must stay in the library. A reader in an
IDE cannot see that `role=` exists.

**Recommended in the same PR:** extend the strategy table rather than shrink it —
add `role`, `data-testid`, `data-test-id`, `data-test`, `nth`, `visible` — and delete
the "xpath, css, id and text" sentence in `== Cascaded selector syntax ==` outright.

### C2. The site tells you to install two different ways

- `content/docs/start/getting-started.md:17-19` — `pip install robotframework-browser`
  then `rfbrowser init`.
- `content/docs/concepts/architecture.md:26-29` — a table whose
  `robotframework-browser-batteries` row reads "**Default. Simplest, nothing to
  install outside Python.**", followed by the heading "Without Node.js — the
  recommended start".

The five-minute onboarding page recommends the method the architecture page calls
the fallback. The library preamble meanwhile sends installation questions to
`https://github.com/MarketSquare/robotframework-playwright` (`browser.py:161`), a
third answer. This should be settled before the library links out at all; it is
question 2 in §8 of the concept doc and it is still open.

### C3. Plugins now has two homes

`browser.py:768-773` points at
`https://github.com/MarketSquare/robotframework-browser/blob/main/docs/plugins/README.md`.
§5 of the concept doc says that file and the library pointer "become one page", and
that page exists: `content/docs/extending/python-plugins.md`. Until the library
pointer is retargeted, the project has exactly the two-homes situation §7 lists as
"the main long-term risk".

### C4. The JS-extension pages disagree about the injected arguments

The library (`browser.py:710-725`) names **six** reserved arguments — `page`,
`context`, `browser`, `args`, `logger`, `playwright` — and states that `self` cannot
be used. The site page it would link to,
`content/docs/extending/javascript-extensions.md:44-46`, says only:

> "**`logger` and `page` are appended** to your declared arguments."

A reader who follows the link loses `context`, `browser`, `args`, `playwright` and
the `self` restriction. Going the other way, the site documents `fn.rfdoc` as the
keyword-documentation mechanism (`javascript-extensions.md:47`) and the library
never mentions `rfdoc` at all.

**Resolved from the code — both pages were wrong, and the library has a real
bug here.**

`node/playwright-wrapper/playwright-state.ts:162-170` builds the injection map,
and it holds **five** entries: `page`, `context`, `browser`, `logger`,
`playwright`. `Browser/browser.py:1102` lists the same five as reserved, sending
each as the literal string `"RESERVED"` for Node to swap out.

`args` is **not** injected. `browser.py:1107` turns a JavaScript parameter named
`args` into `*args` on the generated Robot keyword, so it carries values *from*
Robot Framework *to* the function — the opposite direction. The library's prose
says as much (“the rest of values from Robot Framework keyword call”) while
listing it under “reserved arguments that are not accessible from Robot
Framework side”, which contradicts itself. **The library PR should move `args`
out of that list and describe it as what it is.**

The arguments are also resolved **by name, not by position**:
`getArgumentNamesFromJavascriptKeyword(keyword).map(argName => apiArguments.get(argName) || namedArguments[argName])`
reads the declared parameter names and fills in the ones it recognises, wherever
they sit. The site's “appended … declare your own first, then take these two
last” described a positional convention that does not exist.

The site page is corrected: five names in a table, matched by name, with `args`
called out separately. That is the version the library should link to.

**Blocking:** the stub proposed below for this section keeps the reserved-argument
list in the library precisely so this does not become a regression, and the site page
should gain the missing four regardless.

### C5. Same feature, opposite framing

`content/docs/operations/environment-variables.md:20-24` marks
`ROBOT_FRAMEWORK_BROWSER_NODE_PORT` as **"Safe in production: Yes"**. The library
brackets the identical feature under `= Experimental: Re-using same node process =`
and `browser.py:885` calls it "Experimental reusing of playwright process". The site
page `operations/node-process.md:34-37` *does* carry an experimental warning, so the
two site pages are also not aligned with each other.

### C6. No version skew found — checked

- `pyproject.toml:7` → `20.3.0`; `Browser-20.3.0.json` → `20.3.0`.
- Library env-var section: "In releases 20.1.0 or earlier …" (`browser.py:828`).
- Site: "In **Browser 20.1.0 and earlier** …"
  (`operations/environment-variables.md:62`).
- Defaults checked against `browser.py:851-871`: `retry_assertions_for` = 1 s
  (matches "default is 1 second", `browser.py:581`), `strict` = `True` (matches the
  site's `strict=False` opt-out example), `timeout` = 10 s, `auto_closing_level` =
  `TEST`. No renamed arguments; `playwright_process_port` and
  `playwright_process_host` are spelled the same on both surfaces.

The `--plugings` typo is spelled identically in both (`browser.py:806` and
`translations.md:124`), and the site correctly explains it is a shipped typo.

---

## Part 2 — Section-by-section verdicts

| # | Section | Source words | Rendered | Verdict | Removed |
|---|---|---:|---:|---|---:|
| 0 | Preamble + Table of contents | 61 | 101 | KEEP AS IS (one link edit) | 0 |
| 1 | Browser, Context and Page | 509 | 479 | **KEEP AS IS — no destination exists** | 0 |
| 2 | Automatic page and context closing | 8 | 200 | KEEP AS IS | 0 |
| 3 | Finding elements | 2,054 | 1,945 | **TRIM** | 505 |
| 4 | Assertions | 546 | 962 | **KEEP AS IS — no destination exists** | 0 |
| 5 | Implicit waiting | 83 | 79 | KEEP AS IS | 0 |
| 6 | Experimental: Re-using same node process | 90 | 85 | **REPLACE WITH STUB** | 98¹ |
| 7 | Scope Setting | 218 | 215 | KEEP AS IS | 0 |
| 8 | Extending with a JavaScript module | 351 | 314 | **REPLACE WITH STUB** | 241 |
| 9 | Plugins | 42 | 37 | KEEP AS IS (retarget link) | 0 |
| 10 | Language | 318 | 306 | **REPLACE WITH STUB** | 253 |
| 11 | ENVIRONMENT VARIABLES | 197 | 183 | **TRIM** | 89 |
| 12 | Experimental: Provide parameters to node process | 73 | 65 | **DELETE — folded into #6** | (in ¹) |

¹ #6 and #12 merge into one stub, matching the single site page. 90 + 73 = 163 words
in, 65 words out.

**Total removed: 1,186 of 4,550 source words — 26%.** Remaining: ~3,364.

That lands between the concept doc's Tier 1 (~20%) and Tier 2 (~50%), and
deliberately so: every Tier 1 target moves, plus the two Tier 2 essays inside
*Finding elements* whose destination is actually built, and nothing whose destination
is not.

---

### 0. Preamble + Table of contents — 61 words — KEEP AS IS

No content moves. One edit worth making while the file is open: `browser.py:159-161`

> "For information about installation, support, and more please visit the
> [https://github.com/MarketSquare/robotframework-playwright|project pages]."

should also name the site, since installation is exactly what §5 of the concept doc
moves there. Blocked on C2 being decided.

---

### 1. Browser, Context and Page — 509 words — KEEP AS IS

Tier 2 of the concept doc proposes moving the "typical usage" walkthrough
(`browser.py:235-250`, ~140 words) to `/docs/core-concepts/browser-context-page`.

**That page does not exist.** The nearest site page, `/docs/concepts/architecture`,
is about the Python/Node/gRPC split and installation — a different subject entirely.
§9 confirms it: "Assertions and the object model have not been split yet."

Per §6 ("no link is ever published before its target exists"), nothing moves here in
this PR.

---

### 2. Automatic page and context closing — 8 source / 200 rendered — KEEP AS IS

The whole section is `%AUTO_CLOSING_LEVEL%`, generated from the `AutoClosingLevel`
enum. It is the semantics of the `auto_closing_level` import parameter — the exact
case the governing rule keeps. Listed under "Never moves" in §4. No site page exists.

---

### 3. Finding elements — 2,054 words — TRIM (505 out, ~1,549 stay)

#### What stays — the complete strategy listing

Per the constraint, a reader in an IDE must still see every strategy and its syntax
without a browser. All of the following stay **unchanged**:

- The strict-mode paragraph (`browser.py:258-268`).
- The strategy table (`browser.py:273-277`) — and it should *grow*, per C1.
- `== Explicit Selector Strategy ==` (34 w) — the `strategy=value` prefix rule.
- `== Implicit Selector Strategy ==` (112 w) — `//`/`..` → xpath, quotes → text,
  everything else → css, with its examples. This is the inference table; without it
  nobody can read a selector.
- `== CSS ==` (84 w), including the `\\#` Robot-Framework escaping note.
- `== XPath ==` (46 w).
- `== Text ==` in full (270 w), including all four sub-headings —
  `=== Insensitive match ===`, `=== Exact match ===`, `=== RegEx ===`,
  `=== Button and Submit Values ===`. **This is a deliberate deviation from Tier 2**,
  which proposed moving "the Text engine discussion". It is not a discussion; it is
  the accepted-value semantics of a text selector (substring vs. quoted-exact vs.
  `/regex/i`). Moving it is exactly the regression §2 forbids.
- `== Cascaded selector syntax ==` minus its first paragraph — the `>>` semantics,
  the `>>`-in-body escaping rule (`text="some >> text"`) and the `*` capture prefix
  (`*css=article >> text=Hello`). None of the last two appear on the site at all.
- `== iFrames ==` in full (217 w) — `>>>` syntax, the rule that the clause before
  `>>>` must select the frame element, and the `Set Selector Prefix` note. The site
  covers `>>>` in six lines and never mentions `Set Selector Prefix`.
- `=== text:light ===` (51 w) and
  `=== id, data-testid, data-test-id, data-test and their :light counterparts ===`
  (33 w) — both are strategy definitions, both are short.
- `== Element reference syntax ==` in full (152 w) — the `element=` syntax and the
  "frame piercing is not possible with element reference" caveat, which the site
  omits.

#### Removal 3a — the shadow-DOM advocacy paragraphs (83 words)

`browser.py:487-495`, the opening of `== WebComponents and Shadow DOM ==`. Remove
these two paragraphs:

> "Playwright and so also Browser are able to do automatic piercing of Shadow DOMs
> and therefore are the best automation technology when working with WebComponents."

> "Also other technologies claim that they can handle [Shadow DOM and Web
> Components]. However, none of them do pierce shadow roots automatically, which may
> be inconvenient when working with Shadow DOM and Web Components."

Marketing, not reference. Keep the two paragraphs that follow ("For that reason, the
css engine pierces shadow roots… every Descendant combinator pierces an arbitrary
number of open shadow roots…" and "That means, it is not necessary to select each
shadow host…"), which are behaviour.

Link: `/docs/concepts/selectors`

#### Removal 3b — the `css:light` worked example (220 of 270 words)

`browser.py:515-543`. Remove the 15-line pseudo-HTML block beginning
`| <article>` and ending `| </article>`, the note "Note that ``<open mode shadow
root>`` is not an html element…", and all eight bullets that follow, from

> "- Both ``"css=article div"`` and ``"css:light=article div"`` match the first
> ``<div>In the light dom</div>``."

through

> "- ``"css=article li#target"`` matches the ``<li id='target'>Deep in the
> shadow</li>``, piercing two shadow roots."

**Keep** `browser.py:507-513` — the definition of `css:light` and the iteration-order
sentence. That is the strategy; the eight bullets are a tutorial.

Link: `/docs/concepts/selectors`

#### Removal 3c — the `== Examples ==` block (148 + 14 words)

`browser.py:424-451`, the entire sub-section from `| # queries 'div' css selector` to
`| Get Element    id=foo >> css=span:nth-child(2n+1) >> div`, plus the trailing "Be
aware that using ``#`` as a starting character…" sentence, which duplicates the same
warning already given in `== CSS ==`.

Every line in it restates a rule already stated in `== Implicit Selector Strategy ==`
or `== Cascaded selector syntax ==` with its own example.

**Also remove the two now-dangling cross-references** — otherwise the PR ships two
broken internal links (and the target `Examples` is ambiguous anyway, since
*Assertions* has a sub-section by the same name):

- `browser.py:337-338`: "More\n    examples are displayed in `Examples`."
- `browser.py:355`: "More examples are displayed in `Examples`."

Link: `/docs/concepts/selectors`

#### Removal 3d — the redundant strategy sentence (40 words)

`browser.py:388-390`, the first paragraph of `== Cascaded selector syntax ==`:

> "Browser library supports the same selector strategies as the underlying
> Playwright node module: xpath, css, id and text. The strategy can either be
> explicitly specified with a prefix or the strategy can be implicit."

Delete, do not relocate: sentence one is factually wrong (C1) and sentence two
duplicates `== Explicit Selector Strategy ==` verbatim in meaning. The section then
opens on "A major advantage of Browser is that multiple selector engines can be used
within one selector."

#### Replacement text

At the end of the section's opening paragraph block (after `browser.py:279`,
"CSS Selectors can also be recorded with `Record selector` keyword."), add:

```
    Every strategy, filter and chaining rule below is usable offline from this
    document. A longer guide — which strategy to prefer and why, the ``nth=`` and
    ``visible=`` filters, Playwright's CSS pseudo-classes and layout selectors —
    is at https://robotframework-browser.org/docs/concepts/selectors
```

And in place of the removed `css:light` bullets, close that sub-section with:

```
    Worked examples of what ``css`` matches and ``css:light`` does not are at
    https://robotframework-browser.org/docs/concepts/selectors
```

---

### 4. Assertions — 546 source / 962 rendered — KEEP AS IS

Tier 2 proposes moving "the worked examples and the `then`/`evaluate` closure
tutorial" (~110 source words) to `/docs/core-concepts/assertions`.

**No assertions page exists on the site.** §9 says so explicitly. Nothing moves.

Note for whoever writes that page: the `%ASSERTION_TABLE%` placeholder generates the
operator table, the `matches` return-type rules (string / tuple / dict depending on
RegEx groups) and the formatter table (`normalize spaces`, `strip`,
`case insensitive`, `apply to expected`). None of that may ever leave the library —
it is the accepted-values list for `assertion_operator`.

One thing worth fixing in passing, unrelated to the split: `browser.py:615` has an
unbalanced backtick — ``Example: ``A < Z``, ``Z < a``, ``ac < dc` `` — which renders
as a stray code span in the JSON `doc`.

---

### 5. Implicit waiting — 83 words — KEEP AS IS

Listed under "Never moves". It explains what `retry_assertions_for` does and why
there is no `Wait Until Element Is Visible` in front of every keyword — a tooltip
answer. No site waiting page exists.

---

### 6. Experimental: Re-using same node process — 90 words — REPLACE WITH STUB

**Remove:** `browser.py:668-677` in full, i.e. everything from "Browser library
integrated nodejs and python." to "…do ``ROBOT_FRAMEWORK_BROWSER_NODE_PORT=PORT
pabot ..``."

**Link:** `/docs/operations/node-process`

**Replacement** (65 words, and it absorbs section 12):

```
    = Experimental: Re-using same node process =

    The Node.js side can be started as a standalone process and shared by every
    Browser library running on the same machine, which speeds up parallel runs.
    Start it from the directory where the Browser package is installed with
    ``PLAYWRIGHT_BROWSERS_PATH=0 node Browser/wrapper/index.js PORT``, then point
    runs at it with the ``playwright_process_port`` import parameter or the
    ``ROBOT_FRAMEWORK_BROWSER_NODE_PORT`` environment variable. What it costs, how
    to run it under Pabot, and how to pass Node flags such as ``--inspect``:
    https://robotframework-browser.org/docs/operations/node-process
```

The command line stays: it is the one thing a reader cannot reconstruct, and
`browser.py:885` already cross-references this section from the
`playwright_process_port` argument table.

---

### 7. Scope Setting — 218 words — KEEP AS IS

Listed under "Never moves". It defines the accepted values of the `scope` argument
(`Global` / `Suite` / `Test`/`Task`) and their lifetimes — the textbook case of the
governing rule. No site page exists.

---

### 8. Extending Browser library with a JavaScript module — 351 words — REPLACE WITH STUB

**Remove:** `browser.py:697-766`, i.e.

- the opening paragraph "Browser library can be extended with JavaScript. … For
  example TypeScript, PureScript and ClojureScript just to mention few." (Babel/ES6
  transpilation advice, 55 w)
- the `myGoToKeyword` snippet at `browser.py:702-706`
- the six reserved-argument bullet paragraphs — **their names survive in the stub**,
  their prose and Playwright API links do not
- `== Example module.js ==` in full
- `== Example Robot Framework side ==` in full
- `== Example module keyword for custom selector registering ==` in full — the
  `registerMySelector` block appears verbatim on the site at
  `javascript-extensions.md:67-80`

**Link:** `/docs/extending/javascript-extensions`

**Replacement** (110 words):

```
    = Extending Browser library with a JavaScript module =

    Browser can be given extra keywords written in JavaScript, running on the Node
    side with the Playwright ``page`` object in hand. The module must be in the
    CommonJS format Node.js uses; exported functions become keywords, and a
    ``fn.rfdoc`` string becomes that keyword's documentation. Load a module with the
    ``jsextension`` import parameter.

    These argument names are reserved and injected by the library instead of being
    taken from the keyword call: ``page``, ``context``, ``browser``, ``args``,
    ``logger`` and ``playwright``. The name ``self`` cannot be used. A module can
    also register a custom selector engine with
    ``playwright.selectors.register``, usable anywhere a selector is accepted.

    Worked modules, the Robot Framework side, custom selector engines and how to
    attach a Node debugger:
    https://robotframework-browser.org/docs/extending/javascript-extensions
```

The reserved-argument list is kept deliberately — it is argument semantics for the
keyword being written, the site page is currently missing four of the six (C4), and
§7's mitigation is "never stub out an accepted-values list".

---

### 9. Plugins — 42 words — KEEP AS IS, retarget the link

Already a pointer; §4 says it stays one. The only change is the destination
(C3): replace the
`https://github.com/MarketSquare/robotframework-browser/blob/main/docs/plugins/README.md`
link at `browser.py:772` with

```
    = Plugins =

    Browser library offers plugins as a way to modify and add library keywords and
    modify some of the internal functionality without creating a new library or
    hacking the source code. Plugins are Python classes loaded with the ``plugins``
    import parameter. See
    https://robotframework-browser.org/docs/extending/python-plugins
```

Net zero words; one sentence added so the stub says what a plugin *is*, per §6.

---

### 10. Language — 318 words — REPLACE WITH STUB

**Remove:** `browser.py:784-811`, i.e.

- "The package must implement single API call, ``get_language`` without any
  arguments. Method must return a dictionary containing two keys…" through "…The
  path parameter value should be full path to the translation file."
- `== Translation file ==` in full (the `__intro__` / `__init__` / `name` / `doc`
  JSON schema)
- `== Generating template translation file ==` in full, including the
  `--plugings`/`--jsextension` example
- the closing pointer to `robotframework-browser-translation-fi`

All of it is on the site, better: `extending/translations.md:47-53` shows
`get_language` as runnable Python, `:67-81` shows a real `fi.json`, and `:128-131`
explains the `--plugings` typo, which the library does not.

**Link:** `/docs/extending/translations`

**Replacement** (65 words):

```
    = Language =

    Keyword names and their documentation can be translated. Install a Python
    package whose name starts with ``robotframework_browser_translation`` and set
    the ``language`` import parameter to the language that package declares;
    Browser discovers it on the module search path through the Python plugin API.
    A template for a new translation, containing every keyword in the correct
    format, is produced by ``rfbrowser translation /path/to/translation.json``.
    Writing and packaging a translation:
    https://robotframework-browser.org/docs/extending/translations
```

Keeping the `rfbrowser translation` command and the package-name convention means a
reader offline can still both *use* a translation and generate the file to start one.

---

### 11. ENVIRONMENT VARIABLES — 197 words — TRIM (89 out, ~108 stay)

**This deviates from Tier 1**, which moves the section wholesale. Three variable
names are not reconstructible from anywhere else in the library, and an air-gapped
reader debugging a CI runner is precisely the §7 case. The table stays; the prose
around it goes.

**Remove 11a** — the closing BrowserBatteries history paragraph, `browser.py:825-831`
in full:

> "These variables behave the same way whether the node process is started from a
> NodeJS you installed yourself or from the one inside the [robotframework-browser-batteries]
> package. In releases 20.1.0 or earlier ``ROBOT_FRAMEWORK_BROWSER_NODE_COVERAGE``
> and ``ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS`` were silently ignored when
> BrowserBatteries was installed, because the node process was then a prebuilt binary
> that could not be given node arguments."

Release history of a version you are not running is the definition of site content,
and it is already at `operations/environment-variables.md:61-66`.

**Remove 11b** — compress the three-sentence intro (`browser.py:815-817`) to one.

**Keep:** the three-row table at `browser.py:820-823` unchanged.

**Link:** `/docs/operations/environment-variables`

**Replacement intro** (28 words in place of 48):

```
    = ENVIRONMENT VARIABLES =

    These environment variables modify the behaviour of the library. Two of them are
    development features and must not be set in production; they are listed here so
    that nobody uses them by accident.

    <the existing three-row table, unchanged>

    Which of these to prefer over an import parameter, and how they behave with
    BrowserBatteries:
    https://robotframework-browser.org/docs/operations/environment-variables
```

---

### 12. Experimental: Provide parameters to node process — 73 words — DELETE

`browser.py:833-839` in full. It documents one variable,
`ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS`, which already has its own row in the
table two sections above, including the comma-separation rule. The site merged both
node-process sections onto one page for the same reason (§9).

No stub. The `= Experimental: Re-using same node process =` stub in #6 already links
to `/docs/operations/node-process`, which is where "Passing Node flags" lives.

---

## Part 3 — Content gaps in each direction

### In the library, nowhere on the site

Each of these is a topic the site cannot currently answer. Not a problem while the
library keeps them — it is a problem the day anyone proposes Tier 2 or Tier 3.

| Topic | Where in the library |
|---|---|
| The Browser / Context / Page object model, supported-engine table, `Open Browser` vs `New Page`, `Get Browser Catalog` | §`Browser, Context and Page` |
| Auto-closing levels `TEST` / `SUITE` / `MANUAL` / `KEEP` | §`Automatic page and context closing` |
| The entire assertion operator table, formatters, `matches` return types, string-comparison rules, `then`/`evaluate` | §`Assertions` |
| Scope lifetimes | §`Scope Setting` |
| `retry_assertions_for` and how auto-waiting and assertion retry compose | §`Implicit waiting` |
| `css:light`, `text:light`, `id:light` | §`Finding elements` |
| The `*` capture prefix, `>>`-escaping inside a selector body | `== Cascaded selector syntax ==` |
| `Set Selector Prefix` as the frame equivalent of SeleniumLibrary's `Select Frame` | `== iFrames ==` |
| "frame piercing is not possible with element reference" | `== Element reference syntax ==` |
| `Record selector` | `= Finding elements =` opening |
| JS extension reserved args `context`, `browser`, `args`, `playwright`; the `self` restriction | §JS module (see C4) |

### On the site, nowhere in the library

| Topic | Page |
|---|---|
| `role=` and the whole selector ranking; `nth=`/`visible=` filters and filter ordering; CSS pseudo-classes; layout selectors | `/docs/concepts/selectors` |
| Installation, BrowserBatteries vs `rfbrowser init`, `PLAYWRIGHT_BROWSERS_PATH` in CI | `/docs/concepts/architecture`, `/docs/start/getting-started` |
| `playwright-log.txt`, traces, `rfbrowser show-trace`, coverage | `/docs/concepts/logging` |
| Docker images, tags, `--ipc=host`, `--user pwuser` | `/docs/operations/docker`, `/docs/operations/docker-images` |
| Pabot cost model for the Node process; what a shared process gives up | `/docs/operations/node-process` |
| Python plugin API in depth: `LibraryComponent`, `resolve_selector`, `presenter_mode`, `call_js_keyword` | `/docs/extending/python-plugins` |
| JavaScript primer; `Evaluate JavaScript` round-trip argument | `/docs/extending/javascript-basics` |
| Node debugging with `--inspect-brk`, the ~5 s attach window, RobotCode `launch.json` | `/docs/extending/javascript-extensions` |
| `fn.rfdoc` | `/docs/extending/javascript-extensions` |
| Mobile: devices, responsive, touch | `/docs/mobile/*` |
| The `--plugings` typo | `/docs/extending/translations` |

---

## Part 4 — Order of work

1. **Fix C4 first** — add the four missing reserved arguments to
   `/docs/extending/javascript-extensions`. The section-8 stub links there.
2. **Decide C2** (which install method the project recommends) before the library
   preamble points at the site at all.
3. **Add the redirect map** §6 requires, since these six URLs become an API on merge.
4. Then the library PR: removals 3a–3d, 6, 8, 9, 10, 11a–11b, 12 — and, in the same
   PR and going the other way, the C1 fix that *adds* `role=`, the test-id engines and
   the `nth=`/`visible=` filters to the strategy table.

Not in scope, and still blocked per §9: the *Assertions* and *Browser, Context and
Page* splits, both of which need a site page written first.

---

## Verification of C1 — `role=` does work

The audit found that `role=` appears nowhere in the library's documentation
while the site ranks it first, and that Playwright's current docs no longer
describe a `role=` selector prefix either. That raised a real question: is the
site recommending a selector that does not work?

It works. Tested directly against `playwright-core` 1.60, the version the
library bundles, on a page with two buttons, a labelled input and a hidden
button:

| Selector | Matches |
|---|---:|
| `role=button[name="Save"]` | 1 |
| `role=textbox[name="Email"]` | 1 |
| `getByRole('button', { name: 'Save' })` — reference | 1 |
| `button >> visible=true` | 2 (hidden one excluded) |
| `button >> nth=1` | 1 |
| `css=button:visible` | 2 |
| `data-testid=x` | 0, and no error — the engine exists |

So the site is correct and the library's strategy list is simply incomplete.
The direction of the fix is the opposite of a trim: **the PR should add the
missing strategies to the library's table**, not remove anything from it.
Playwright's own documentation having quietly stopped describing `role=` is
worth knowing, but it is not evidence of removal — the engine is still there.
