---
title: Route rules
description: Make requests of the page fail, answer them with a mock response, or change the real request and response. Where a rule lives, when it ends, and which one wins.
section: http
order: 4
---

:since{version="21.1.0"} A **route rule** sits on a context or a page and handles
matching requests before they reach the network:

::doc-figure{src="/images/route-rules/traffic.svg" alt="Three rows, one per keyword, each with the columns Page, Route rule and Server. Abort Requests: the request goes from the page to the rule, which sends a network error back; the server is not reached. Mock Responses: the rule sends a mock response back; the server is not reached. Modify Responses: the rule sends a changed request to the server, gets the real response, and sends a changed response back to the page."}
Where a request goes under each kind of rule.
::

::doc-table
---
head: [Keyword, The request, Use it to]
nowrap: [0]
rows:
  - ['[`Abort Requests`](/keywords#abort-requests)', 'fails with a network error', 'test an error path or an outage, block analytics']
  - ['[`Mock Responses`](/keywords#mock-responses)', 'gets a mock response, the server never sees it', 'test the frontend without the backend, get a `500` on demand']
  - ['[`Modify Responses`](/keywords#modify-responses)', 'reaches the server; you change the request and the real response', 'use another backend, add a header, set one JSON field to an edge case']
---
::

```robot-repl
Abort Requests      **/analytics/**
Mock Responses      **/api/orders    json=${orders}
Modify Responses    **/api/orders    status=500    headers={"Retry-After": "5"}
```

