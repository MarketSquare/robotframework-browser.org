---
title: Environment variables
description: The variables that change how Browser behaves, which of them are safe in production, and the import parameters that should usually be preferred.
order: 2
section: operations
---

Four environment variables change how Browser's Node process behaves. They are
documented here mainly so that nobody discovers them by accident and uses them
without knowing what they cost — **two of them must not be set in production**.

::doc-table
---
head:
  - Variable
  - Safe in production
  - What it does
rows:
  - - "`ROBOT_FRAMEWORK_BROWSER_NODE_PORT`"
    - Yes
    - Connect to an existing Node process on this port instead of starting one.
      The import parameter `playwright_process_port` does the same thing, more
      precisely.
  - - "`ROBOT_FRAMEWORK_BROWSER_NODE_COVERAGE`"
    - "**No**"
    - Set to exactly the string `1` to collect code coverage for the Node
      process — `true` and `yes` do nothing. For developing Browser itself. Not
      supported on Windows.
  - - "`ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS`"
    - "**No**"
    - Comma-separated Node command-line arguments, for example `--inspect`.
      A debugging tool; see [The Node process](/docs/operations/node-process).
  - - "`ROBOT_FRAMEWORK_BROWSER_PINO_LOG_LEVEL`"
    - Yes
    - Log level of the Node process's own logger, default `info`. Set it to
      `debug` for more in `playwright-log.txt`. The `rfbrowser` subcommands
      that start a browser themselves — `show-trace`, `launch-browser-server` —
      force it to `error` so their console output stays clean, overriding
      whatever you set.
---
::

One more is read by the Python side rather than by Node:
`ROBOT_FRAMEWORK_BROWSER_TRACING`. Any truthy value — `true`, `1`, `yes` — is
equivalent to passing `tracing=True` to `New Context`, which is the way to record
traces for a whole run without editing the tests. A Robot Framework variable of
the same name works too, and is checked first.

It only reaches contexts you create yourself. `New Page` and `Open Browser`
against no open browser create their context on the Node side, which never
consults the variable — so those contexts are not traced. If you want a trace,
open the context explicitly.

## Prefer the import parameter

Where a variable and an import parameter do the same job, reach for the
parameter:

```robot
*** Settings ***
Library    Browser    playwright_process_port=12345
```

An environment variable applies to every Robot Framework process in that shell,
including the suites you did not mean to change, and it lives outside the files
you version. An import parameter is scoped to the suite that declares it, and it
is visible in the same file as the rest of that suite's configuration.

The variable is still the right tool when the setting belongs to the *machine*
rather than the suite — a CI runner that must always talk to a shared process,
for instance.

Note the precedence, because it runs the other way from what the wording
suggests: an explicit `playwright_process_port` import parameter is checked
first and **wins**, so the variable only reaches suites that do not set the
parameter themselves.

## BrowserBatteries

These variables behave identically whether the Node process comes from a Node.js
you installed yourself or from the one bundled in
[robotframework-browser-batteries](https://pypi.org/project/robotframework-browser-batteries/)
— the two [installation routes](/docs/start/installation).

::doc-note
That was not always true. In older releases these two were silently ignored when
BrowserBatteries was installed, because its bundled Node.js was a packaged binary
that could not accept Node arguments. If a debug flag appears to do nothing,
check whether you are on a current release before looking anywhere else.
::

One difference is still real. Where the plain library defaults
`PLAYWRIGHT_BROWSERS_PATH` to `0`, BrowserBatteries defaults it to the resolved
path of its own browser directory. Both put the binaries somewhere Browser owns,
and setting the variable yourself wins in either case — but the value you see if
you print it differs.

## What is not here

Playwright reads environment variables of its own, and they mostly reach it
unchanged because Browser runs Playwright. Two exceptions, both set by Browser
before it starts Node: `DEBUG` is forced to `pw:api` when Playwright debug
logging is enabled, and `PLAYWRIGHT_BROWSERS_PATH` defaults to `0` when you have
not set it — which puts the binaries inside the library's own `node_modules`
rather than in Playwright's shared cache. Setting it yourself is honoured
everywhere.

`PLAYWRIGHT_BROWSERS_PATH` is the one you are most likely to want — it decides where `rfbrowser init` puts the browser
binaries, and it is how you share one download between users or bake browsers
into a container image. Those are documented by
[Playwright](https://playwright.dev/docs/browsers), not by us, and we deliberately
do not copy the list here: a copy would be wrong the day Playwright changes it.
