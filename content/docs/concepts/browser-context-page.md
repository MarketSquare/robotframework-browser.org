---
title: Browser, context and page
description: The three layers Playwright is built on — and why a new context is the cheapest clean slate you will ever get.
section: concepts
order: 1
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
  - ['**Browser**', 'A Chromium, Firefox or WebKit process', 'Slowest', '`New Browser`']
  - ['**Context**', 'An isolated session inside it', 'Cheapest', '`New Context`']
  - ['**Page**', 'A tab, with its own history', 'Cheap', '`New Page`']
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
New Context    # a clean slate, in a few milliseconds
```

So "log in as a different user" costs a few milliseconds of context creation
rather than a browser start, and so does "start this test from a known-clean
state". You do not clear cookies; you throw the context away and open another.

The context is also where the interesting configuration lives:

```robot-repl
New Context    viewport={'width': 1920, 'height': 1080}
New Context    locale=de-DE    timezoneId=Europe/Berlin
New Context    geolocation={'latitude': 48.86, 'longitude': 2.35}
New Context    httpCredentials={'username': '$user', 'password': '$pwd'}
New Context    acceptDownloads=True
New Context    colorScheme=dark
```

Downloads are accepted by default. Pass `acceptDownloads=False` if you want the
browser to refuse them.

The `$user` and `$pwd` above are not a typo. `httpCredentials` refuses a plain
value — it takes the `$name` placeholder form, and resolves the names from
variables, so the password never reaches the log.

Tracing and video recording are context-level too, which is why a trace covers
exactly one session:

```robot-repl
New Context    tracing=True
New Context    recordVideo={'dir': '${OUTPUT_DIR}/video'}
```

### Logging in once, and reusing it

A context starts empty: no cookies, no `localStorage`, nobody logged in. Doing
the login again in every test is the slowest thing most suites do, and the least
interesting to debug when it breaks.

`Save Storage State` takes what the *active context* has accumulated and writes
it to a file; `New Context` takes that file back:

```robot
*** Test Cases ***
Log In Once
    New Context
    New Page       ${LOGIN_URL}
    Fill Secret    id=username    $USERNAME
    Fill Secret    id=password    $PASSWORD
    Click          id=submit
    Get Text       id=header    ==    Signed in

    ${state} =    Save Storage State

    # A second session, already authenticated.
    New Context    storageState=${state}
    New Page       ${APP_URL}
    Get Text       id=header    ==    Signed in
```

#### What actually travels

Less than you might expect, and this is the part worth knowing before you rely
on it. Playwright's snapshot *can* carry cookies, `localStorage`, IndexedDB and
virtual WebAuthn credentials — but the last two only when asked for, and Browser
does not ask. It calls `storageState` with a path and nothing else, so you get
the defaults:

::doc-table
---
head: [State, Restored, ""]
nowrap: [0, 1]
rows:
  - - Cookies
    - "**yes**"
    - Session cookies included, subject to their own expiry
  - - "`localStorage`"
    - "**yes**"
    - Per origin, exactly as saved
  - - "`sessionStorage`"
    - "no"
    - By definition tied to one tab; it is not in the file at all
  - - IndexedDB
    - "no"
    - Playwright offers it as an option; Browser does not pass it
  - - WebAuthn credentials
    - "no"
    - Same reason
---
::

So a login that keeps its token in a cookie or in `localStorage` restores
cleanly. One that keeps it in `sessionStorage` does not, and no amount of saving
will change that — you have to log in per context.

#### Three things that catch people

**The file does not survive the run.** It is written to
`${OUTPUT_DIR}/browser/state/`, and that whole directory is deleted at the start
of every execution. Reuse within a run is what this is for; to carry a session
between runs, copy the file somewhere the next run will not wipe.

**The path must exist.** Anything else fails immediately and by name:

```
ValueError: storageState argument value 'does-not-exist.json' is not file,
but it should be.
```

It is checked before the context is created, so a typo costs no browser time.

**The file is a credential.** It contains live session cookies and whatever the
app put in `localStorage`. Anyone holding it is logged in as that user. Keep it
out of version control and out of build artefacts you publish.

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
    Get Title      *=    Robot Framework Browser
```

A popup, a target-blank link or a second tab is another page in the same
context, so it shares the login. It does **not** become the active page on its
own — reach it with `Switch Page`, given `NEW`, which returns the id of the page
you came from:

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
chromium  browser=94c1…
├── context=7f2a…
│   ├── page=3dce…  /login
│   └── page=8b17…  /cart
└── context=b3d9…
    └── page=1f60…  /admin

firefox  browser=1ae8…
└── context=5c04…
    └── page=42aa…  about:blank
```

Drawn as a tree here for readability; the keyword returns a list of
dictionaries, one per browser, each carrying its contexts and their pages.

What the tree does not show is which branch the next keyword will act on. That
lives in three fields, and they are not the same kind of thing.

`activeBrowser` is a **boolean**, one per browser, and exactly one is true —
here it is `chromium`. `activeContext` and `activePage` hold **ids**, and
*every* browser and context carries them whether or not it is the active
branch: `context=b3d9…` above is idle, and still names the page it would use if
you switched to it.

So in this catalog the next `Click` lands on `page=3dce…` at `/login`: chromium
is the true `activeBrowser`, its `activeContext` is `context=7f2a…`, and that
context's `activePage` is `page=3dce…`. Read the three in that order and you
always know where you are.

This is the fastest way to answer "what does the library think is running" when
a suite has drifted from what you expected. `Get Browser Ids`, `Get Context Ids`
and `Get Page Ids` return the pieces individually.

Keywords act on the *active* browser, context and page unless you say otherwise,
and `Switch Browser`, `Switch Context` and `Switch Page` move that pointer.

## When things close

By default, the **contexts and pages** a test opened are closed when the test
ends. Browsers are not: no auto-closing level closes a browser per test or per
suite, so a browser lives until execution ends or you call `Close Browser`. The
exceptions are a browser opened by `New Persistent Context` and one that a
JavaScript extension
[handed over with `adoptContext`](/docs/extending/javascript-extensions#handing-over-a-context-you-created)
— each is closed together with its context.

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
