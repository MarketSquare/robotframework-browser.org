---
title: Browser vs SeleniumLibrary
tool: SeleniumLibrary
slug: vs-seleniumlibrary
order: 3
tagline: The long-standing Robot Framework web library, built on Selenium WebDriver.
comparedAgainst: SeleniumLibrary 6.7 on Selenium 4, Browser %%browser%%
---

Some of us maintained SeleniumLibrary for years before starting Browser, and its
current maintainers are our friends. It is a good library, it is actively
maintained, and for a great many projects it is the right answer.

So this page is facts, not persuasion. Two libraries, two underlying
technologies, and what actually differs.

::doc-note
Both are Robot Framework libraries, so this really is like for like. The
differences below come mostly from the layer underneath: **WebDriver** for
SeleniumLibrary, **Playwright** for Browser.
::

## The same test, both ways

::comparison{left="comparison/seleniumlibrary/browser.robot" right="comparison/seleniumlibrary/seleniumlibrary.robot"}
---
notes:
  - Selenium's own "eight components" example, written with each library.
  - Browser's getters assert, so Get Text does in one line what Wait Until Element Is Visible plus Element Text Should Be does in two.
  - Neither file is unreadable. This is not the interesting difference.
---
::

The code is not where the gap is. The gap is underneath.

## How the two talk to the browser

::doc-table
---
head:
  - ""
  - Browser (Playwright)
  - SeleniumLibrary (WebDriver)
rows:
  - - Protocol
    - One persistent WebSocket connection to the browser
    - W3C WebDriver, an HTTP request per command
  - - What it launches
    - Browser builds Playwright downloads and pins
    - The browser installed on the machine, through a driver
  - - Extra binaries
    - "`rfbrowser init` downloads browsers; no per-browser driver"
    - A driver per browser, resolved by Selenium Manager since 4.6
  - - Version coupling
    - Browsers are pinned to the Playwright version, so they match by construction
    - Driver and browser must stay in step as the browser auto-updates
---
::

The protocol difference is the origin of most of the rest. A command per HTTP
round trip means every element lookup, every check and every retry is another
request; it also means the browser can change between two of them, which is
where `StaleElementReferenceException` comes from.

## Waiting

This is the single largest practical difference.

**Browser** performs Playwright's actionability checks before every action. For a
click, all five must pass: the element is **visible**, **stable** (unmoved for
two animation frames), **receives events** (nothing is on top of it), **enabled**,
and for typing also **editable**. It retries until they do or the timeout
expires, and the failure names the check that never passed.