All three take `matcher`, `times` and `on`, and return the rule id. `matcher`
follows the [shared rules](/docs/http/overview#matchers); a function gets the
request [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL):
`url => url.searchParams.get('id') === '7'`. Route rules see page traffic only, not
[`Send API Request`](/docs/http/overview#page-traffic-and-api-traffic).

## Context or Page

- **`on=Context`**, the default: every page of the active context, also pages opened
  later.
- **`on=Page`**: the active page only. The rule stays on that page; it does not follow
  `Switch Page`.

```text
Context · rule A  (on=Context)
│
├── Page 1 · rule B  (on=Page)   ← A and B
├── Page 2                       ← A
└── Page 3 · opened later        ← A
```

Both survive `Go To`. Another context gets neither, see
[Browser, context and page](/docs/concepts/browser-context-page#the-context).

## When a rule ends

1. Its context or page closes.
2. You remove it with `Remove Route Rule` or `Remove All Route Rules`.
3. It has handled `times` requests. `times` must be 1 or more.

::doc-note{kind="warning"}
A rule does **not** end with the test or suite. In a suite that shares one context,
a rule from one test still handles requests in the next. Open a
[`New Context`](/keywords#new-context) per test, or call `Remove All Route Rules` in
the test teardown.
::

A context opened inside a test closes with it under the default
`auto_closing_level=TEST`, and its rules go with it.

## Rule order

The **newest rule wins**, and a Page rule wins over a Context rule. When it ends, the
next older rule takes over:

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

## Outage and recovery

A fixed number of failures with `times`, or an outage that ends when the test
removes the rule:

```robot
*** Test Cases ***
Orders Recover After Two Failures
    New Page          ${APP_URL}
    Abort Requests    **/api/orders    times=2
    Click             id=reload-orders    # aborted
    Click             id=reload-orders    # aborted
    Click             id=reload-orders    # reaches the server
    Get Text          id=orders-status    ==    loaded

Orders Recover When The Outage Ends
    New Page             ${APP_URL}
    ${rule} =            Abort Requests    **/api/orders
    Click                id=reload-orders
    Get Text             id=orders-status    ==    error
    Remove Route Rule    ${rule}
    Click                id=reload-orders
    Get Text             id=orders-status    ==    loaded
```

`Mock Responses` with `status=503` and `times=1` does the same with an error
response instead of a network error.

## Abort Requests

`errorCode` is the network error, `failed` by default; see
[`AbortErrorCode`](/keywords#type--aborterrorcode) for all of them.

```robot-repl
Abort Requests    **/api/**    errorCode=timedout
```

Chromium reports the matching error, `net::ERR_TIMED_OUT` here. Firefox and WebKit
report most codes as one generic failure, so check the error text only in Chromium.

## Mock Responses

A mock response is a `status` (100 to 599, `200` by default), `headers` and at most
one payload. No payload is an empty body, as for a `204`.

::doc-table
---
head: [Payload, Is, Content-Type]
nowrap: [0]
rows:
  - ['`body`', 'Text, `bytes`, a `Secret`, or a JSON value, see [Bodies](/docs/http/overview#bodies)', 'text: `text/plain; charset=utf-8`, bytes: `application/octet-stream`, JSON: `application/json`']
  - ['`json`', 'A JSON value. A string becomes a JSON string, in quotes', '`application/json`']
  - ['`path`', 'The bytes of a file, binary too', 'from the extension, `charset=utf-8` for `text/`; else `application/octet-stream`']
  - ['none', 'An empty body', 'none; WebKit reports `application/octet-stream`']
---
::

```robot-repl
Mock Responses    **/api/orders    status=201    body=created    headers={"Location": "/api/orders/7"}
Mock Responses    **/img/logo.png    path=${CURDIR}/logo.png
```

- `headers` is the whole header set: there is no real response to merge with. A
  Content-Type in it always wins.
- JSON text you already have goes in `body` with a Content-Type header. A JSON `null`
  body is `body=null` with one.
- A text file in another encoding than UTF-8 needs its Content-Type, with charset.
- Python reads `path`, so the file needs to exist only where the tests run.
- There is no reason phrase: the browser shows the standard one, or `Unknown`.

## Modify Responses

The request reaches the server, and only what you give changes. Give at least one;
the page keeps the URL it asked for.

::doc-table
---
head: [Argument, Changes]
nowrap: [0]
rows:
  - ['`request_url`', 'Where the request goes: absolute, or relative to the original URL']
  - ['`request_method`', 'The method the server gets']
  - ['`request_headers`', 'Merged onto the real request headers']
  - ['`request_body`', 'The body the server gets, see [Bodies](/docs/http/overview#bodies)']
  - ['`status`', 'The status the page gets']
  - ['`headers`', 'Merged onto the real response headers']
  - ['`body`, `json`, `path`', 'Replace the real body, as in [Mock Responses](#mock-responses)']
  - ['`json_patch`', 'Changes fields of the real JSON body']
---
::

Give at most one of `body`, `json`, `path` and `json_patch`.

### Headers

`headers` and `request_headers` merge onto the real headers. Names compare
case-insensitively, and a value you give wins:

::doc-table
---
head: [Value, Header]
nowrap: [0]
rows:
  - ['text, `Secret`, number, boolean', 'set to that value']
  - ['`""`', 'sent empty']
  - ['`None`', 'removed']
---
::

```robot-repl
Modify Responses    **/app.html    headers={"Content-Security-Policy": None}
```

### Request URL, method and body

```robot-repl
Modify Responses    **/api/orders    request_url=/api/v2/orders
Modify Responses    **/api/**        request_url=https://staging.example.com/api/orders
Modify Responses    **/api/search    request_method=POST    request_body=${{ {"q": "robot"} }}
```

- A changed URL gets the cookies the context holds **for that URL**. The original
  `Cookie` and `Host` are not forwarded, so all three browsers behave alike. Use
  [`Add Cookie`](/keywords#add-cookie) for a cookie on the new host.
- A text or `bytes` `request_body` keeps the original Content-Type unless
  `request_headers` sets one; a JSON value sets `application/json`. The length is
  recalculated.
- `GET` or `HEAD` without `request_body` sends no body, so an old form body is not
  carried along.

### Response body

`body`, `json` and `path` replace the real body; the real status and headers stay.
The real `Content-Encoding` and `Content-Length` are dropped, because the page gets
the new body already decoded.

`json_patch` changes the real JSON body as an
[RFC 7386 JSON Merge Patch](https://www.rfc-editor.org/rfc/rfc7386): dictionaries
merge at every depth, `${None}` deletes a key, anything else replaces the value
whole, a list included.

::doc-table
---
head: [Real body, json_patch, Page gets]
rows:
  - ['`{"id": 7, "state": "open"}`', '`{"state": "cancelled"}`', '`{"id": 7, "state": "cancelled"}`']
  - ['`{"id": 7, "note": "x"}`', '`{"note": None}`', '`{"id": 7}`']
  - ['`{"order": {"id": 7, "total": 12}}`', '`{"order": {"total": 0}}`', '`{"order": {"id": 7, "total": 0}}`']
  - ['`{"items": [1, 2, 3]}`', '`{"items": [4]}`', '`{"items": [4]}`']
---
::

`json_patch` takes only a dictionary; to replace the whole body, use `json`. The real
Content-Type stays.

### Redirects, failures and timeouts

- The real request follows up to 20 redirects. The page gets the final response at
  the URL it asked for. The redirect target does not pass through route rules.
- `Modify Responses` passes as soon as the rule is added. When the real request
  fails later, because the server is unreachable, it times out or `json_patch` meets
  a body that is not JSON, the page request fails as a network error. The error goes
  to `playwright-log.txt` with the rule id, without Playwright's call log.
- The timeout is the browser timeout **when the rule is added**. For a shorter one,
  wrap the keyword in `Set Browser Timeout`. It also bounds how long
  `Remove Route Rule` waits for a request the rule is handling.
- A replaced body and `request_body` can be at most about 4 MB. `json_patch` is
  small however large the real body is.

## Removing rules

[`Remove Route Rule`](/keywords#remove-route-rule) removes one rule by its id, in
any context. [`Remove All Route Rules`](/keywords#remove-all-route-rules) removes
the Context rules of the active context and the Page rules of all its pages.

- Both wait for a request the rule is handling, then the rule handles no more.
- An unknown or ended id, no rules, or no open context are logged, and the keyword
  passes. So both are safe in a teardown.
- `Remove All Route Rules` removes only the rules of this library, not a
  `page.route` from a plugin or JavaScript extension.

```robot
*** Settings ***
Suite Setup      New Context
Test Teardown    Remove All Route Rules
```

## Cross-origin requests

A cross-origin mock response needs no CORS headers, also with credentials. A mock
that sets its own `Access-Control-Allow-Origin` is checked like a real response, so
`*` with credentials fails. The preflight `OPTIONS` request never reaches a rule.

## Service workers and the HTTP cache

- A request that a service worker answers never reaches a rule. Open the context
  with `serviceWorkers=block` in `New Context` to route it.
- Playwright turns off the HTTP cache once a context or page has a rule, so the page
  may send more requests than without it.

## Logging

The keywords log the rule in `log.html`, with header names but never values or
bodies:

```text
Added route rule 3f1c…: abort **/api/orders with failed, times=2, on=Context.
Added route rule 7a2e…: mock **/api/orders with status 200 and json body, times=None, on=Context.
```

Each request a rule handles is logged only in
[`playwright-log.txt`](/docs/concepts/logging#playwright-logtxt), so a rule that
blocks hundreds of analytics calls keeps `log.html` readable. Search it for the rule
id:

```text
Route rule 3f1c… ran for GET https://example.com/api/orders
```

For tokens in headers or bodies, see [Secrets](/docs/http/overview#secrets).
