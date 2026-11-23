---
title: Sending requests
description: HTTP sends a request from the page, Send API Request from the context. Which one to use, and how each sends bodies, forms and files.
section: http
order: 2
---

## Which one

- **[`HTTP`](/keywords#http)** sends the request from the page, with the browser's
  `fetch`. Use it to test what the page itself can do: CORS, its cookies, route
  rules and `Wait For *` all apply.
- **[`Send API Request`](/keywords#send-api-request)** :since{version="21.1.0"}
  sends it from the context, outside any page. Use it to set up or check data next
  to the UI, with the session the page logged in with. It needs no page.

See [Page traffic and API traffic](/docs/http/overview#page-traffic-and-api-traffic)
for everything that differs.

```robot
*** Test Cases ***
New Order Shows Up In The List
    New Context    baseURL=${APP_URL}
    New Page       /login
    Log In As Demo User
    VAR    &{order} =    item=book    count=${2}
    ${created} =    Send API Request    /api/orders    POST    data=${order}    failOnStatusCode=True
    Go To    /orders/${created.json.id}
    Get Text    id=item    ==    book
```

## Arguments

::doc-table
---
head: ['', '`HTTP`', '`Send API Request`']
nowrap: [0]
rows:
  - ['Body', '`body`', '`data`']
  - ['Form, URL-encoded', '`form`', '`form`']
  - ['Form with files', '`multipart`', '`multipart`']
  - ['Query', 'in `url`', '`params`, or in `url`']
  - ['Timeout', '`timeout`, the whole response with its body', '`timeout`, the same']
  - ['Error status', 'never fails', 'fails with `failOnStatusCode=True`']
  - ['Redirects', '`redirect`', '`maxRedirects`']
  - ['Other options', 'those of `fetch`: `credentials`, `mode`, `cache` …', '`maxRetries`, `ignoreHTTPSErrors`']
  - ['Returns', '[`HttpResponse`](/keywords#type--httpresponse): the headers the page may read', '[`APIResponse`](/keywords#type--apiresponse): all headers, `set-cookie` too']
---
::

An option you leave out keeps the default of `fetch` or of Playwright.

## Bodies

Give at most one of the body, `form` and `multipart`. An empty `form` or
`multipart` is sent too, as `fetch` does: an empty URL-encoded body, or a multipart
body without parts. Values follow the
[shared rules](/docs/http/overview#bodies). Only text gets a different
Content-Type:

::doc-table
---
head: [Body, '`HTTP`', '`Send API Request`']
nowrap: [0]
rows:
  - ['Text that is JSON', '`application/json`', '`application/octet-stream`']
  - ['Other text', '`text/plain;charset=UTF-8`', '`application/octet-stream`']
  - ['`bytes`', 'none', '`application/octet-stream`']
---
::

A Content-Type in `headers` wins. In `Send API Request`, `application/json` also
turns text that is not JSON into a JSON string: `hello` is sent as `"hello"`.

`HTTP` sends `GET` and `HEAD` without a body. Text, JSON, `form` and `multipart` are
left out; `bytes` fail, so binary data is never dropped unnoticed.

## Forms and files

`form` is a dictionary of text fields. `multipart` adds files, each a dictionary with
`path` or `buffer`:

```robot
VAR    &{avatar} =    path=${CURDIR}/avatar.png
VAR    &{notes} =     name=notes.txt    mimeType=text/plain    buffer=Hello
VAR    &{fields} =    description=Profile picture    avatar=${avatar}    notes=${notes}
${response} =    Send API Request    /api/profile    POST    multipart=${fields}
```

See [`MultipartFields`](/keywords#type--multipartfields) for the keys.

- The body and the `buffer` files can be at most 4 MiB together. A `path` file does
  not count.
- In `HTTP`, do not set a Content-Type for `multipart`: the browser then leaves out
  the boundary, and the server cannot read the body.

## Failures and logging

- `HTTP` fails when `fetch` fails: a network error, a request CORS blocks,
  `redirect=error` on a redirect, a wrong `integrity`.
- `Send API Request` fails on a network error, a timeout, too many redirects and,
  with `failOnStatusCode`, an error status.
- Error messages leave out Playwright's call log, because it lists header values.
- The response is logged without its body, and the body at `TRACE` level.
  `Send API Request` logs the response headers only at `DEBUG` level, because they
  can hold cookies.
