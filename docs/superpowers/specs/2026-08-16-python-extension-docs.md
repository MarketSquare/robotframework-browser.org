# Extending Browser from Python: two new pages

**Date:** 2026-08-16
**Status:** built, 2026-08-18. Two pages, the extension-point table and the header note, on
`python-extension-docs`. Two decisions were settled during the work; both are recorded inline
below.
**Question:** Where does a user who wants to write their own Python library on top of Browser find out how, and what they give up?

---

## 1. The gap

`/docs/extending` documents two ways to extend Browser **from the inside**: a
[Python plugin](/docs/extending/python-plugins) and a
[JavaScript module](/docs/extending/javascript-extensions). Both run inside the instance Robot
Framework loaded.

There is a third thing people actually do, and the site says nothing about it: **write their own
Robot Framework library that uses Browser.** Not a plugin — their own library, their own
keywords, their own control over failure handling.

The library has just made this materially better. Keyword arguments now convert from plain
Python values the same way Robot Framework converts them, so `browser.click("//button",
"middle")` works from Python. That ships undocumented unless these pages exist.

## 2. Two audiences, one axis

They differ by **who imports Browser**, and that single fact decides everything else.

**A — Robot Framework imports Browser; the user's library sits alongside it.** They have
outgrown a plugin. They want business logic in Python — logging, `IF`/`ELSE`, `TRY`/`EXCEPT`,
data parsing — and they are not giving up anything about how Browser behaves today. Their
library reaches the instance Robot Framework already made:

```python
browser: Browser = BuiltIn().get_library_instance("Browser")
```

The trap: construct `Browser()` inside their own library instead, and they silently get a second
instance, a second Node process, and none of the Robot Framework behaviour they still think they
have.

**B — Robot Framework imports only the user's library, which owns Browser.** They are replacing
Browser imports and Robot Framework resource-file keywords with their own library. Better control
of failures, complex scenarios that are painful in Robot Framework syntax. This user needs to
understand which Browser features come from the **dynamic library API**, which come from the
**listener API**, and which are simply free.

Audience A is a novice-to-Python user who needs to get going. Audience B needs the mechanism.
That difference in depth is a *consequence* of the axis, not the axis itself.

## 3. What B actually looks like

Not a list of losses. Three tiers:

| | |
|---|---|
| **Free — Robot Framework is running** | argument conversion, `outputdir`, `validate` / `then` |
| **One line — register Browser as a listener** | automatic closing, scope settings, the Robot Framework context |
| **Yours to build** | run on failure, tracing groups |

The middle tier is the finding that makes B viable, and it is one line:

```python
class MyLibrary:
    ROBOT_LIBRARY_SCOPE = "GLOBAL"

    def __init__(self):
        self._browser = Browser()
        self.ROBOT_LIBRARY_LISTENER = [self, self._browser]
```

Robot Framework accepts a **list** of library listeners and resolves Browser's underscore-prefixed
listener methods, so it drives Browser's listener itself. The leading underscore on
`_start_suite` is not "private" — it is the convention that stops listener methods from becoming
keywords. The Browser maintainers have accepted this as a **supported contract**.

The bottom tier stays yours because `run_on_failure` and tracing groups live in `run_keyword`,
the dynamic library API, which Robot Framework only calls on the library it imported itself. That
is the right place for a user library to implement its own failure handling anyway.

## 4. The pages

| | |
|---|---|
| `/docs/extending/python-libraries` | **Your own Python library** — "Move business logic out of Robot Framework and keep Browser exactly as it is." Audience A. `order: 1`. |
| `/docs/extending/browser-as-a-base` | **Browser as a base** — "Own the Browser instance in your own library: what you get free, what one line restores, and what you build yourself." Audience B. |

Slugs are an API per [the split spec](2026-08-08-docs-split-concept.md) §6 — pick them once.

