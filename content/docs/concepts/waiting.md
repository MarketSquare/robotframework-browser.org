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

Both settings can be changed at import, and at runtime with `Set Browser Timeout`
and `Set Retry Assertions For` — each of which takes a scope, so you can widen
them for one test without widening them for the suite.

## When that is not enough

The built-in waiting covers the element you are about to touch and the value you
are about to check. What it does not cover is everything else the page might be
doing: a spinner that has to *disappear*, an animation that has to finish, a
framework that has to declare itself ready.

Two keywords do that job, and they are siblings. The difference is which side of
the wire the condition lives on.

::doc-table
---
head: [Keyword, Evaluates, Reach for it when]
rows:
  - ['`Wait For Condition`', 'A Browser **getter**, in Robot Framework', 'The thing you are waiting for is something a Browser keyword can already read']
  - ['`Wait For Function`', '**JavaScript**, inside the page', 'The thing you are waiting for is only visible to the page itself']
---
::

If you can already write a `Get …` assertion for it, use the first. If you would
have to open devtools to see it, use the second.

## `Wait For Condition`

The rule is simple enough that you do not have to learn anything new. Write the
assertion as an ordinary getter first, get it passing, and then take the `Get`
off the front:

```robot-repl
Get Text              id=status_bar    contains    Done
Wait For Condition    Text    id=status_bar    contains    Done
```

Everything after the condition name is that getter's own arguments, so anything
you already know how to assert, you already know how to wait for.

```robot-repl
# The upload finished
Wait For Condition    Text            .progress     ==    100%

# The table filled in
Wait For Condition    Element Count   tbody tr       ==    ${25}

# The single-page app actually navigated
Wait For Condition    Url             should end with    /checkout

# A CSS class arrived
Wait For Condition    Classes         .modal    contains    is-open
```

Most getters that take an assertion can be used, but not all — the id getters,
the storage getters, `Console Log`, `Page Errors` and `Aria Snapshot` are not
among them, and passing one fails with a conversion error rather than waiting.
The keyword documentation lists the exact set.

::doc-note
`timeout` here governs how long the **assertion** is retried, not how long an
element is looked for. It temporarily *sets* `retry_assertions_for` to that
value — so a short one shortens the retry window just as a long one lengthens it
— and additionally raises the browser `timeout` if that would otherwise be the
shorter of the two. Both are restored afterwards.
::

### The pairing that does most of the work

`Get Element States` returns the *set* of states an element is in right now, and
that is what makes it the most useful condition of the lot: one keyword covers
every "wait until this element is…" case, including the ones no dedicated
keyword exists for.

The states come in opposites, which is the part worth internalising:

::doc-table
---
head: [If you are waiting for, Wait for the state]
rows:
  - ['The element to exist / be gone', '`attached` / `detached`']
  - ['It to be shown / not shown', '`visible` / `hidden`']
  - ['A control to become usable / unusable', '`enabled` / `disabled`']
  - ['A field to accept typing / not', '`editable` / `readonly`']
  - ['A box to be ticked / cleared', '`checked` / `unchecked`']
  - ['An option to be picked / dropped', '`selected` / `deselected`']
  - ['The cursor to land / leave', '`focused` / `defocused`']
---
::

So the four cases you will actually hit:

```robot-repl
# The overlay is gone from the DOM entirely — not merely invisible
Wait For Condition    Element States    id=cdk-overlay-0    ==    detached

# The submit button became usable after validation
Wait For Condition    Element States    button#submit    contains    enabled

# The field is ready to type into: there, shown, and not read-only
Wait For Condition    Element States    input#search    contains    visible    editable

# Focus moved away, so the blur handler has run
Wait For Condition    Element States    input#amount    contains    defocused
```

`contains` means *all of these are true*, so you can list as many as you need.
`==` means the set is *exactly* that, which is why `== detached` is the honest
way to wait for something to disappear: an element that is gone reports
`detached` and nothing else.

::doc-note{kind="warning"}
`stable` is the exception. It is a valid state for `Wait For Elements State`, but
`Get Element States` never reports it — so `Wait For Condition … contains stable`
polls until the timeout and fails, always. Wait for `visible` instead, or use
`Wait For Elements State` with `stable`.
::

## `Wait For Function`

The other half of the pair. Where `Wait For Condition` asks a Browser getter,
this one runs JavaScript **inside the page** and keeps running it until it
returns something truthy.

Reach for it when the thing you are waiting for is not in the DOM in any way a
selector can express — it is in the application's own state:

```robot-repl
# The framework says it has finished booting
Wait For Function    () => window.myApp.ready === true

# The client-side store has data in it
Wait For Function    () => window.__STORE__.getState().cart.items.length > 0

# A third-party widget has attached itself
Wait For Function    () => typeof window.Intercom === 'function'

# Every image has finished loading — successfully or not
Wait For Function    () => [...document.images].every(i => i.complete)
```

That last one is the flavour of problem this keyword exists for: nothing about
"every image has settled" is expressible as a selector, and no getter returns
it. Note what `complete` actually means — loading *finished*, including having
failed. If you need them to have loaded successfully, add
`&& i.naturalWidth > 0`.

### Waiting on one element

Pass a `selector` and it is resolved and handed to your function as its **first
argument**. The condition then becomes a question about that element, evaluated
in the page where the real computed values live:

