---
title: Python plugins
description: Add or replace keywords from Python, with access to the library's own API and to the Node side.
section: extending
order: 1
---

The Python plugin API adds keywords to Browser, or replaces existing ones,
without forking the library. It is provided by
[PythonLibCore](https://github.com/robotframework/PythonLibCore).

::doc-note
This is the more capable of the two extension points. A
[JavaScript module](/docs/extending/javascript-extensions) runs only on the Node
side; a Python plugin can use both, and can use
[AssertionEngine](https://github.com/MarketSquare/AssertionEngine) directly —
decorate the keyword with `Browser.assertion_engine.with_assertion_polling` and
call `verify_assertion` yourself — to give your keywords the same retrying
assertion arguments the built-in getters have.
::

## A Python-only plugin

Subclass `LibraryComponent` and decorate with `@keyword`:

```python
import json

from robot.api import logger
from robot.api.deco import keyword

from Browser.base.librarycomponent import LibraryComponent
from Browser.generated.playwright_pb2 import Request


class SimplePythonPlugin(LibraryComponent):

    @keyword
    def cookie_via_public_api(self) -> dict:
        """Uses Browser's own public API."""
        cookies = self.library.get_cookies()
        logger.debug(json.dumps(cookies, indent=4, default=str))
        assert len(cookies) == 1, "Too many cookies."
        return {"name": cookies[0]["name"], "value": cookies[0]["value"]}

    @keyword
    def cookie_via_grpc(self) -> dict:
        """Calls the Node side directly over gRPC."""
        with self.playwright.grpc_channel() as stub:
            response = stub.GetCookies(Request().Empty())
            cookies = json.loads(response.json)
        return {"name": cookies[0]["name"], "value": cookies[0]["value"]}
```

Load it at import:

```robot
*** Settings ***
Library    Browser    plugins=${CURDIR}/SimplePythonPlugin.py

*** Test Cases ***
Read A Cookie
    New Page    https://example.com
    Add Cookie    session    abc123    url=https://example.com
    ${cookie} =    Cookie Via Public Api
    Should Be Equal    ${cookie}[name]    session
```

Two routes are shown above deliberately. `self.library` is the supported public
API and should be your default. Dropping to gRPC gets you at anything the Node
side can do, at the cost of coupling to internals that may change.

Several plugins can be loaded at once — `plugins=` takes one name, a
comma-separated list, or a real list. Arguments go after the class, separated by
semicolons: `plugins=pkg.Plugin;arg1;kw=val`.

Two rules that fail loudly, and one that does not:

- The class name must match the module or file name, or the import fails with
  `DataError`.
- A plugin that does not inherit `LibraryComponent` fails with `PluginError`.
- A plugin keyword whose **method name** matches a built-in silently replaces
  it. Plugins load last — library keywords, then JavaScript extensions, then
  plugins — so last wins, with no warning. The exception is the handful of
  keywords declared with an explicit `@keyword(name=...)`, such as
  `Evaluate JavaScript`, `Get BoundingBox` and the storage keywords: matching
  their method name creates a duplicate instead, and the suite fails with
  *Keyword with same name defined multiple times*. Give your method the same
  `@keyword(name=...)` to replace one of those. Every plugin keyword is tagged
  `Plugin`, which is how you spot one in Libdoc.

## Selectors inside a plugin

The public keywords resolve the `Set Selector Prefix` value for you, so a
plugin that calls them needs to do nothing:

```python
@keyword
def disable_element(self, selector):
    """Disables an element."""
    self.library.evaluate_javascript(selector, "e => e.disabled = true")
```

Resolve it yourself with `self.resolve_selector(selector)` only when you bypass
the public API — a direct gRPC call, or `call_js_keyword`.

For a keyword that should also honour presenter mode — highlighting the element
and pausing so a human can follow along — use `presenter_mode`, which resolves
the selector as well:

```python
@keyword
def highlight_and_blur(self, selector):
    """Blurs the element, honouring presenter mode."""
    selector = self.presenter_mode(selector, self.strict_mode)
    self.call_js_keyword("myBlur", selector=selector)
```

`call_js_keyword` reaches a keyword from any JavaScript module registered on the
Node side — one this plugin loaded with `initialize_js_extension`, or one loaded
through the library's `jsextension=` argument — it is not a way to call arbitrary Playwright
methods, so `myBlur` has to exist in that module.

## Calling JavaScript from a Python plugin

Load a JS module in the constructor, then call into it:

```python
from pathlib import Path

from robot.api.deco import keyword

from Browser import Browser
from Browser.base.librarycomponent import LibraryComponent


class PythonPlugin(LibraryComponent):
    def __init__(self, library: Browser):
        super().__init__(library)
        self.initialize_js_extension(Path(__file__).parent.resolve() / "JSPlugin.js")

    @keyword
    def my_mouse_wheel(self, x: int, y: int):
        """Calls a custom JavaScript keyword from JSPlugin.js."""
        return self.call_js_keyword("myMouseWheel", x=x, y=y)
```

::doc-note
---
kind: warning
---
Every argument to `call_js_keyword` must be **named** and JSON serialisable —
passing one positionally raises `TypeError`. The names `page`, `context`,
`browser`, `logger` and `playwright` are reserved: the Node side injects those
itself, so you cannot pass your own.
::

This combination is usually the one you want: the keyword signature, type
conversion and documentation are Python, and only the part that genuinely needs
the page is JavaScript.
