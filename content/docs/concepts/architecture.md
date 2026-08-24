---
title: How Browser works
description: Python, a Node process and Playwright — what runs where, and where the files land.
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

## Where the Node.js comes from

The *Node.js + Playwright* box is the one you make a decision about at install
time, and there are two ways to fill it. Either a wheel supplies the Node.js —
`pip install robotframework-browser[bb]`, then `rfbrowser install` — or you
install Node.js yourself and `rfbrowser init` builds against it.

Which to pick, what each needs and how to upgrade either is
[Installation](/docs/start/installation). What follows here is what the choice
changes afterwards, which is less than you might expect: the same wrapper, the
same Playwright, the same keywords. It changes where the files sit.

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
