---
title: Browser as a base
description: Own the Browser instance in your own library — what you get free, what one line restores, and what you build yourself.
section: extending
order: 5
---

On the [previous page](/docs/extending/python-libraries) Robot Framework imports
Browser and your library sits alongside it. This page is the other arrangement:
**Robot Framework imports only your library, and your library constructs
Browser.**

People arrive here when they are replacing the `Browser` import and a pile of
resource-file keywords with a library of their own — a domain vocabulary rather
than a browser vocabulary, with failure handling they control.

## One question decides everything

Not how advanced your library is. **Who imports Browser.**

::doc-table
---
head: ['', Alongside Browser, Browser as a base]
rows:
  - ['Robot Framework imports', 'Browser **and** your library', 'only your library']
  - ['Who constructs `Browser()`', 'Robot Framework', 'your library']
  - ['How your library reaches it', '`BuiltIn().get_library_instance("Browser")`', 'it holds the instance it made']
  - ["Browser's listener is registered", 'automatically', 'only if you register it']
---
::

Everything below follows from owning the instance, and it is not a list of
losses. It is three tiers.

::doc-table
---
head: [Tier, What is in it]
rows:
  - ['**Free** — because Robot Framework is running', 'argument conversion, `outputdir`, the `validate` and `then` operators']
  - ['**One line** — register Browser as a listener', 'automatic closing, scope settings, the Robot Framework context on the Node side']
  - ['**Yours to build**', '`run_on_failure`, and a little of the tracing']
---
::

::doc-note
---
kind: warning
---
**Importing Browser anywhere in the suite puts you back in the arrangement on
the previous page** — including from a resource file, and including when your
library owns an instance too. Robot Framework then has its own Browser, and the
properties described on this page stop being true of your run without anything
failing.

The library's acceptance suite guards this rather than trusting review: it fails
the run if any keyword owned by `Browser` appears in the child suite's
`output.xml`.
::

## Free — because Robot Framework is running

These hang off *a Robot Framework run existing at all*, not off who imported
Browser. They are true in this arrangement whether or not you go on to register
the listener.

:since{version="20.4.0"} **Arguments convert from plain Python values.**
`browser.click("id=x", "middle")`, `"2 seconds"` into a `timedelta`,
`"validate"` into an `AssertionOperator` — the same converters Robot Framework
uses, and a Python `None` stays `None`. The four rules are on
[the previous page](/docs/extending/python-libraries) and they do not change
here.

**`browser.outputdir` is Robot Framework's `${OUTPUTDIR}`.** Screenshots,
videos, traces and the Playwright log land in the run's output directory,
exactly as they do for any other suite.

**The `validate` and `then` assertion operators execute.** They need an
execution context, and there is one.

That last pair is worth stating plainly because it has been published wrongly
before: these are properties of a Robot Framework run, not of Browser having
been imported by it.

## One line — registering the listener

Everything in that middle tier is implemented in Browser's listener methods.
Robot Framework only looks for `ROBOT_LIBRARY_LISTENER` on libraries **it**
imported, so when your library owns the instance, nobody tells Browser that a
test started or ended.

Hand it over in your constructor:

```python [MyLibraryB.py]
class MyLibraryB:
    """Browser used as a base, with this library owning the instance."""

    ROBOT_LIBRARY_SCOPE = "GLOBAL"
    # Robot Framework resolves the listener API version of every listener
    # separately. Browser declares version 2, but this library would default to
    # version 3, which has different method signatures.
    ROBOT_LISTENER_API_VERSION = 2

    def __init__(self):
        self._browser = Browser(enable_playwright_debug=True)
        # Robot Framework accepts a list of listeners and calls Browser's
        # listener methods itself. Without this line Browser gets no suite and
        # test events, so automatic closing and scope settings do not work.
        self.ROBOT_LIBRARY_LISTENER = [self, self._browser]
```

**This is a supported public contract of Browser, not a workaround.** Two Robot
Framework behaviours make it work: `ROBOT_LIBRARY_LISTENER` accepts a *list*, so
your library and Browser can both be listeners; and for a library listener Robot
Framework also looks for method names with a leading underscore, which is how it
finds `Browser._start_suite`.

That leading underscore is not a private-API marker. It is the convention that
stops a listener method from also becoming a keyword — Robot Framework's library
API skips names beginning with `_`, and the library-listener lookup puts the
underscore back.

You can write `ROBOT_LIBRARY_LISTENER = self._browser` instead, and Browser
still gets its events. The list form is what lets you be a listener as well.

### What the line buys

The library's tests run the same suite against two libraries that differ only in
whether they hand Browser that registration. The difference is measured, not
argued:

::doc-table
---
head: [After three tests that each open a page, With the line, Without it]
rows:
  - ['Pages still open', '1', '3']
  - ['A `scope=Test` browser timeout, in the next test', 'reverted to `10 seconds`', 'still `3 seconds`']
  - ['Node-side log records carrying the Robot Framework test name', '73', '0']