**SeleniumLibrary** offers an implicit wait — a global timeout applied to element
lookup, and lookup only — plus explicit `Wait Until ...` keywords you place
yourself. Selenium waits for `document.readyState` on navigation, which, as
[its own documentation notes](https://www.selenium.dev/documentation/webdriver/waits/),
"only concerns itself with loading assets defined in the HTML" — a
JavaScript-rendered page is not covered.

::doc-table
---
head:
  - ""
  - Browser
  - SeleniumLibrary
rows:
  - - Before an action
    - Five actionability checks, automatically
    - Nothing beyond the implicit lookup wait
  - - Element under an overlay
    - Waits for the overlay to go, then clicks
    - Clicks, and the overlay receives it
  - - Element still animating
    - Waits for it to stop
    - Clicks mid-animation
  - - DOM re-render between lookup and use
    - Locator re-resolves
    - "`StaleElementReferenceException`"
  - - Explicit waits in a normal test
    - Rare
    - Common
---
::

That last row is the one you feel. `Wait Until Element Is Visible` before a
click is a line SeleniumLibrary suites are full of, and Browser suites do not
have.

## Selectors

::doc-table
---
head:
  - Strategy
  - Browser
  - SeleniumLibrary
rows:
  - - "CSS, XPath, id, name, class, tag"
    - Yes
    - Yes
  - - Link text
    - Via `text=`
    - "`link:` and `partial link:`"
  - - "By accessible role and name (`role=`)"
    - Yes
    - No equivalent
  - - "Visible text as a first-class engine (`text=`)"
    - Yes, substring or exact
    - Anchors only
  - - Chaining several strategies
    - "`>>`"
    - "`>>`"
  - - Open shadow DOM
    - Pierced automatically
    - Not a locator strategy; needs the shadow root through JavaScript
  - - Crossing into an iframe
    - "`>>>` inside the same selector"
    - "`Select Frame`, then `Unselect Frame`"
  - - More than one match
    - Strict mode by default — an error
    - First match wins
---
::

Role selectors are the substantive addition. `role=button[name="Save"]` matches
what the element *is* and what it is *called* — the two things a screen-reader
user navigates by — so it survives a redesign that moves the button and rewrites
the markup around it. There is no WebDriver equivalent; you approximate it with
XPath over ARIA attributes.

Shadow DOM is the other. Selenium 4 can reach a shadow root via `getShadowRoot()`
per host, so it is possible; it is not a selector, so it does not compose with
the rest of a locator, and it does not nest without work.

## Diagnosing a failure

::doc-table
---
head:
  - ""
  - Browser
  - SeleniumLibrary
rows:
  - - Screenshot on failure
    - Yes, in the Robot Framework log
    - Yes, in the Robot Framework log
  - - Video of the run
    - "`New Context    recordVideo=...`"
    - Not built in
  - - Trace
    - "`New Context    tracing=True` — DOM snapshots per action, network, console, timeline"
    - No equivalent
  - - Network inspection
    - Built in, including request interception
    - Via CDP, Chromium only
---
::

The trace is the part with no counterpart. A Playwright trace is a recording you
open afterwards and step through: for every action, the DOM as it was, with
DevTools over it, plus the network and console at that moment. It is the
difference between "the click failed" and seeing the element you meant to click
sitting behind a cookie banner.

## Browsers and platforms

Where SeleniumLibrary is genuinely ahead — and it is worth being straight about
this, because it decides real projects:

::doc-table
---
head:
  - ""
  - Browser
  - SeleniumLibrary
rows:
  - - Engines
    - Chromium, Firefox, WebKit
    - Chrome, Edge, Firefox, Safari, and more via WebDriver
  - - The actual shipped browser
    - "Playwright's builds; real Chrome or Edge via `channel`"
    - Always the real installed browser
  - - Safari proper
    - No — WebKit is the same engine, not the same browser
    - Yes, safaridriver
  - - Internet Explorer, legacy browsers
    - No
    - Yes
  - - Remote execution
    - Playwright browser server, or `Connect To Browser`
    - Selenium Grid, which is mature and widely deployed
  - - Mobile
    - Device emulation
    - Emulation, and real devices through the Appium ecosystem
---
::

If you must certify against Safari itself rather than WebKit, or you have an
established Selenium Grid, or a stakeholder requires the vendor's own browser
under test, SeleniumLibrary is not the compromise — it is the correct tool.

## Performance

We are not going to publish a benchmark, because a benchmark of two tools on one
suite mostly measures the suite. The structural reasons Browser tends to be
faster are stateable without one:

- **One connection instead of many requests.** Every WebDriver command is an
  HTTP round trip; Playwright multiplexes over a single WebSocket.
- **No per-element round trips for waiting.** Actionability is evaluated in the
  browser rather than polled from outside.
- **Contexts instead of browsers for isolation.** `New Context` gives a clean,
  isolated profile in a few milliseconds; a fresh Selenium session starts a browser.
- **One Node process for all three engines**, rather than a driver process per
  browser.

Flakiness follows the same logic. Most of it comes from acting on an element
that was not ready, and the actionability checks remove that category rather
than mitigating it.

## Choosing

::doc-table
---
head:
  - Choose
  - When
rows:
  - - SeleniumLibrary
    - You need Safari, IE or another WebDriver-only browser; you have a Selenium
      Grid; you have a large suite that works, and rewriting it buys nothing;
      your organisation standardises on WebDriver.
  - - Browser
    - You are starting fresh; your app is a JavaScript-heavy SPA; you keep
      writing explicit waits; you need shadow DOM, iframes or role selectors;
      you want traces and video; suite runtime matters.
---
::

There is no obligation to migrate. Both libraries are maintained, both are
Robot Framework libraries, and they can live in the same project — one suite on
each, sharing everything else. Starting Browser has never required abandoning
SeleniumLibrary.

::doc-note
Checked against SeleniumLibrary 6.7 on Selenium 4 and Browser %%browser%%. If
anything here is wrong or has aged badly,
[tell us](https://github.com/MarketSquare/robotframework-browser/issues) —
we would rather fix it than let an unfair comparison stand.
::
