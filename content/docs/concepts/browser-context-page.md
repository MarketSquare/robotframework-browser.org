---
title: Browser, context and page
description: The three layers Playwright is built on — and why a new context is the cheapest clean slate you will ever get.
section: concepts
order: 2
---

Browser works in three layers. Almost every question about isolation, speed, or
"why is this test seeing the previous test's login" is answered by knowing which
layer you are on.

```text
Browser · chromium
│
├── Context 1 · alice
│   ├── Page · tab
│   └── Page · tab
│
└── Context 2 · bob
    └── Page · tab
```

One browser process, two signed-in users, three tabs. The two contexts share
nothing — separate cookies, separate storage, separate permissions — which is
the whole reason the layers are worth learning.

::doc-table
---
head: [Layer, Is, Costs, Opened with]
rows:
  - ['**Browser**', 'A Chromium, Firefox or WebKit process', 'Seconds', '`New Browser`']
  - ['**Context**', 'An isolated session inside it', 'Milliseconds', '`New Context`']
  - ['**Page**', 'A tab, with its own history', 'Milliseconds', '`New Page`']
---
::

## The browser

One process, one engine. Three are available, and between them they cover what
people actually use:

::doc-table
---
head: [Engine, Ships in]
nowrap: [0]
rows:
  - ['`chromium`', 'Google Chrome, Microsoft Edge, Opera']
  - ['`firefox`', 'Mozilla Firefox']
  - ['`webkit`', 'Safari on macOS and iOS']
---
::

Playwright brings its own binaries, so there is no geckodriver, no chromedriver,
and no driver version to keep in step with a browser version. The same three
engines run on Windows, Linux and macOS.

`New Browser` starts headless unless you say otherwise — `Open Browser`, being a
debugging tool, starts headful:

```robot-repl
New Browser    chromium    headless=False
```

The browser layer is where the *environment* is decided: which engine, headless
or not, a proxy, a slow-motion delay, the browser's own timeout, extra launch
arguments.

### Browsers are reused

`New Browser` with the same arguments as an earlier `New Browser` call does not
start a second process — it switches to that one. That is what makes it safe to
call in a suite setup that runs many times. A browser that `New Page` or
`New Context` created implicitly is not a reuse candidate, so an explicit
`New Browser` after them does start a second process. To force a new one
deliberately:

```robot-repl
New Browser    chromium    reuse_existing=False
```

## The context

A context is an independent session inside an already-running browser: its own
cookies, its own storage, its own permissions. Two contexts share nothing. The
closest everyday equivalent is a fresh incognito window.

This is the layer worth understanding, because it is where Browser is
structurally faster than the older tools. With tools that give you one session per browser process, an isolated session
costs a process start. Here it is one call inside a process that is already
warm:

```robot-repl
New Context    # a clean slate, in milliseconds
```

So "log in as a different user" costs a few milliseconds of context creation
rather than a browser start, and so does "start this test from a known-clean
state". You do not clear cookies; you throw the context away and open another.

The context is also where the interesting configuration lives:

```robot-repl
New Context    viewport={'width': 1920, 'height': 1080}
New Context    locale=de-DE    timezoneId=Europe/Berlin
New Context    geolocation={'latitude': 48.86, 'longitude': 2.35}
New Context    httpCredentials={'username': 'admin', 'password': 'secret'}
New Context    acceptDownloads=True
New Context    colorScheme=dark
```

Downloads are accepted by default. Pass `acceptDownloads=False` if you want the
browser to refuse them.

Tracing and video recording are context-level too, which is why a trace covers
exactly one session:

```robot-repl
New Context    tracing=True
New Context    recordVideo={'dir': '${OUTPUT_DIR}/video'}
```

### Persistent contexts

`New Persistent Context` is the exception to the shape: it takes a user data
directory and creates its own browser, so state *survives* between runs. Useful
when a real profile is the thing under test, and the wrong tool for isolation —
a browser opened this way cannot host additional contexts.

## The page

