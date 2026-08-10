---
title: Waiting and promises
description: Most waiting is already done for you. This is the rest of it — Wait For Condition, and how to run keywords in parallel with Promise To.
section: concepts
order: 4
---

Most of the waiting you would write by hand is already happening. This page is
about the part that is not, and about the opposite problem: when you need two
things to happen *at the same time*.

## What waits for you already

Three separate mechanisms, and it is worth knowing which is which, because when
a test is flaky the fix depends on it.

::doc-table
---
head: [Mechanism, Waits for, Governed by]
rows:
  - ['**Actionability**', 'An element to be attached, visible, stable and able to receive the event — before `Click`, `Fill Text` and friends act', '`timeout`']
  - ['**Assertion retry**', 'A *value* to become what you asserted, re-reading it as often as needed', '`retry_assertions_for`, capped by `timeout`']
  - ['**Navigation**', '`New Page` and `Go To` to reach their load state before returning', '`timeout`']
---
::

So this is already a wait, and the most common one you will write:

```robot-repl
Get Text    .status    ==    Done
```

And this is not — no operator, so it reads once and returns whatever is there:

```robot-repl
${status} =    Get Text    .status
```

That difference is the single most useful thing to know about waiting in this
library. A getter *with* an assertion retries; a getter *without* one does not.

## When that is not enough

The built-in waiting covers the element you are about to touch and the value you
are about to check. It does not cover everything: a spinner that has to
*disappear*, a button that has to become enabled, a list that has to reach a
certain length before you act on it.

### `Wait For Condition`

This is the one to reach for, and it is the most useful waiting keyword in the
library. It takes any Browser getter, runs it with an assertion, and keeps
retrying until it passes or the timeout expires.

The trick is that you do not have to learn a new syntax. Write the assertion
first, as an ordinary getter:

```robot-repl
Get Text    id=status_bar    contains    Done
```

Then drop the word `Get` and hand the rest to `Wait For Condition`:

```robot-repl
Wait For Condition    Text    id=status_bar    contains    Done
```

That is the whole rule. The first argument is a getter's name without `Get`, and
everything after it is that getter's own arguments.

```robot-repl
Wait For Condition    Title           should start with    Robot
Wait For Condition    Url             should end with      robotframework.org
Wait For Condition    Element Count   .row    ==    ${12}
Wait For Condition    Style           body    display    ==    block
```

::doc-note
`timeout` here extends how long the **assertion** is retried, not how long an
element is looked for. It temporarily raises `retry_assertions_for` — and raises
`timeout` too, if it would otherwise be the shorter of the two — then puts both
back afterwards.

```robot-repl
Wait For Condition    Text    id=status_bar    contains    Done    timeout=30s
```
::

Twenty-four getters can be used this way, which is every getter that takes an
assertion: `Attribute`, `Attribute Names`, `BoundingBox`, `Browser Catalog`,
`Checkbox State`, `Classes`, `Client Size`, `Download State`, `Element Count`,
`Element States`, `Page Source`, `Property`, `Scroll Position`, `Scroll Size`,
`Select Options`, `Selected Options`, `Style`, `Table Cell Index`,
`Table Row Index`, `Text`, `Title`, `Url` and `Viewport Size`.

### `Wait For Condition` with `Element States`

This pairing is the workhorse, and it deserves its own section.

`Get Element States` returns the *set* of states an element is currently in, so
combining it with `Wait For Condition` lets you wait for any combination of
them — including combinations no dedicated keyword exists for.

```robot-repl
# Wait until the overlay is gone from the DOM entirely
Wait For Condition    Element States    id=cdk-overlay-0    ==    detached

# Wait until the heading is visible, editable and enabled — all three
Wait For Condition    Element States    //h1    contains    visible    editable    enabled

# Wait until the submit button stops being disabled
Wait For Condition    Element States    button#submit    contains    enabled

# Wait until a field is no longer focused
Wait For Condition    Element States    input#search    contains    defocused
```

The states, all sixteen of them:

::doc-table
---
head: [State, True when the element]
nowrap: [0]
rows:
  - ['`attached`', 'Is present in the DOM']
  - ['`detached`', 'Is not present in the DOM']
  - ['`visible`', 'Has a non-empty bounding box and no `visibility: hidden`']
  - ['`hidden`', 'Is detached, or has an empty bounding box, or `visibility: hidden`']
  - ['`enabled`', 'Is not disabled']
  - ['`disabled`', 'Is disabled — `button`, `fieldset`, `input`, `optgroup`, `option`, `select`, `textarea`']
  - ['`editable`', 'Is not read-only']
  - ['`readonly`', 'Is read-only — `input` and `textarea`']
  - ['`selected`', 'Is selected — `option`']
  - ['`deselected`', 'Is not selected']
  - ['`focused`', 'Is the `activeElement`']
  - ['`defocused`', 'Is not the `activeElement`']
  - ['`checked`', 'Is checked — `input`']
  - ['`unchecked`', 'Is not checked']
  - ['`stable`', 'Is both visible and has stopped moving']
---
::

Because it is a set, `contains` means "all of these are true" and you can list
as many as you need. `==` means the state set is *exactly* what you listed,
which is why `== detached` is the right way to wait for something to disappear.

::doc-note{kind="warning"}
There is also a `Wait For Elements State` keyword, which waits for **one** state
of one element. It still works, and the library's own documentation recommends
`Wait For Condition` with `Element States` instead when it gives you trouble.
Prefer the pairing above: it handles several states at once and it fails with a
message that tells you which states the element actually had.
::

