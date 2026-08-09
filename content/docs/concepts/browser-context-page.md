---
title: Browser, context and page
description: Three layers that build on each other — and why a new context is the cheapest clean slate you will ever get.
section: concepts
order: 2
---

Browser works in three layers. Almost every question about isolation, speed or
"why is this test seeing the previous test's login" is answered by knowing which
layer you are on.

::doc-table
---
head: [Layer, Is, Costs]
rows:
  - ['**Browser**', 'A running Chromium, Firefox or WebKit process', 'Expensive — a real process']
  - ['**Context**', 'An isolated session inside that process', 'Nearly free']
  - ['**Page**', 'A tab, with its own history', 'Free']
---
::

## The browser

One process, one engine. Three are available, and they cover what people
actually use:

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
and no version of a driver to keep in step with a version of a browser. The same
three engines run on Windows, Linux and macOS.

A browser starts headless unless you say otherwise:

```robot-repl
New Browser    chromium    headless=False
```

## The context

A context is an independent session inside an already-running browser: its own
cookies, its own storage, its own permissions. Two contexts in one browser share
nothing.

This is the layer worth understanding, because it is where Browser is
structurally faster than the older tools. In Selenium, an isolated session means
a new browser process. Here it is one call inside a process that is already
warm:

```robot-repl
New Context    # a clean slate, in milliseconds
```

So the pattern "log in as a different user" does not mean restarting anything.
Neither does "start this test from a known-clean state" — which is why the
advice on [waiting and setup](/docs/concepts/selectors) never involves clearing
cookies by hand.

A context is also where the interesting configuration lives — viewport,
geolocation, locale, colour scheme, HTTP credentials, downloads:

```robot-repl
New Context    viewport={'width': 1920, 'height': 1080}    locale=de-DE
New Context    acceptDownloads=True
New Context    httpCredentials={'username': 'admin', 'password': 'secret'}
```

Downloads need `acceptDownloads=True` — without it a download is discarded, and
that catches people out.

## The page

A page is a tab. It holds the document and its own history, and it is where
every selector actually resolves.

```robot
*** Test Cases ***
Starting A Browser With A Page
    New Browser    chromium    headless=False
    New Context    viewport={'width': 1920, 'height': 1080}
    New Page       https://robotframework-browser.org
    Get Title      ==    Robot Framework Browser
```

## You rarely need all three

The layers fill themselves in downwards. `New Page` with nothing open starts a
browser and a context first, with defaults:

```robot-repl
New Page    https://robotframework-browser.org
```

And `Open Browser` does all three in one call. It is built for experiments and
debugging sessions rather than for suites — when you want control over the
context, open the three yourself.

## Addressing them later

Every browser, context and page has an id. `Get Browser Catalog` returns the
whole tree of what is currently open, which is the quickest way to answer "what
does the library think is running right now" when a suite has drifted from what
you expected.

## Which layer for which job

::doc-table
---
head: [You want, Open]
rows:
  - ['A second user session', 'A new **context**']
  - ['A popup or a second tab in the same session', 'A new **page**']
  - ['A different engine, or a GUI, or a proxy', 'A new **browser**']
  - ['A clean slate between tests', 'A new **context** — not a new browser']
---
::

The last row is the one that matters for suite runtime. Reaching for a new
browser when a new context would do is the single most common reason a Browser
suite runs slower than it needs to.
