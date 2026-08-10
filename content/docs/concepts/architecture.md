---
title: How Browser works
description: Python, a Node process and Playwright — what runs where, and which installation to choose.
section: concepts
order: 5
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
  - ['`robotframework-browser-batteries`', 'No', 'Fewest moving parts — but you still install browser binaries unless you already have a Chromium-based browser.']
  - ['`robotframework-browser` + `rfbrowser init`', 'Yes', 'Your OS or CPU is not covered, or you need extra Node dependencies.']
---
::

### Without Node.js — the fewest moving parts

```bash
pip install robotframework-browser-batteries
```

`robotframework-browser-batteries` is a platform-specific Python wheel carrying
an unmodified official Node.js runtime, the gRPC wrapper and its production Node
dependencies, installed into `site-packages/BrowserBatteries/bin/`. It is not a
single binary — it is a real `node` plus a `node_modules`.

Then, if you need browser binaries — you may not, if you already have a
Chromium-based browser and only intend to use that:

```bash
rfbrowser install            # all three engines
rfbrowser install firefox    # just one
```

The catch is coverage. Wheels exist for Linux x64 and arm64, Windows x64, and
macOS x64 and arm64 — and they need **glibc 2.28 or newer** (Debian 10, RHEL 8,
Ubuntu 20.04) and **macOS 13.5 or newer** (the wheel tag can only say 13.0, so on 13.0–13.4
pip installs it and the bundled Node.js will not start). There is no musl wheel and none for
Windows on arm. On anything outside that, pip finds no wheel and you want the
Node.js route. It also carries only what Browser itself needs, so extra Node
dependencies are the other method's job.

### With Node.js

```bash
pip install robotframework-browser
rfbrowser init               # mandatory — the library does not work without it
rfbrowser init chromium      # or just one engine
```

Slower to set up, but works anywhere Python and Node.js do, and leaves you a
normal Node toolchain — `npm` and `npx` — on the machine.

Do not install extra Node packages into `Browser/wrapper` by hand: `rfbrowser
init` runs `npm ci` there, which deletes `node_modules` and reinstalls exactly
the production dependencies from the shipped lockfile, so anything you added
disappears on the next init or
upgrade.

## Where things end up

Everything installs into the Python environment, for example
`.venv/lib/python3.14/site-packages/Browser/`. Node dependencies go to
`Browser/wrapper/node_modules` with `rfbrowser init`, or ship inside
`BrowserBatteries/bin/wrapper/node_modules` with batteries.

Browser binaries are Playwright's, but the location is not Playwright's default:
when `PLAYWRIGHT_BROWSERS_PATH` is unset, Browser sets it to `0`, which puts
them in `Browser/wrapper/node_modules/playwright-core/.local-browsers` — inside
the Python environment rather than in Playwright's shared user cache. Setting the
variable yourself moves them.

Installation logs to the console and to `site-packages/Browser/rfbrowser.log`,
which rotates at about 2 MB and keeps ten previous files. If that directory is
not writable, the log goes to the working directory instead.

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
environments share a machine, wasteful — because the default puts a copy inside
each installation.

On the Node.js route, install them once outside the library. Run `npx` from the
library's own wrapper directory so the pinned Playwright is used — a bare `npx
playwright install` fetches whatever npm resolves, and browser builds are
version-specific:

```bash
rfbrowser init --skip-browsers
cd "$(python -c 'import Browser, pathlib; print(pathlib.Path(Browser.__file__).parent / "wrapper")')"
PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers npx playwright install
```

With batteries there is no npm or npx; the equivalent is
`PLAYWRIGHT_BROWSERS_PATH=$HOME/pw-browsers rfbrowser install`.

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
looks in the library's own `.local-browsers` directory, finds it empty, and
reports that the browser executable does not exist.
::
