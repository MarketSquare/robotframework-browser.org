---
title: Python plugins
description: Add or replace keywords from Python, with access to the library's own API and to the Node side.
section: extending
order: 1
---

The Python plugin API adds keywords to Browser, or replaces existing ones,
without forking the library. It is provided by
[PythonLibCore](https://github.com/robotframework/PythonLibCore) and works the
same way as SeleniumLibrary's.

::doc-note
This is the more capable of the two extension points. A
[JavaScript module](/docs/extending/javascript-extensions) runs only on the Node
side; a Python plugin can use both, and can use
[AssertionEngine](https://github.com/MarketSquare/AssertionEngine) so your
keywords get the same assertion arguments the built-in getters have.
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
        logger.debug(json.dumps(cookies, indent=4))
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
    ${cookie} =    Cookie Via Public Api
    Should Be Equal    ${cookie}[name]    session
```

Two routes are shown above deliberately. `self.library` is the supported public
API and should be your default. Dropping to gRPC gets you at anything the Node
side can do, at the cost of coupling to internals that may change.

Several plugins can be loaded at once. Making sure they do not collide is your
problem, not the library's.

## Selectors inside a plugin

A keyword that takes a selector must resolve it itself — the prefix set by
`Set Selector Prefix` is not applied for you:

```python
@keyword
def disable_element(self, selector):
    """Disables an element."""
    selector = self.resolve_selector(selector)
    self.library.evaluate_javascript(selector=selector, "e => e.disabled = true")
```

For a keyword that should also honour presenter mode — highlighting the element
and pausing so a human can follow along — use `presenter_mode`, which resolves
the selector as well:

```python
@keyword
def blur(self, selector):
    """Calls blur on the element."""
    selector = self.presenter_mode(selector, self.strict_mode)
    self.call_js_keyword("blur", selector=selector)
```

## Calling JavaScript from a Python plugin

Load a JS module in the constructor, then call into it:

```python
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
Every argument to `call_js_keyword` must be **named**, and must be JSON
serialisable. Positional arguments will not reach the other side.
::

This combination is usually the one you want: the keyword signature, type
conversion and documentation are Python, and only the part that genuinely needs
the page is JavaScript.
