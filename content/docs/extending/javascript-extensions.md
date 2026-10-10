---
title: JavaScript extensions
description: Add keywords that run on the Node side with full Playwright access — and attach a debugger to them.
section: extending
order: 3
---

A JavaScript module adds keywords that run on the Node side, with the Playwright
`page` object in hand. It is the lighter of the two extension points: no Python,
no class, just exported functions.

Browser loads the module with `require()`. CommonJS is the safe default and what
the library's own tests use, but on the Node versions Browser supports `require()`
also loads ESM, so `export`/`import` works. The one thing it cannot load is an
ESM module using top-level `await`, which fails with `ERR_REQUIRE_ASYNC_MODULE`.

## A module

```javascript
exports.__esModule = true;
exports.getLinks = getLinks;
exports.myMouseWheel = mouseWheel;

getLinks.rfdoc = `Returns every link on the page as a name-to-href mapping.

Implemented in JavaScript.`;
async function getLinks(logger, page) {
  logger('Collecting links');
  return await page.locator('a').evaluateAll(elements => {
    const object = {};
    elements.filter(e => e.innerText).forEach(e => (object[e.innerText] = e.href));
    return object;
  });
}

mouseWheel.rfdoc = 'Scrolls the page by mouse input.';
async function mouseWheel(x, y, logger, page) {
  logger(`Mouse wheel at ${x}, ${y}`);
  await page.mouse.wheel(Number(x), Number(y));
  return await page.evaluate('document.scrollingElement.scrollTop');
}
```

Three conventions carry the whole API:

- **Exported names become keywords** — the *export key*, not the function's own
  name. `exports.getLinks = getLinks` gives `Get Links`; the
  `exports.myMouseWheel = mouseWheel` below gives `My Mouse Wheel`.
- **Six argument names are filled in for you**, by name — see below.
- **`fn.rfdoc` becomes the keyword documentation**, so your keyword shows up in
  Libdoc and in editor tooltips like any other.

### The six names Browser fills in

Name a parameter one of these and the library passes the object in. Everything
else in your signature becomes an ordinary keyword argument.