```robot-repl
# The app has written an inline width of 100% onto the bar
Wait For Function    element => element.style.width === '100%'    selector=#progress_bar

# The sticky header has settled at the top of the viewport
Wait For Function    el => el.getBoundingClientRect().top === 0    selector=.sticky-header

# Something has actually been drawn into the canvas
Wait For Function    c => c.getContext('2d').getImageData(0,0,1,1).data[3] > 0    selector=canvas#chart
```

Two things to know about that first one. `element.style` is the *inline* style
attribute, not the computed value — it only sees a width the application wrote
onto the element itself, never one that came from a stylesheet. And computed
values are not out of reach for the sibling keyword either: `Wait For Condition`
with `Style` reads `getComputedStyle`, and with `BoundingBox` it reads geometry.
Canvas pixels are the genuine case where only JavaScript will do.

::doc-note{kind="warning"}
The selector is resolved in **strict mode**, so it has to match exactly one
element — which is why the canvas example says `canvas#chart` rather than
`canvas`. It is also resolved **once**, before polling starts, and the same
element is handed to every poll. If the application re-renders and replaces the
node, the function keeps testing the old one.
::

### Polling

By default it polls on `requestAnimationFrame` — once per frame, which is the
right choice for anything visual, because it re-checks exactly when the browser
repaints. Give `polling` a time instead when you are waiting on something slow
and want to stop burning frames on it:

```robot-repl
Wait For Function    () => window.jobStatus === 'done'    polling=2s    timeout=2min
```

### Two things that catch people

**Truthy is JavaScript's truthy.** `0`, `''`, `null` and `undefined` all read as
"not yet", so `element => element.children.length` waits for a *non-empty* list
without you writing the comparison, and `() => document.querySelector('.x')`
waits for the element to exist, because a missing one is `null`. If your function
takes the element, declare the parameter — a bare `element` inside a zero-argument
arrow is not defined and, thanks to the next paragraph, costs you the whole
timeout before it says so.

**Any error is treated as "not yet"**, for the length of the timeout. That is
what makes `() => window.myApp.ready` safe to run before `myApp` exists — but it
applies to every error, not only the one you were expecting. A typo in your
JavaScript, or a selector that matches two elements, is retried silently for the
full timeout and only then surfaces.

## Choosing between them

::doc-table
---
head: [You are waiting for, Use]
rows:
  - ['Text, a count, a class, an attribute, a URL', '`Wait For Condition`']
  - ['An element to appear, vanish, or become usable', '`Wait For Condition` with `Element States`']
  - ['A framework or widget to be ready', '`Wait For Function`']
  - ['An animation or transition to finish', '`Wait For Function`']
  - ['Application state that never reaches the DOM', '`Wait For Function`']
  - ['The page to finish loading', '`Wait For Load State`']
  - ['A request or response to happen', '`Wait For Response` / `Wait For Request` — and promise it, see below']
  - ['A navigation caused by a click', '`Wait For Navigation` — promise it too']
---
::

Prefer the first wherever it fits. A condition written against a getter fails
with a message naming what the value actually was; a JavaScript one that simply
stayed false fails with a timeout and leaves you to work out why.

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

1. **`Promise To`** starts the keyword and returns the promise. It waits until
   the promised keyword's thread is actually running before returning, which
   removes the worst of the race — though it does not wait for the browser-side
   listener itself to be registered.
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
${count} =      Promise To    Get Element Count    .row    ==    ${10}
```

Which means two slow waits can overlap instead of queueing:

```robot
*** Test Cases ***
Two Slow Panels At Once
    ${left} =     Promise To    Get Text    .left-panel     contains    Loaded
    ${right} =    Promise To    Get Text    .right-panel    contains    Loaded
    Wait For    ${left}    ${right}
```

Both getters retry independently, so the test waits about as long as the slower
one rather than the sum of the two. Promises run on a thread pool — up to 256 at
once — so they really are in flight together rather than taking turns.

::doc-note{kind="warning"}
Promise assertion getters like `Get Text`, not `Wait For Condition`.
`Wait For Condition` works by temporarily rewriting the library's
`retry_assertions_for` and `timeout` and restoring them when it finishes — so
two of them running concurrently overwrite each other's settings, and which
value survives is a matter of timing.
::

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
else on this page. It fails immediately if the path is not an existing file.

If you can set the file directly, `Upload File By Selector` does it in one
keyword and avoids the ordering question entirely.

## In short

- A getter with an assertion operator is a wait. Without one, it reads once.
- Two keywords cover the rest, and they are siblings: `Wait For Condition` asks a
  Browser getter, `Wait For Function` asks the page. If you can write the
  `Get …` assertion, use the first.
- `Wait For Condition` needs no new syntax — write the getter assertion, then
  drop the `Get`.
- `Wait For Condition` + `Element States` is the one that handles most cases;
  the states come in opposites, and `== detached` is how you wait for something
  to be gone.
- `Wait For Function` is for what only the page knows: readiness flags,
  animations, computed geometry, application state that never reaches the DOM.
  A throw counts as "not yet", so it is safe to poll for something that does not
  exist yet.
- Promises are start-now, collect-later. The order is always
  **`Promise To` → trigger → `Wait For`**.
- Any Browser keyword can be promised, and promises really do run in parallel —
  promise the getters rather than `Wait For Condition`.
