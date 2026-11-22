---
title: Route rules
description: Make requests fail, answer them with a mock response, or change the real request and response — what a route rule is, where it lives and when it ends.
section: concepts
order: 7
---

:since{version="21.1.0"} Sometimes a test needs requests to fail: to check an error path, to keep
analytics and ads out of a run, or to simulate an outage and then check that the
app recovers. Other times it needs an answer the real server would not give, or
not on demand: to test the frontend apart from the backend, or to get a `500`
exactly once. And sometimes the real server should answer, but with something
changed: another backend, an extra header, or one field of the JSON set to an
edge case. Browser does all three with **route rules**.

## What a route rule is

A route rule sits on a context or a page and decides what happens to matching
requests before they reach the network. It aborts them, so they fail with a
network error, answers them with a **mock response**, so they never reach the
server, or sends them on and changes the request and the real response on the
way.

::doc-figure{src="/images/route-rules/traffic.svg" alt="Three rows, one per keyword, each with the columns Page, Route rule and Server. Abort Requests: the request goes from the page to the rule, which sends a network error back; the server is not reached. Mock Responses: the rule sends a mock response back; the server is not reached. Modify Responses: the rule sends a changed request to the server, gets the real response, and sends a changed response back to the page."}
Where a request goes under each kind of rule.
::

```robot-repl
Abort Requests    **/analytics/**
```

From now on, every request in the active context whose URL matches the pattern
fails with a network error, as if the server could not be reached. The page
sees an ordinary failed request; nothing about it says it came from a test.

