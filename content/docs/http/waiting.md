---
title: Waiting for traffic
description: Wait For Request and Wait For Response wait for a request or response of the page and return what was sent and received. Start the wait before the action, with Promise To.
section: http
order: 3
---

[`Wait For Request`](/keywords#wait-for-request) returns the first request of the
page that matches, [`Wait For Response`](/keywords#wait-for-response) the first
response. Both see page traffic, `HTTP` included, but not `Send API Request`.

## Start the wait first

A wait sees only what happens after it starts, and the request usually fires during
the action. Start the wait with `Promise To`, act, then collect the result:

```robot
${promise} =    Promise To    Wait For Response    **/api/login
Click    id=login-button
${response} =    Wait For    ${promise}
Should Be Equal    ${response.json.user}    demo
```

See [Promises](/docs/concepts/waiting#promises) for how they work.

## What they return

::doc-table
---
head: [Keyword, Returns, Main keys]
nowrap: [0, 1]
rows:
  - ['`Wait For Request`', '[`CapturedRequest`](/keywords#type--capturedrequest)', '`url`, `method`, `headers`, `allHeaders` with `cookie`, `postDataBuffer` (raw body), `postDataJSON`, `resourceType`']
  - ['`Wait For Response`', '[`CapturedResponse`](/keywords#type--capturedresponse)', '`status`, `headers`, `allHeaders` with `set-cookie`, `bytes`, `text`, `json`, `request`']
---
::

The body is raw `bytes` with the views `text` and `json`, as for the
[other responses](/docs/http/overview#responses). To save it or to mock with it:

```robot
${logo} =    Promise To    Wait For Response    **/logo.png
Go To    ${APP_URL}
${response} =    Wait For    ${logo}
Create Binary File    ${OUTPUT_DIR}/logo.png    ${response.bytes}
Mock Responses    **/logo.png    body=${response.bytes}
```

## Arguments

- **`matcher`** follows the [shared rules](/docs/http/overview#matchers). Empty
  matches the first request or response. A function gets Playwright's
  [Request](https://playwright.dev/docs/api/class-request) or
  [Response](https://playwright.dev/docs/api/class-response):
  `response => response.status() === 500`.
- **`timeout`** defaults to the library timeout. For `Wait For Response` it also
  covers reading the body.
- **`wait_for_all_fields=True`** :since{version="21.1.0"} (`Wait For Request`)
  also waits for `allHeaders` and `headersArray`. Chromium and WebKit report them
  only when the response headers arrive, so by default they are `None`.
- **`include_body=False`** :since{version="21.1.0"} (`Wait For Response`) does not
  read the body, for a large or endless one. `body`, `bytes`, `text` and `json` are
  then `None`, and so are `httpVersion`, `serverAddr` and `securityDetails`, which
  some browsers report only after the body.

## Logging

Requests and responses are logged without their body. `allHeaders` and
`headersArray` are logged at `DEBUG` level, because they can hold cookies. The body
is logged at `TRACE` level: as JSON, as text, or as base64.