A page is a tab. It holds the document and its own history, and it is where every
selector resolves.

```robot
*** Test Cases ***
Starting A Browser With A Page
    New Browser    chromium    headless=False
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page       https://robotframework-browser.org
    Get Title      ==    Robot Framework Browser
```

A popup, a target-blank link or a second tab is another page in the same
context, so it shares the login. It does **not** become the active page on its
own — reach it with `Switch Page    NEW`, which returns the id of the page you
came from:

```robot-repl
Click          text=Open report
${previous} =    Switch Page    NEW
Get Title      *=    Report
Switch Page    ${previous}
```

## You rarely open all three

The layers fill themselves in downwards. `New Page` with nothing open starts a
browser and a context first, using defaults:

```robot-repl
New Page    https://robotframework-browser.org
```

`Open Browser` does all three in one call. It is built for experiments and
debugging; when you care about the context, open the three yourself.

## What is open right now

Every browser, context and page has an id, and `Get Browser Catalog` returns the
whole tree:

```text
Browser  chromium  browser=94c1…            activeBrowser: true
├── Context  context=7f2a…                  activeContext: true
│   ├── Page  page=3dce…  /login            activePage: true
│   └── Page  page=8b17…  /cart
└── Context  context=b3d9…
    └── Page  page=1f60…  /admin

Browser  firefox  browser=1ae8…
└── Context  context=5c04…
    └── Page  page=42aa…  about:blank
```

Drawn as a tree here for readability; the keyword returns a list of
dictionaries, one per browser, each carrying its contexts and their pages. The
`active*` flags are the part worth reading — they tell you which browser,
context and page the next keyword will act on.

This is the fastest way to answer "what does the library think is running" when
a suite has drifted from what you expected. `Get Browser Ids`, `Get Context Ids`
and `Get Page Ids` return the pieces individually.

Keywords act on the *active* browser, context and page unless you say otherwise,
and `Switch Browser`, `Switch Context` and `Switch Page` move that pointer.

## When things close

By default, the **contexts and pages** a test opened are closed when the test
ends. Browsers are not: no auto-closing level closes a browser per test or per
suite, so a browser lives until execution ends or you call `Close Browser`.

That setting is `auto_closing_level`, and it has four values:

::doc-table
---
head: [Level, Contexts and pages are closed]
nowrap: [0]
rows:
  - ['`TEST`', 'At the end of the test that created them (the default). Anything created in suite setup lives until suite teardown.']
  - ['`SUITE`', 'At the end of the suite that created them']
  - ['`MANUAL`', 'Never during the run — everything closes when execution ends']
  - ['`KEEP`', 'Never, not even at the end. The node process stays alive too.']
---
::

```robot
*** Settings ***
Library    Browser    auto_closing_level=SUITE
```

`KEEP` leaves processes running on purpose — it exists so you can poke at a page
after a failing test while writing it. **Never set it in CI**, or runs will leak
browser processes until the machine gives up.

## Which layer for which job

::doc-table
---
head: [You want, Open]
rows:
  - ['A second user session', 'A new **context**']
  - ['A popup or a second tab in the same session', 'A new **page**']
  - ['A clean slate between tests', 'A new **context** — not a new browser']
  - ['A different engine, or a GUI', 'A new **browser**']
  - ['A proxy', 'Either — `proxy` is an argument on **both** `New Browser` and `New Context`']
  - ['A profile that survives the run', '`New Persistent Context`']
  - ['A mobile device profile', 'A new **context** from `Get Device`']
---
::

The third row is the one that decides how long your suite takes. Reaching for a
new browser where a new context would do is the single most common reason a
Browser suite runs slower than it needs to.

## In short

- Browser = process, context = session, page = tab.
- Contexts are the cheap unit of isolation. Use them freely.
- `New Page` opens whatever is missing underneath it.
- Cookies, storage, permissions, viewport, locale, tracing and video all belong
  to the **context**.
- `auto_closing_level=KEEP` is for writing tests, never for running them.