**Ordering, decided while building.** This section originally said `python-libraries` takes
`order: 1` and `python-plugins` moves to `order: 2`, which was written when only one page was
planned. With two, the maintainer's call is that the chapter keeps its existing head and the new
pages go after JavaScript and before translations: **plugins, just enough JavaScript, JavaScript
extensions, your own Python library, Browser as a base, translating keywords.** The reasoning is
the reader's actual path — people arrive at plugins first and grow into writing their own library
— and translations is an extra that belongs at the end. It also keeps the two new pages adjacent,
so previous/next walks straight from "alongside Browser" to "owning the instance".

**Two pages is the starting position, not a settled one.** Both cover "extending from Python"
and could be one page; equally, either could turn out to need splitting further. This is a call
to make from the drafts, not before them.

### Also changes

- `content/docs/extending/javascript-extensions.md` — the "Which extension point?" table becomes
  a three-way choice. Owning the instance is a genuinely different shape from plugging into one,
  and that table is where a reader currently gets told there are only two options.
- `app/components/SiteHeader.vue:55` — the Extending note reads "Python plugins, JavaScript,
  translations" and needs the new pages in it.

**No cross-links from `concepts/assertions.md` or `concepts/logging.md`.** Tempting, because
`validate`/`then` and tracing groups are discussed there — but the split spec's rule is that each
topic has exactly one home, and a cross-link is how the duplication in §3 of that spec started.

## 5. Where the facts come from

The Browser library owns the facts; this repository owns the prose. That boundary is deliberate:
`CONTRIBUTING.md` promises a contributor here needs neither Python nor a checkout of the library,
and re-deriving behaviour from library source would break that promise.

The handoff is a single document in the library repository, `docs/research/python-extension-contexts.md`,
with every row of the matrix citing an acceptance test that proves it. **Write these pages from
it and from nothing else.** If it does not answer something, that is a gap in the fact sheet, not
an invitation to go reading library source.

**Code examples are not retyped.** They come from `atest/test/13_Python_Extension/` in the library
repository, and each fenced block names the file it came from. This site cannot run Python, so
provenance is the only defence against examples rotting.

## 6. Order of work

1. Library: acceptance tests demonstrating both contexts *(library ticket 0008)*
2. Library: the fact sheet *(library ticket 0009)*
3. **Here: these two pages, the extension-point table, the header note.** Merges first.
4. Library: a one-line pointer in the Libdoc introduction linking here *(library ticket 0010)*

Step 4 is last so the library never ships a link to a page that does not exist. Version skew is
handled per split spec §6 option 1 — an inline note saying which release the behaviour landed in
— so these pages do **not** wait on a library release.

**Version skew, decided while building.** Argument conversion ships in **20.4.0**, which was not
yet released when these pages were written, so `%%browser%%` could not carry the claim: that
token means *the release this site documents* and would read 21.x a year from now, turning a true
statement into a false one. Option 1 therefore got a component — `:since{version="20.4.0"}`,
rendering *New in Browser 20.4.0* — and `versions.spec.ts` exempts what appears inside it while
its existing check, which fails the build on the current release typed out, still runs over the
rest of the file. It is the second documented exception to
"version numbers are never typed by hand", alongside release notes, and it is reusable for the
next feature that lands in a known release. The `:since` marks only the conversion; nothing else
on either page is claimed to be new.

## 7. Out of scope

**Using Browser with no Robot Framework at all.** Supported, undocumented, and parked. It is one
closing section on `browser-as-a-base` once that page exists, and the two facts specific to it —
output goes to the working directory, `validate`/`then` raise `RobotNotRunningError` — are
already measured and recorded in the library repository. Tracked as
[MarketSquare/robotframework-browser#5164](https://github.com/MarketSquare/robotframework-browser/issues/5164).

Do not let it leak into these pages by implication: under Robot Framework, including when a user
library owns the instance, `${OUTPUTDIR}` resolves and `validate`/`then` work.