---
::

So the line buys three things: pages and contexts opened in a test are closed at
its end, a scoped setting such as `set_browser_timeout(…, "Test")` reverts when
that test ends, and the Robot Framework suite and test names reach the Node side,
where Playwright's own log and traces carry them.

::doc-note
---
kind: warning
---
**Without the listener, `scope=Test` fails silently.** It is not an error and
there is no warning: Browser never learned that a suite started, so it quietly
downgrades the setting to `Global` and it leaks into every later test. That is
the second row of the table above — the timeout is still `3 seconds` in the next
test rather than back at `10`.
::

### Two traps in the registration

**Declare `ROBOT_LISTENER_API_VERSION = 2`.** Robot Framework resolves the
listener API version *per listener*, not per registration. In
`[self, self._browser]`, Browser gets version 2 from its own class attribute
while your library defaults to version 3 — a different set of method signatures.
Copy a version-2 signature such as `_end_keyword(self, name, attrs)` into a
library that has not declared the version and you get a `TypeError` at run time
that does not say why.

**Give your library `ROBOT_LIBRARY_SCOPE = "GLOBAL"`.** Browser is `GLOBAL` and
keeps state at class level, shared by every instance in the process. If Robot
Framework constructs your library once per suite or per test, each new
`Browser()` you make joins the state the previous one left behind.

## Yours to build

One code path is not recovered by the listener, in either arrangement:
`Browser.run_keyword`, the dynamic library API method Robot Framework calls to
execute a Browser keyword. Robot Framework calls it only on the library it
imported itself, and registering a listener is not importing a library. In this
arrangement it calls `run_keyword` on *your* library, never on Browser.

What lives in there:

- **`run_on_failure`** — no screenshot on a failing Browser call, listener or
  not. This is the one that matters, and the recipes below are how you get it
  back.
- Trace groups in the non-default `TracingGroupMode.Browser`, Browser's
  rewriting of error messages, and `pause_on_failure`.

Trace groups in the **default** `TracingGroupMode.Full` are not in that list.
They are opened and closed by listener methods, and a library listener receives
events for every keyword in the run, so registering the listener gets you a
trace group per Robot Framework keyword.

::doc-note
---
kind: aside
---
No acceptance test covers that last paragraph, and that is deliberate: the only
observable is the Playwright trace file's own format, which is internal and not
something this project should pin a test to. It is stated from the mechanism in
the library's source, because the opposite — "trace groups never work when you
own the instance" — has been published before and is wrong.
::

### Recovering `run_on_failure` yourself

Three shapes, and no single correct one. Pick by the size of the library.

**A decorator**, best for a small library. It wraps the keywords you choose,
takes the screenshot and re-raises. It is the one shape the library's tests
cover, and it is written out in full on
[the previous page](/docs/extending/python-libraries).

**Your own `_end_keyword`**, nearly free here — your library is already a
listener, because that is how you registered Browser. Take a screenshot when
`attrs["status"] == "FAIL"`. Two things to know:

- A library listener is told about **every** keyword in the run, not only its
  own library's. Browser's own listener has to check the owning library name to
  tell its keywords from everybody else's, and so will yours.
- `_end_keyword(self, name, attrs)` is a listener API version 2 signature, so
  this is the same `ROBOT_LISTENER_API_VERSION` trap as above.

The granularity is different from the decorator's: a listener sees *your*
keyword fail, not the individual Browser call inside it. That is usually what
you want in a report.

**A dynamic library**, optionally through
[PythonLibCore](https://github.com/robotframework/PythonLibCore), for a large
one. Implement `run_keyword` yourself and put the failure handling in it: every
keyword is covered by construction and nothing has to be remembered per keyword.
Browser's own `Browser.run_keyword` is the worked reference — try, delegate, and
on failure call the failure keyword before re-raising.

## The log gets shallower here too

A Browser keyword called from Python is not a keyword in `output.xml` — Robot
Framework never saw a keyword call — so everything Browser logs appears inside
the keyword of your library that made the call. That is true of both
arrangements, and here it is true of every Browser call you make, because they
all come from your library.

The detailed Robot Framework log, one row per Browser keyword, becomes your own
keyword's log. Log what a reader of the report needs, because the automatic
detail is gone.

## Cleaning up

Nothing leaks. Browser registers an `atexit` hook when it starts the Node
process, so the process tree goes down when the interpreter exits whether or not
a listener is registered. A suite teardown that closes the browser is not
required for cleanliness — it is worth having only for the case where something
kills the run with a signal and `atexit` never runs.

## Where these examples come from

Every block on this page is copied from the library's acceptance tests, in
[`atest/test/13_Python_Extension/`](https://github.com/MarketSquare/robotframework-browser/tree/main/atest/test/13_Python_Extension).
`MyLibraryB.py` is a complete worked library for this page and
`context_b.robot` is the suite that runs it. `MyLibraryB_no_listener.py` is the
same library without that registration — the difference between those two runs
is the table above.
