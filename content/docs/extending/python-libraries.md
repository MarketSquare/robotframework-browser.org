---
title: Your own Python library
description: Move business logic out of Robot Framework and keep Browser exactly as it is.
section: extending
order: 4
---

A [plugin](/docs/extending/python-plugins) adds keywords *to* Browser. This page
is about the other move: writing **your own Robot Framework library** that uses
Browser — your keywords, your module, your control over what happens in Python.

It is what you want when the logic has outgrown Robot Framework syntax. Logging,
`IF`/`ELSE`, `TRY`/`EXCEPT`, parsing a response, building test data: all of it is
ordinary Python in a file you own, and none of it changes how Browser behaves.

Robot Framework still imports Browser. Your library sits alongside it:

```robot
*** Settings ***
Library    Browser
Library    MyLibraryA.py
```

## Reach the instance, never build one

Your library needs the Browser instance Robot Framework already made. Ask
`BuiltIn` for it:

```python [MyLibraryA.py]
    @property
    def browser(self) -> Browser:
        """The Browser instance that Robot Framework imported.

        Looked up on first use rather than in ``__init__``, because Robot
        Framework may not have imported Browser yet when this library is
        constructed.
        """
        if self._browser is None:
            self._browser = BuiltIn().get_library_instance("Browser")
        return self._browser
```

The lazy lookup is not a style preference. Robot Framework may not have imported
Browser yet when your library is constructed, so `get_library_instance` in
`__init__` is a race you lose depending on the order of the `*** Settings ***`
table. Looking it up on first use is always safe.

::doc-note
---
kind: warning
---
**Do not write `Browser()` in your library here.** It succeeds, and it hands you
an instance Robot Framework knows nothing about. Robot Framework drives the
listener of the Browser *it* imported, so the automatic closing and the scope
settings you still think you have belong to that instance and not to yours — and
the two are not cleanly separate either, because Browser keeps state at class
level, shared by every instance in the process.

Owning the instance on purpose is a different design, and it works. It is
[Browser as a base](/docs/extending/browser-as-a-base).
::

## Calling Browser from Python

Keywords are methods, named in snake_case. `Click` is `click`, `Get Text` is
`get_text`, `Wait For Elements State` is `wait_for_elements_state`.

:since{version="20.4.0"} Arguments are plain Python values — the same strings
you would write in a Robot Framework test, converted the same way.

```python [MyLibraryA.py]
    def click_heading_with_middle_mouse_button(self):
        """Call Browser with plain Python values.

        ``"middle"`` becomes a ``MouseButton``, ``"2 seconds"`` becomes a
        ``timedelta``, and the ``None`` stays ``None`` instead of turning into
        the string ``"None"``.
        """
        self.browser.wait_for_elements_state("id=heading1", "visible", "2 seconds")
        self.browser.click("id=heading1", "middle")
        return self.browser.evaluate_javascript(None, "() => 'evaluated'")
```

Four things worth knowing about that, and no more:

- **Values convert exactly as Robot Framework converts them.** `"middle"`
  becomes a `MouseButton`, `"2 seconds"` a `timedelta`, `"validate"` an
  `AssertionOperator`, `"true"` becomes `True`. It is not a curated subset —
  the same converters run, so every type Robot Framework can convert for a
  keyword argument converts here too.
- **A Python `None` stays `None`.** It is never converted, so it never arrives
  as the string `"None"`. From Python, meaning *nothing* is passing the `None`
  object — which is what the `evaluate_javascript(None, …)` above depends on.
- **A string `"None"` is not `None`.** It still converts by the argument's type
  hint, exactly as it would from Robot Framework.
- **Passing an already-typed value is the opt-out.** Conversion is idempotent,
  so `browser.click("//button", MouseButton.middle)` keeps working unchanged.

## What stays exactly as it was

Robot Framework imported Browser, so Browser is a fully ordinary library in this
suite. Pages and contexts close automatically at the end of a test, `scope=Test`
settings revert, screenshots and videos and traces land in the run's output
directory, and `Set Browser Timeout` behaves the way its documentation says.

Nothing on this page changes any of that. That is the point of leaving the
instance where it is.

## Two things that do change

### Failure screenshots stop at the Python boundary

Browser takes its `run_on_failure` screenshot from the dynamic library API —
the code path Robot Framework enters when *it* calls a Browser keyword. A
keyword your Python code calls never goes through it, so a failing
`self.browser.click(...)` leaves no screenshot, even though `Click` written in
the suite still does.

The library's own tests pin the difference with two tests that differ only in
who makes the call:

```robot [context_a.robot]
Run On Failure Takes Screenshot
    [Documentation]    Expected to fail. The keyword is called by Robot Framework, so Browser
    ...    runs its `run_on_failure` keyword and leaves a screenshot on disk.
    Open Login Page    ${LOGIN_URL}
    Click    id=this_element_does_not_exist

Python Call Failure Takes No Screenshot
    [Documentation]    Expected to fail. The very same Browser keyword, called from Python by
    ...    MyLibraryA, never enters Browser's `run_on_failure` and leaves no screenshot.
    Open Login Page    ${LOGIN_URL}
    Click Missing Element
```

You lose the screenshot for exactly the calls you moved into Python, and nothing
warns you. For a small library, a decorator gets it back:

```python [MyLibraryA.py]
def screenshot_on_failure(keyword):
    """Take a screenshot when the wrapped keyword fails, then re-raise.

    Browser runs its own ``run_on_failure`` from the Robot Framework dynamic
    library API, which is not entered when a keyword is called from Python.
    A small library can get equivalent behaviour with a decorator like this.
    Larger libraries usually intercept in one place instead, either by being a
    dynamic library themselves or by using PythonLibCore.
    """

    @functools.wraps(keyword)
    def wrapper(self, *args, **kwargs):
        try:
            return keyword(self, *args, **kwargs)
        except Exception:
            self.browser.take_screenshot("my-library-failure-{index}")
            raise

    return wrapper
```

Applied to the keywords you care about:

```python [MyLibraryA.py]
    @screenshot_on_failure
    def click_missing_element_with_screenshot(self):
        self.browser.click("id=this_element_does_not_exist")
```

It costs one decorator per keyword, and nothing enforces that you remember it.
A larger library is better served by intercepting in one place — the shapes for
that are on [Browser as a base](/docs/extending/browser-as-a-base), and they
apply here unchanged.

### The log gets shallower

A Browser keyword called from Python is not a keyword in `output.xml` — Robot
Framework never saw a keyword call. Everything Browser logs still appears, but
it appears *inside* the keyword of your library that made the call.

That is the trade every one of these libraries makes: a detailed Robot Framework
log, one row per Browser keyword, becomes your own keyword's log. Log the things
that matter to a reader of the report, because the automatic detail is gone.

## Where these examples come from

Every block on this page is copied from the library's acceptance tests, in
[`atest/test/13_Python_Extension/`](https://github.com/MarketSquare/robotframework-browser/tree/main/atest/test/13_Python_Extension).
`MyLibraryA.py` is a complete worked library for this page, and `context_a.robot`
is the suite that runs it — including the two failing tests above, which are
expected to fail and are the demonstration.
