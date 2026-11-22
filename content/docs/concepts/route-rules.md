---
title: Route rules
description: Make requests fail, then end the outage — what a route rule is, where it lives and when it ends.
section: concepts
order: 7
---

:since{version="21.1.0"} Sometimes a test needs requests to fail: to check an error path, to keep
analytics and ads out of a run, or to simulate an outage and then check that the
app recovers. Browser does this with **route rules**.

## What a route rule is

A route rule sits on a context or a page and decides what happens to matching
requests before they reach the network: it aborts them, so they fail with a
network error.

```robot-repl
Abort Requests    **/analytics/**
```

From now on, every request in the active context whose URL matches the pattern
fails with a network error, as if the server could not be reached. The page
sees an ordinary failed request; nothing about it says it came from a test.

[`Abort Requests`](/keywords#abort-requests) adds the rule. Its arguments:

::doc-table
---
head: [Argument, Is]
nowrap: [0]
rows:
  - ['`matcher`', 'Which requests the rule applies to: a glob or a `/regex/`']
  - ['`errorCode`', 'The network error they fail with, `failed` by default']
  - ['`times`', 'How many requests the rule aborts before it ends. Every one, by default']
  - ['`on`', '`Context` (the default) or `Page`']
---
::

It returns the rule id, which you need only if you want to remove that one rule
later.

## Matching requests

`matcher` is matched the same way as in
[`Wait For Request`](/keywords#wait-for-request): a glob such as
`**/api/orders/**`, or a JavaScript regular expression between slashes, such as
`/\/api\/orders\/\d+$/`.

An invalid regular expression fails the keyword. It does not quietly fall back
to being a glob, which would match nothing and leave you wondering why the
outage never happened.

Predicates, where your own code decides whether a request matches, are not
supported. If the URL is not enough to tell requests apart, the rule cannot
tell them apart either.

## Context or Page

`on` decides where the rule lives.

- **`on=Context`**, the default, puts the rule on the active context. It applies
  to every page of that context, including pages opened later.
- **`on=Page`** puts the rule on the active page and keeps it there. It does not
  follow `Switch Page`, it does not move to pages opened later, and it ends when
  that page closes.

```text
Context · rule A  (on=Context)
│
├── Page 1 · rule B  (on=Page)   ← A and B
├── Page 2                       ← A
└── Page 3 · opened later        ← A
```

Rule A reaches every page, the late one included. Rule B reaches only the page
it was added on, even after `Switch Page` makes another page active. Both
survive `Go To`: navigating changes the document, not the page.

A second context gets neither, as with everything else a context holds. See
[Browser, context and page](/docs/concepts/browser-context-page#the-context).

## When a rule ends

A rule ends in exactly three ways:

1. Its context or page closes.
2. You remove it, with `Remove Route Rule` or `Remove All Route Rules`.
3. It has aborted `times` requests.

It does **not** end at the end of a test or suite, and the same is true when you
call the library from Python. Route rules belong to the context or page, like
cookies do, so they last exactly as long as it does.

::doc-note{kind="warning"}
This is the trap. When a suite shares one context across its tests, a Context
rule added in one test still aborts requests in the next, and that test fails
for a reason its own steps do not show.

There are two ways out. Open a [`New Context`](/keywords#new-context) per test, which is the cheap clean
slate it always is, or call `Remove All Route Rules` in the test teardown.
::

With the default `auto_closing_level=TEST`, a context opened inside a test closes
when the test ends, and its rules go with it. The trap is a context opened in
suite setup, as in the teardown example under
[Removing rules](#removing-rules).

## Simulating an outage and recovery

An app that retries, or that shows an error and offers a reload, needs an outage
that ends. There are two ways to end one.

### A fixed number of failures

`times` ends the rule by itself. Here the first two requests fail and the third
reaches the server:

```robot
*** Test Cases ***
Orders Recover After Two Failures
    New Page          ${APP_URL}
    Abort Requests    **/api/orders    times=2
    Click             id=reload-orders    # request aborted
    Click             id=reload-orders    # request aborted
    Click             id=reload-orders    # reaches the server
    Get Text          id=orders-status    ==    loaded
```

The clicks stand in for retries. An app that retries by itself gets the same
outage with no clicks at all: two failures, then success, while the test only
waits for the result.

`times` must be 1 or more. `times=0` fails before the browser is involved.

### Ending the outage when the test decides

Keep the id that `Abort Requests` returns, and remove the rule when the outage
should be over:

```robot
*** Test Cases ***
Orders Recover When The Outage Ends
    New Page            ${APP_URL}
    ${rule} =           Abort Requests    **/api/orders
    Click               id=reload-orders
    Get Text            id=orders-status    ==    error
    Remove Route Rule   ${rule}
    Click               id=reload-orders
    Get Text            id=orders-status    ==    loaded
```

This one fits when the length of the outage depends on what the app does, for
example when you first want to check the error message it shows.

## Removing rules

[`Remove Route Rule`](/keywords#remove-route-rule) takes the id from
`Abort Requests` and removes that rule.

- It finds the rule in any context, so a Page rule can be removed while another
  page, or another context, is active.
- An unknown id, or the id of a rule that has already ended, is logged and the
  keyword passes. So does a call with no context open. That makes it safe in a
  teardown, where you cannot always know whether the rule is still there.
- When the keyword returns, the rule affects no request. If the rule was in the
  middle of handling one, the keyword waits for it to finish first.

[`Remove All Route Rules`](/keywords#remove-all-route-rules) removes the Context
rules of the active context and the Page rules of every page in it. It waits
for running handlers in the same way, and logs how many Context and Page rules
it removed. With no rules, or no context open, it logs and passes, so it works
in a teardown that runs after `Close Context`.

Here the suite shares one context, so without the teardown the first test's
rule would still abort requests in the second:

```robot
*** Settings ***
Suite Setup      New Context
Test Teardown    Remove All Route Rules

*** Test Cases ***
Orders Show An Error During An Outage
    Abort Requests    **/api/orders
    New Page          ${APP_URL}
    Get Text          id=orders-status    ==    error

Orders Load Normally
    New Page          ${APP_URL}
    Get Text          id=orders-status    ==    loaded
```

It removes only the rules this library added. A route that a plugin or a
JavaScript extension keyword set with `page.route` stays.

It covers the active context only. For every context of the active browser,
switch to each one:

```robot
*** Keywords ***
Remove Route Rules From All Contexts
    ${contexts} =    Get Context Ids    ALL    ACTIVE
    FOR    ${context}    IN    @{contexts}
        Switch Context            ${context}
        Remove All Route Rules
    END
```

## Error codes

`errorCode` takes one of the members of
[`AbortErrorCode`](/keywords#type--aborterrorcode), the error codes Playwright
knows:

::doc-table
---
head: [errorCode, The request fails because]
nowrap: [0]
rows:
  - ['`failed`', 'A generic failure. The default.']
  - ['`aborted`', 'The operation was aborted, by the user or by the page']
  - ['`accessdenied`', 'Permission to access a resource, other than the network, was denied']
  - ['`addressunreachable`', 'The IP address is unreachable']
  - ['`blockedbyclient`', 'The client chose to block the request']
  - ['`blockedbyresponse`', 'The response came with requirements that were not met, such as `X-Frame-Options` or `Content-Security-Policy`']
  - ['`connectionaborted`', 'No ACK was received for data sent']
  - ['`connectionclosed`', 'The connection was closed']
  - ['`connectionfailed`', 'The connection attempt failed']
  - ['`connectionrefused`', 'The connection attempt was refused']
  - ['`connectionreset`', 'The connection was reset']
  - ['`internetdisconnected`', 'The Internet connection was lost']
  - ['`namenotresolved`', 'The host name could not be resolved']
  - ['`timedout`', 'The operation timed out']
---
::

```robot-repl
Abort Requests    **/api/**    errorCode=timedout
```

Chromium reports the matching network error, `net::ERR_TIMED_OUT` for
`timedout`. Firefox and WebKit report most codes as one generic failure.

So a test that checks only *that* a request failed runs in every browser. A test
that checks the browser's error text runs in Chromium only.

An unknown `errorCode` fails before anything reaches the browser.

## Service workers and the HTTP cache

**Requests a service worker answers.** A service worker sits between the page
and the network, and a request it answers itself never becomes a network
request that a rule could see. To route those requests too, block
service workers when you open the context:

```robot-repl
New Context    serviceWorkers=block
```

**The HTTP cache.** Playwright turns the HTTP cache off for a context or page
once routing is enabled on it. A page under a route rule fetches what it would
otherwise have taken from the cache, so it can be slower and send more requests
than it does without the rule.

## Seeing what a rule did

`Abort Requests` logs the rule id, the matcher, the error code, `times` and `on`
in `log.html`:

```text
Added route rule 3f1c…: abort **/api/orders with failed, times=2, on=Context.
```

Each request a rule matches is logged on the Node side only, in
[`playwright-log.txt`](/docs/concepts/logging#playwright-logtxt), together with
the rule id. Like the library's other Node messages it is a JSON line, and its
`msg` field reads:

```text
Route rule 3f1c… matched GET https://example.com/api/orders
```

That keeps `log.html` readable when a rule blocks hundreds of analytics calls.
When you need to know whether a particular request was aborted, search
`playwright-log.txt` for the rule id that `log.html` shows.

## In short

- `Abort Requests` makes matching requests fail, and returns the rule id.
- `on=Context` covers every page of the context, `on=Page` only the page it was
  added on.
- A rule ends when its context or page closes, when it is removed, or when its
  `times` is used up. Never at the end of a test.
- A shared context carries rules from test to test. Use `New Context` per test,
  or `Remove All Route Rules` in the teardown.
- Requests that a service worker answers bypass every rule. Use
  `serviceWorkers=block`.