### The other waiting keywords

::doc-table
---
head: [Keyword, For]
nowrap: [0]
rows:
  - ['`Wait For Elements State`', 'One state of one element. See the note above.']
  - ['`Wait For Function`', 'A JavaScript expression to become truthy — the escape hatch when the condition is not something a getter can express']
  - ['`Wait For Load State`', 'The page to reach `load`, `domcontentloaded` or `networkidle`']
---
::

`Wait For Function` is the last resort, and it is genuinely useful for state
that lives only in the page:

```robot-repl
Wait For Function    () => window.myApp.ready === true    timeout=10s
```

## Promises

Everything above waits for something to *become* true. Promises are the
opposite: they let a keyword run while your test carries on doing something
else.

### The idea, if it is new

A promise is a placeholder for a result that does not exist yet.

Normally a keyword blocks: the test stops until it finishes, then continues with
the answer. `Promise To` breaks that in half. It **starts** the keyword and
hands you back a token immediately. The keyword goes on running in the
background while your test does the next thing. Later you present the token and
collect the result — waiting at that point only if it has not finished yet.

```text
ordinary:   ────[ Wait For Response ]────▶ result, then the next keyword

promised:   ──┬─[ Wait For Response ]──┐
              └─[ Click ]──────────────┴──▶ collect the result
```

The reason this matters is that some things can only be observed *while*
something else happens. To catch a network response you have to be listening
before the click that triggers it — but if you start listening with an ordinary
keyword, the test never reaches the click. The listening and the clicking have
to overlap, and that is what a promise is for.

### The call order

Always three steps, in this order:

```robot
*** Test Cases ***
Catch The Response Of A Delayed Request
    ${promise} =    Promise To    Wait For Response    matcher=    timeout=3s
    Click           \#delayed_request
    ${body} =       Wait For      ${promise}
```

1. **`Promise To`** starts the keyword and returns the promise. It does not
   return until the keyword has actually begun, so by the time the next line
   runs the listener is already in place.
2. **The thing that triggers it** — a click, a navigation, whatever.
3. **`Wait For`** collects the result, blocking only if it is not ready.

Getting the order wrong is the usual mistake: click first and the response has
come and gone before anything was listening.

### Collecting several

`Wait For` takes any number of promises and returns their results **in the order
you passed them**, not the order they finished:

```robot-repl
${a} =    Promise To    Wait For Response    matcher=**/api/user
${b} =    Promise To    Wait For Response    matcher=**/api/cart
Click     text=Refresh
${results} =    Wait For    ${a}    ${b}
```

With one promise you get the result itself; with several you get a list.

`Wait For All Promises` waits for everything created and not yet collected,
which is what you want when you do not need the results:

```robot-repl
Promise To    Wait For Response    matcher=**/api/log
Click         text=Save
Wait For All Promises
```

::doc-note
A promise you never wait for is not lost. At the end of the test the library
waits for it anyway and logs a warning that it had to. If you see that warning,
you have either forgotten a `Wait For` or you did not need the promise.
::

### Any Browser keyword can be promised

This is the part people miss. `Promise To` is not limited to a handful of
"async" keywords — it takes **any keyword in this library**, with its normal
arguments:

```robot-repl
${title} =      Promise To    Get Title
${clicked} =    Promise To    Click    text=Submit
${state} =      Promise To    Wait For Condition    Element States    .row    contains    visible
```

Which means you can genuinely run work in parallel. Two independent pages, two
independent waits, one wall-clock cost:

```robot
*** Test Cases ***
Two Slow Things At Once
    ${left} =     Promise To    Wait For Condition    Text    .left-panel     contains    Loaded
    ${right} =    Promise To    Wait For Condition    Text    .right-panel    contains    Loaded
    Wait For    ${left}    ${right}
```

Promises run on a thread pool, so several really are in flight at once rather
than taking turns.

::doc-note{kind="warning"}
Only Browser library keywords can be promised. Anything else — a BuiltIn
keyword, one of your own — fails with *"Unknown keyword … 'Promise To' can only
be used with Browser keywords."*

And keep in mind what you are parallelising. Two promises that both act on the
same page are two things competing for one page; the parallelism is real and so
are the races. Promises are for *waiting* concurrently far more often than for
*acting* concurrently.
::

### The two purpose-built promises

Downloads and uploads both need something in place before the click that starts
them, so they have dedicated keywords rather than being wrapped by hand:

```robot-repl
${dl} =      Promise To Wait For Download    saveAs=${OUTPUT_DIR}/report.pdf
Click        text=Export
${info} =    Wait For    ${dl}

${up} =      Promise To Upload File    ${CURDIR}/avatar.png
Click        text=Choose file
Wait For     ${up}
```

`Promise To Upload File` waits for the *file chooser dialog* to appear, so the
click that opens it has to come after the promise — the same order as everything
else on this page.

## In short

- A getter with an assertion operator is a wait. Without one, it reads once.
- Reach for `Wait For Condition` before anything else: take the getter you would
  have written, drop the `Get`.
- `Wait For Condition` + `Element States` handles the awkward cases, including
  waiting for several states at once and for an element to be gone.
- `timeout` on `Wait For Condition` extends the *assertion* retry.
- Promises are start-now, collect-later. The order is always
  **`Promise To` → trigger → `Wait For`**.
- Any Browser keyword can be promised, and promises really do run in parallel.