[`Abort Requests`](/keywords#abort-requests) adds a rule that aborts. Its
arguments:

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

[`Mock Responses`](/keywords#mock-responses) adds a rule that answers instead:

```robot-repl
Mock Responses    **/api/orders    json=${orders}
```

Every matching request now gets a `200` with `${orders}` as its JSON body, and
the server never sees it. `Mock Responses` takes the same `matcher`, `times` and
`on`, returns a rule id in the same way, and its rules end and are removed in
the same ways. What it answers with is under [Mock responses](#mock-responses).

[`Modify Responses`](/keywords#modify-responses) adds a rule that lets the
request through and changes what you name:

```robot-repl
Modify Responses    **/api/orders    status=500    headers={"Retry-After": "5"}
```

The server gets the request and answers as usual, and the page gets that
answer with the status `500` and one more header. The same `matcher`, `times`
and `on` apply. See [Modify responses](#modify-responses).

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
3. It has handled `times` requests: aborted them, or answered them.

It does **not** end at the end of a test or suite, and the same is true when you
call the library from Python. Route rules belong to the context or page, like
cookies do, so they last exactly as long as it does.

::doc-note{kind="warning"}
This is the trap. When a suite shares one context across its tests, a Context
rule added in one test still aborts or answers requests in the next, and that
test fails for a reason its own steps do not show.

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

## Mock responses

A mock response is built from a status, a payload and headers.

### Payloads and content types

Give at most one of `body`, `json` and `path`. Give none, and the body is empty,
as for a `204`:

::doc-table
---
head: [Argument, Is]
nowrap: [0]
rows:
  - ['`body`', 'Text, sent as UTF-8. `body=` is an empty body']
  - ['`json`', 'Any value that can be JSON-encoded: a dictionary, a list, a number']
  - ['`path`', 'A file whose bytes are the body, so binary files work. A relative path resolves against the working directory']
---
::

Unless `headers` has a Content-Type, each one gets its own:

::doc-table
---
head: [Payload, Content-Type]
nowrap: [0]
rows:
  - ['`body`', '`text/plain; charset=utf-8`']
  - ['`json`', '`application/json`']
  - ['`path`', 'From the file extension, with `charset=utf-8` for a `text/` type. `application/octet-stream` if the extension is unknown']
  - ['none', 'None. WebKit reports `application/octet-stream`']
---
::

A `Content-Type` in `headers` always wins.

A few cases that do not follow from the table:

- A `json=` string is sent as a JSON string, quotes included, and never parsed.
  To send JSON text you already have, put it in `body=` with a Content-Type
  header.
- `json=${None}` means no `json` at all. A JSON `null` body is `body=null` with
  a Content-Type header.
- A text file in an encoding other than UTF-8 needs its Content-Type, with the
  right charset, in `headers`.

### Status and headers

`status` is from 100 to 599, `200` by default. There is no argument for the
reason phrase: the browser shows the standard phrase, or `Unknown` for a code
such as `299`.

`headers` is the complete header set of the response, because there is no real
response to merge it with. Header names are case-insensitive. Two names that
differ only in case reach the page as one header, and which value wins depends
on the browser.

```robot-repl
Mock Responses    **/api/orders    status=201    body=created    headers={"Location": "/api/orders/7"}
```

### An error path

A second rule on the same matcher takes over from the first, because the newest
rule wins (see [Rule order](#rule-order)). With `times=1` it ends after one
request and hands back to the first:

```robot
*** Test Cases ***
Orders Show An Error Once
    New Page          ${APP_URL}
    Mock Responses    **/api/orders    json=${orders}
    Mock Responses    **/api/orders    status=500    times=1
    Click             id=reload-orders    # gets the 500
    Get Text          id=orders-status    ==    error
    Click             id=reload-orders    # gets ${orders}
    Get Text          id=orders-status    ==    loaded
```

### Fail once, then the real server

A single rule with `times=1` mocks the first request, and the next one reaches
the server:

```robot-repl
Mock Responses    **/api/orders    status=503    times=1
```

This is the same recovery as in
[Simulating an outage and recovery](#simulating-an-outage-and-recovery), with an
error response instead of a network error.

### A binary file

`path` sends a file as it is on disk:

```robot-repl
Mock Responses    **/img/logo.png    path=${CURDIR}/logo.png
```

An `<img>` that loads `/img/logo.png` gets the file, as `image/png` from its
extension. Python reads the file, so it needs to exist only where the tests run,
even when Node runs on another machine.

### Tokens

A mock response sometimes carries a token: a `Set-Cookie` header, or a body
that an app logs in with. Give a real token as a Robot Framework
[Secret](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#secret-variables),
in `body` or as a header value, to keep it out of the Robot Framework log. A
plain string still shows in the keyword's arguments in `log.html`.

- With `enable_playwright_debug` in the library import, the value still shows
  in the Playwright debug log.
- A Secret used inside text, such as `body={"token": "${token}"}`, becomes the
  literal text `<secret>`. Give the whole body as the Secret instead.

## Modify responses

### Modify or mock

Mock when the server should not be involved at all: the backend is not there
yet, or the test must not depend on its data. Modify when the real answer is
mostly right and one part should be different, or when the request should go
somewhere else:

- point `/api` at a staging host or a fixture server;
- add an `Authorization` header, or change the method or body the server gets;
- set one field of the real JSON to an edge case the backend would not produce
  on demand;
- give back a real response with another status;
- strip a header such as `Content-Security-Policy`.

Every change is optional and keeps the real value when you leave it out, but
the keyword needs at least one. The page always keeps the URL it asked for.

::doc-table
---
head: [Argument, Changes]
nowrap: [0]
rows:
  - ['`request_url`', 'Where the request goes: an absolute URL, or one relative to the original request URL']
  - ['`request_method`', 'The method the server gets']
  - ['`request_headers`', 'Merged onto the real request headers']
  - ['`request_body`', 'The body the server gets, as UTF-8 text']
  - ['`status`', 'The status the page gets, from 100 to 599']
  - ['`headers`', 'Merged onto the real response headers']
  - ['`body`, `json`, `path`', 'Replace the real body, exactly as in [Mock responses](#payloads-and-content-types)']
  - ['`json_patch`', 'Changes fields of the real JSON body']
---
::

### Another backend

`request_url` sends the request somewhere else. A relative URL resolves against
the original request URL, so the host stays and only the path changes:

```robot-repl
Modify Responses    **/api/orders    request_url=/api/v2/orders
```

An absolute URL moves the request to another host:

```robot-repl
Modify Responses    **/api/**    request_url=https://staging.example.com/api/orders
```

The server at the new URL gets the cookies the context holds **for that URL**,
the same ones the browser would send if the page called it directly. The
original `Cookie` and `Host` headers are not forwarded. That keeps all three
browsers alike: left alone, Chromium and Firefox would send the old cookies to
the new host, and Firefox the old `Host` too. To send a cookie to the new host,
add it to the context with [`Add Cookie`](/keywords#add-cookie) for that URL.

### Method and body

`request_method` changes the method and `request_body` the body. The
Content-Type of the original request stays unless `request_headers` sets a new
one, and the length is recalculated:

```robot-repl
Modify Responses    **/api/search    request_method=POST    request_body={"q": "robot"}    request_headers={"Content-Type": "application/json"}
```

Changing to `GET` or `HEAD` without `request_body` sends no body, so a form post
turned into a `GET` does not carry its old form data along.

### Adding and removing headers

`headers` and `request_headers` merge onto the real headers instead of
replacing them:

- names are compared case-insensitively;
- a value you give wins over the real one;
- an empty string removes the header.

Stripping the Content Security Policy from a page, for example to inject a
script that the policy would block:

```robot-repl
Modify Responses    **/app.html    headers={"Content-Security-Policy": ""}
```

Adding a token that only the test knows, given as a Secret (see
[Tokens and secrets](#tokens-and-secrets)):

```robot
*** Test Cases ***
Orders Load With The Service Token
    VAR    ${token: Secret} =    %{SERVICE_TOKEN}
    VAR    &{auth} =    Authorization=${token}
    Modify Responses    **/api/orders    request_headers=${auth}
    New Page    ${APP_URL}
    Get Text    id=orders-status    ==    loaded
```

### Replacing the body

`body`, `json` and `path` replace the real body with a payload of your own, and
the Content-Type follows the same table as for a mock response. The difference
from `Mock Responses` is that the request still reaches the server, so the real
status and headers stay, along with whatever the server did with the request.

```robot-repl
Modify Responses    **/api/orders    json=${{ [] }}
```

When the body changes, the real `Content-Encoding` and `Content-Length` are
dropped. The page gets the new body already decoded, and a stale `gzip` or
length would not match it. Some browsers then set a `Content-Length` of their
own, which is the length of the new body.

### Changing fields of the JSON

`json_patch` changes the real JSON body with an
[RFC 7386 JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7386). Its rules
fit in three lines:

- dictionaries merge, key by key and at every depth;
- `${None}` deletes a key;
- anything else, a list included, replaces the value whole.

::doc-table
---
head: [Real body, json_patch, Page gets]
nowrap: [0, 1, 2]
rows:
  - ['`{"id": 7, "state": "open"}`', '`{"state": "cancelled"}`', '`{"id": 7, "state": "cancelled"}`']
  - ['`{"id": 7, "note": "x"}`', '`{"note": None}`', '`{"id": 7}`']
  - ['`{"order": {"id": 7, "total": 12}}`', '`{"order": {"total": 0}}`', '`{"order": {"id": 7, "total": 0}}`']
  - ['`{"items": [1, 2, 3]}`', '`{"items": [4]}`', '`{"items": [4]}`']
  - ['`{"id": 7}`', '`{"tags": ["new"]}`', '`{"id": 7, "tags": ["new"]}`']
---
::

In Robot Framework the patch is a dictionary:

```robot
*** Test Cases ***
Cancelled Order Shows No Total
    VAR    &{order} =    state=cancelled    total=${None}
    VAR    &{patch} =    order=${order}
    Modify Responses    **/api/orders/7    json_patch=${patch}
    New Page    ${APP_URL}/orders/7
    Get Text    id=order-state    ==    cancelled
    Get Element Count    id=order-total    ==    0
```

A list cannot be patched item by item, so to change one order in a list,
give the whole list. To replace the whole body, use `json` instead: a patch
that is not a dictionary would do the same, so `json_patch` takes only a
dictionary.

The real Content-Type stays. If the real body is not JSON, the page request
fails, as under [Failures and timeouts](#failures-and-timeouts).

### Redirects

The real request follows redirects, up to 20, before the rule changes anything.
The page gets the final response at the URL it asked for, and it never sees the
redirect. The redirect target does not pass through route rules, so a rule
that matches only the target does not see it.

### Failures and timeouts

`Modify Responses` itself passes as soon as the rule is added. A problem with
the real request shows up later, when a request fires:

- the server cannot be reached;
- the real request takes longer than the timeout;
- `json_patch` meets a body that is not JSON.

The page request then fails as a network error, like one from
`Abort Requests`, and the error is logged in
[`playwright-log.txt`](/docs/concepts/logging#playwright-logtxt) with the rule
id. The log leaves out Playwright's call log, because it lists the request
headers.

The timeout is the browser timeout in effect **when the rule is added**, not
when a request fires. To give one rule a shorter timeout, change it around the
keyword:

```robot
*** Test Cases ***
Slow Orders Fail Fast
    ${old} =    Set Browser Timeout    1s
    TRY
        Modify Responses    **/api/orders    status=200
    FINALLY
        Set Browser Timeout    ${old}
    END
    New Page    ${APP_URL}
    Get Text    id=orders-status    ==    error
```

The same timeout bounds how long `Remove Route Rule` waits for a request the
rule is handling.

### Tokens and secrets

Header values, `request_url`, `request_body` and `body` can be Robot Framework
[Secrets](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#secret-variables).
The keyword logs header names but never their values, a Secret `request_url` as
`<secret>`, and only *that* a body changes:

```text
Added route rule 9c4d…: modify **/api/orders, request: url=<secret>, headers=[Authorization]; response: status=500, json_patch, times=None, on=Context.
```

The same limits as for [mock tokens](#tokens) apply: a plain string still shows
in the keyword's arguments in `log.html`, and `enable_playwright_debug` shows
the values in the Playwright debug log.

### Size

A replaced body and `request_body` travel from Python to the library's Node
process in one message, so payloads over about 4 MB fail. A `json_patch` is
small however large the real body is, because Node applies it to the real body.

## Rule order

When several rules match a request, the **newest rule wins**, and a Page rule
wins over a Context rule. Removing the newer rule brings back the older rule's
behaviour.

```robot
*** Test Cases ***
Orders Fall Back To The Outage
    New Page             ${APP_URL}
    Abort Requests       **/api/orders
    ${mock} =            Mock Responses    **/api/orders    json=${orders}
    Click                id=reload-orders    # gets ${orders}
    Get Text             id=orders-status    ==    loaded
    Remove Route Rule    ${mock}
    Click                id=reload-orders    # aborted again
    Get Text             id=orders-status    ==    error
```

A rule whose `times` is used up has ended, so the request goes on to the next
older rule, as in [An error path](#an-error-path).

## Cross-origin requests

A cross-origin mock response needs no CORS headers. A page on `localhost` that
fetches from `127.0.0.1` gets the mock in all three browsers, also with
credentials.

A mock that sets its own `Access-Control-Allow-Origin` is checked by the
browser like a real response, so `*` together with credentials fails.

The preflight `OPTIONS` request never reaches a route rule, or the server.

## Removing rules

[`Remove Route Rule`](/keywords#remove-route-rule) takes the id from
`Abort Requests`, `Mock Responses` or `Modify Responses` and removes that rule.

- It finds the rule in any context, so a Page rule can be removed while another
  page, or another context, is active.
- An unknown id, or the id of a rule that has already ended, is logged and the
  keyword passes. So does a call with no context open. That makes it safe in a
  teardown, where you cannot always know whether the rule is still there.
- When the keyword returns, the rule affects no request. If the rule was in the
  middle of handling one, the keyword waits for it to finish first.

[`Remove All Route Rules`](/keywords#remove-all-route-rules) removes the Context
rules of the active context and the Page rules of every page in it, whichever
kind they are. It waits for running handlers in
the same way, and logs how many Context and Page rules it removed. With no rules, or no context open, it logs and passes, so it works
in a teardown that runs after `Close Context`.

Here the suite shares one context, so without the teardown the first test's
rule would still abort requests in the second, as a mock rule would still
answer them:

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

`Mock Responses` logs the rule id, the matcher, the status, the kind of
payload, `times` and `on`. It never logs the body or header values:

```text
Added route rule 7a2e…: mock **/api/orders with status 200 and json body, times=None, on=Context.
```

`Modify Responses` logs what it changes, with header names only, as shown
under [Tokens and secrets](#tokens-and-secrets).

Each request a rule matches, aborted, answered or changed, is logged on the Node side
only, in [`playwright-log.txt`](/docs/concepts/logging#playwright-logtxt),
together with the rule id. Like the library's other Node messages it is a JSON line, and its
`msg` field reads:

```text
Route rule 3f1c… matched GET https://example.com/api/orders
```

That keeps `log.html` readable when a rule blocks hundreds of analytics calls.
When you need to know whether a particular request was aborted, mocked or changed, search
`playwright-log.txt` for the rule id that `log.html` shows.

## In short

- `Abort Requests` makes matching requests fail, `Mock Responses` answers
  them with a mock response, and `Modify Responses` lets them through and
  changes the request and the real response. All three return the rule id.
- `Modify Responses` merges headers, `""` removes one, and `json_patch`
  changes fields of the real JSON.
- A mock response takes at most one of `body`, `json` and `path`, and a
  Content-Type in `headers` always wins.
- When several rules match, the newest wins, and a Page rule wins over a Context
  rule.
- A cross-origin mock needs no CORS headers.
- `on=Context` covers every page of the context, `on=Page` only the page it was
  added on.
- A rule ends when its context or page closes, when it is removed, or when its
  `times` is used up. Never at the end of a test.
- A shared context carries rules from test to test. Use `New Context` per test,
  or `Remove All Route Rules` in the teardown.
- Requests that a service worker answers bypass every rule. Use
  `serviceWorkers=block`.