| Name | You get |
|---|---|
| `page` | The active [Page](https://playwright.dev/docs/api/class-page) |
| `context` | The active [BrowserContext](https://playwright.dev/docs/api/class-browsercontext) |
| `browser` | The active [Browser](https://playwright.dev/docs/api/class-browser) |
| `logger` | A function that writes to the Robot Framework log |
| `playwright` | The [`playwright` module](https://playwright.dev/docs/api/class-playwright) itself |
| `adoptContext` | A function that hands a context you created to Browser — see [Handing over a context you created](#handing-over-a-context-you-created) |

**They are matched by name, not by position.** Browser reads your parameter
names and fills in the ones it recognises, so `mouseWheel(x, y, logger, page)`
and `mouseWheel(logger, x, page, y)` behave identically — and the Robot side
sees the same keyword either way, taking `x` and `y`. Put them wherever reads
best.

These names are reserved: a keyword cannot take an argument called `page` from
Robot Framework, because that name is spoken for. `self` is not usable either.

:since{version="20.4.0"} **Only `page`, `context` and `browser` need an open
browser.** A keyword that takes one of them fails with `No Browser is open but
needed for this operation.` when none is open. A keyword that takes none of them
runs without one, which is what lets a module
[create the first browser itself](#handing-over-a-context-you-created).

One further name is special without being filled in. A parameter called `args`
makes the keyword variadic — it receives Robot Framework's `*args`, so it
carries values *to* your function rather than from the library. It cannot have a
default, and anything you declare after it becomes a named-only argument on the
Robot side, so it reads best last.

Whatever you return is JSON-serialised on the way back, so it must be
serialisable — `undefined` arrives in Robot Framework as `${None}`.

`jsextension` takes a single path, a comma-separated list, or a real list of
paths. Load it at import:

```robot
*** Settings ***
Library    Browser    jsextension=${CURDIR}/module.js

*** Test Cases ***
Read The Links
    New Page    https://playwright.dev
    ${links} =    Get Links
    Log Many    &{links}
```

## Custom selector strategies

A module can also register a selector engine, which then works anywhere a
selector is accepted:

```javascript
async function registerMySelector(playwright) {
  await playwright.selectors.register('myselector', () => ({
    query(root, selector) {
      return root.querySelector(`a[data-title="${selector}"]`);
    },
    queryAll(root, selector) {
      return Array.from(root.querySelectorAll(`a[data-title="${selector}"]`));
    },
  }));
}
exports.__esModule = true;
exports.registerMySelector = registerMySelector;
```

```robot
*** Test Cases ***
Use A Custom Engine
    New Browser           chromium
    Register My Selector
    New Page              ${URL}
    Click                 myselector=Some Title
```

::doc-note
---
kind: warning
---
**Register once per run.** `selectors.register` rejects a name that is already
registered, and because the registration is awaited that rejection fails the
keyword — unawaited, it takes the whole Node process down instead.
::

## Handing over a context you created

:since{version="20.7.0"} A module can create a browser context itself and hand
it to Browser with `adoptContext`. That is how a library supports a platform
that Browser does not launch, such as an Electron application, without Browser
knowing about it:

```javascript
async function launchElectronApplication(executablePath, playwright, adoptContext) {
  const app = await playwright._electron.launch({ executablePath });
  await app.firstWindow();
  return adoptContext(app.context(), { name: 'electron' });
}
exports.__esModule = true;
exports.launchElectronApplication = launchElectronApplication;
```

```robot
*** Settings ***
Library    Browser    jsextension=${CURDIR}/electron.js

*** Test Cases ***
Read The Title Of An Electron Application
    Launch Electron Application    /path/to/app
    Get Title    ==    My App
    Close Browser
```

`adoptContext(context, options)` adds the context as a new browser and makes it
the active one, the same way Browser keeps a persistent context:

- **Its pages become Browser's pages.** The pages the context already has are
  indexed and the first one becomes the active page, so `Click`, `Get Text` and
  the other keywords work on it right away. Pages it opens later can be selected
  with `Switch Page`.
- **It gets Browser's timeout.** Like the contexts Browser creates, its default
  timeout is the library timeout at that moment. For another one, call
  `context.setDefaultTimeout()` after adopting it.
- **`options` describe the browser.** All of them are optional. `name` is what
  `Get Browser Catalog` reports as its type, `adopted` by default, and `headless`
  says whether it runs headless, `false` by default.
- **It returns the ids** of the new browser and context, as an object with
  `browserId` and `contextId`, plus `pageId` if the context has a page. Return
  it from your function and the keyword returns it to Robot Framework.
- **Closing the browser closes the context.** `Close Browser` and automatic
  closing treat it like any other browser.
- **`onClose` releases the rest.** The async option `onClose` runs once after the
  context is closed, even when closing it failed. Pass it for what the context
  does not own. An Electron application quits with its context and needs none; a
  connection to an Android device does not close by itself:
  `adoptContext(context, { onClose: () => device.close() })`.

::doc-note
---
kind: aside
---
Browser does not support Electron or Android itself, and `_electron` and
`_android` are experimental in Playwright. The module, and keeping it working
with the platform, are yours. A module that does more than launch belongs in a
library of its own, built on Browser.
::

## Debugging

You can attach a Node debugger to the Playwright process — to your own extension
or to the library's internals.

### 1. Start Node with debugging enabled

Set `ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS`; its value is passed to the
Node process as CLI options.

::doc-table
---
head: [Option, Behaviour]
rows:
  - ['`--inspect`', 'Debugging on, process starts immediately. Attach whenever.']
  - ['`--inspect-brk`', 'Process pauses until a debugger attaches. Needed to debug startup.']
---
::

Bind it to a specific port so it does not collide with anything else:

```
--inspect=127.0.0.1:9999
```

Set it for the debug session rather than globally. For RobotCode, in
`launch.json`:

```json
{
  "name": "RobotCode: Default",
  "type": "robotcode",
  "request": "launch",
  "purpose": "default",
  "env": {
    "ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS": "--inspect=127.0.0.1:9999"
  },
  "pythonConfiguration": "RobotCode: Python"
}
```

::doc-note
---
kind: warning
---
With `--inspect-brk` you have to attach quickly: the Playwright process start
has a timeout of about **15 seconds**. Miss it and the run fails before you are
attached. On macOS a failed start is retried once, but the first process is
killed and a second one started, so you still only get those 15 seconds to
attach to any one process.
::

### 2. Attach

```json
{
  "name": "Attach to Node",
  "port": 9999,
  "type": "node",
  "request": "attach",
  "skipFiles": ["<node_internals>/**"]
}
```

### 3. Run

1. Set breakpoints in your extension — or in
   `site-packages/Browser/wrapper/index.js` to debug the library itself.
2. Set a breakpoint in the Robot code **early**, after `Library Browser` is
   loaded and before your JS runs. This buys you the time to attach.
3. Start the Robot debug session and wait for that breakpoint.
4. Switch to *Run and Debug*, choose *Attach to Node*, and start it.

Step 2 is the one people skip, and then wonder why the JS breakpoint never
fires: without it the extension has already run by the time you attach.

## Which extension point?

Three shapes, not two. A Python plugin and a JavaScript module both extend the
Browser instance Robot Framework loaded, from the inside. The third is not an
extension point at all: **your own Robot Framework library**, which either sits
alongside Browser or owns the instance itself.

::doc-table
---
head: [You want, Use]
rows:
  - ['Playwright APIs Browser does not expose', 'JavaScript module']
  - ['Assertion arguments like the built-in getters', 'Python plugin with AssertionEngine']
  - ['To replace an existing keyword', 'Python plugin']
  - ['A custom selector engine', 'JavaScript module']
  - ['A platform Browser does not launch, such as Electron', 'JavaScript module that [hands over its context](#handing-over-a-context-you-created), usually in a library of its own']
  - ['Both Python and page-side logic in one keyword', 'Python plugin calling a JS module']
  - ['Business logic in Python — `IF`, `TRY`, parsing — with Browser unchanged', '[Your own Python library](/docs/extending/python-libraries)']
  - ['Your own keywords and your own failure handling, with Browser underneath', '[Browser as a base](/docs/extending/browser-as-a-base)']
---
::

## Before you write one

Somebody may have already written it.
[robotframework-browser-extensions](https://github.com/MarketSquare/robotframework-browser-extensions)
collects working community extensions — accessibility checks with axe-core,
visual comparison, network throttling, request mocking, element highlighting,
and native Playwright page methods.

Reading one is also the fastest way to see the shape of a finished extension
rather than a snippet. And when yours works, it belongs there too: it is a
monorepo that takes pull requests, so publishing is one PR rather than a
release process.
