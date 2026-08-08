---
title: How Browser works
description: Python, a Node process and Playwright — what runs where, and which installation to choose.
section: concepts
order: 1
---

Browser is a Python library that drives [Playwright](https://playwright.dev/)
running in Node.js. The two halves talk over gRPC.

That one sentence explains most of the library's behaviour: why installation has
two moving parts, why there is a second log file, and why a keyword can be fast
even though it crosses a process boundary.

```
Robot Framework  →  Browser (Python)  →  gRPC  →  Node.js + Playwright  →  browser
```

One Node process drives Chromium, Firefox and WebKit. There is no driver binary
per browser and no driver version to keep in step with a browser update.

## Two ways to install

::doc-table
---
head: [Method, Node.js needed, Choose it when]
rows:
  - ['`robotframework-browser-batteries`', 'No', 'Default. Simplest, nothing to install outside Python.']
  - ['`robotframework-browser` + `rfbrowser init`', 'Yes', 'Your OS or CPU is not covered, or you need extra Node dependencies.']
---
::

### Without Node.js — the recommended start

```bash
pip install robotframework-browser-batteries
```

`BrowserBatteries` is a precompiled Python wheel containing the Node binary, all
Node dependencies and the gRPC server as a single executable. Nothing else to
install.

Then, if you need browser binaries — you may not, if you already have a
Chromium-based browser and only intend to use that:

```bash
rfbrowser install            # all three engines
rfbrowser install firefox    # just one
```

The catch is coverage: batteries are not built for every OS and CPU
combination, and some Linux distributions ship a `gcc` that is not supported.
It also contains only what Browser itself needs, so if you want extra Node
dependencies you want the other method.

### With Node.js

```bash
pip install robotframework-browser
rfbrowser init               # mandatory — the library does not work without it
rfbrowser init chromium      # or just one engine
```

Slower to set up, but works anywhere Python and Node.js do, and lets you add
your own Node dependencies.

## Where things end up

Everything installs into the Python environment, for example
`.venv/lib/python3.14/site-packages/Browser/`. Node dependencies go to
`Browser/wrapper` by default. Browser binaries are managed by Playwright and
their location is controlled by `PLAYWRIGHT_BROWSERS_PATH`.

Installation logs to the console and to `site-packages/Browser/rfbrowser.log`.
The last ten `rfbrowser` commands are kept, then rotated.

## Managing environments

::doc-note
The single rule worth stating: **never install into the system Python.** You
will need to test against more than one Python version sooner than you expect,
and an unpicked system install is painful to undo.
::

Use `uv`, `pyenv` or plain `venv` — all are fine, and which suits you depends on
your organisation more than on Browser. For Node.js, use a version manager too:
`n` or `nvm` on Linux and macOS, `nvm-windows` or `nodist` on Windows.

## Browser binaries in CI

Downloading browser binaries on every CI run is slow and, where several
environments share a machine, wasteful — each installation carries its own copy.

Install them once, outside the library:

```bash
rfbrowser init --skip-browsers
PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers npx playwright install
```

Then set the same variable before running the tests:

```bash
PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers robot tests/
```

::doc-note
---
kind: warning
---
`PLAYWRIGHT_BROWSERS_PATH` must be set for the `robot` command too, not only for
the install step. If it is set during install and not during the run, Playwright
looks in its default location and reports that no browser is installed.
::
