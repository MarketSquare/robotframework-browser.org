---
title: HTTP traffic
description: Send requests, wait for them, and fail, mock or change them. Which keyword sees which request, and the rules they share for matchers, bodies and headers.
section: http
order: 1
---

Browser has keywords to send HTTP requests, to wait for them and to change them:

::doc-table
---
head: [Keyword, Does, Page]
nowrap: [0]
rows:
  - ['[`HTTP`](/keywords#http)', 'Sends a request from the page, with its `fetch`', '[Sending requests](/docs/http/sending-requests)']
  - ['[`Send API Request`](/keywords#send-api-request)', 'Sends a request from the context, outside any page', '[Sending requests](/docs/http/sending-requests)']
  - ['[`Wait For Request`](/keywords#wait-for-request), [`Wait For Response`](/keywords#wait-for-response)', 'Wait for a request or response of the page', '[Waiting for traffic](/docs/http/waiting)']
  - ['[`Abort Requests`](/keywords#abort-requests), [`Mock Responses`](/keywords#mock-responses), [`Modify Responses`](/keywords#modify-responses)', 'Fail, answer or change requests of the page', '[Route rules](/docs/http/route-rules)']
  - ['[`Remove Route Rule`](/keywords#remove-route-rule), [`Remove All Route Rules`](/keywords#remove-all-route-rules)', 'End route rules', '[Route rules](/docs/http/route-rules#removing-rules)']
---
::

## Page traffic and API traffic

There are two kinds of requests, and they see different things:

```text
page traffic     the page loads, fetches, posts …  and HTTP
                 Page ──▶ route rules ──▶ network ──▶ Server
                   └── seen by Wait For Request / Wait For Response

API traffic      Send API Request
                 Context ───────────────▶ network ──▶ Server
```

::doc-table
---
head: ['', 'Page traffic, HTTP', 'Send API Request']
rows:
  - ['Route rules', 'apply', 'do not apply']
  - ['Wait For Request / Response', 'see it', 'do not see it']
  - ['Set Offline', 'requests fail', 'no effect']
  - ['Context cookies', 'by the `credentials` option of `fetch`', 'always; cookies it gets reach the pages']
  - ['Extra HTTP headers', 'sent', 'sent, but not those set `on=Page`']
  - ['HTTP credentials', 'sent', 'sent']
  - ['Relative URL', 'against the page URL', 'against `baseURL`, fails without one']
  - ['CORS, headers such as `Cookie`', 'browser rules apply', 'no rules']
  - ['Needs', 'a page', 'a context']
---
::

So `HTTP` tests what the page can do, and `Send API Request` sets up or checks data
next to it, for example with the session the page logged in with.

## Matchers

`Wait For *` and the route rules take the same `matcher`:

::doc-table
---
head: [Matcher, Example]
nowrap: [1]
rows:
  - ['Glob: `*` stops at `/`, `**` does not, `{a,b}` is either', '`**/api/orders/*`']
  - ['JavaScript RegExp between slashes, with optional flags `gimsuy`', '`/\/api\/orders\/\d+$/i`']
  - ['JavaScript arrow function that returns a boolean', '`url => url.pathname.endsWith(''.png'')`']
---
::

- An invalid RegExp fails the keyword. It never falls back to a glob.
- Anything that starts and ends with `/` is a RegExp: `/api/users/` is one. Write
  `**/api/users/` for the glob.
- The arrow function gets the request URL in a route rule, and the request or
  response in `Wait For *`.
- Escape backslashes for Robot Framework: `\\d` instead of `\d`.

## Bodies

`body` of `HTTP`, `Mock Responses` and `Modify Responses`, `request_body` of
`Modify Responses` and `data` of `Send API Request` take the same values:

::doc-table
---
head: [Value, Sent as]
nowrap: [0]
rows:
  - ['Dictionary, list, number, boolean', 'Compact JSON, `application/json`']
  - ['Text', 'UTF-8, as given. The Content-Type differs per keyword, see its page']
  - ['`bytes`', 'Unchanged, byte for byte']
  - ['Robot Framework `Secret`', 'Its text, never logged']
---
::

A Content-Type in `headers` always wins. A value JSON cannot hold, such as `NaN` or
a date, fails before anything is sent.

## Headers

Headers are a dictionary. A value is text, a `Secret`, a number or a boolean;
numbers and booleans are sent as JavaScript writes them, `5` and `true`. In
`Modify Responses`, `None` removes a header and `""` sends it empty.

## Responses

`HTTP`, `Send API Request` and `Wait For Response` return a dictionary with the same
core keys: `status`, `statusText`, `ok`, `url`, `headers`, `bytes`, `text` and
`json`. Each adds its own, see [`HttpResponse`](/keywords#type--httpresponse),
[`APIResponse`](/keywords#type--apiresponse) and
[`CapturedResponse`](/keywords#type--capturedresponse).

::doc-note
Assign a response with `${response} =`. With `&{response} =`, `bytes` holds base64
text instead of the raw bytes.
::

## Secrets

Give tokens as a Robot Framework
[Secret](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#secret-variables),
as a header value or as the whole body. The keywords log header names, never values.
Two limits:

- A Secret inside text, such as `{"token": "${token}"}`, becomes the text
  `<secret>`. Give the whole body as the Secret.
- With `enable_playwright_debug`, the values show in the Playwright debug log.
