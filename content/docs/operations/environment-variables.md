---
title: Environment variables
description: The variables that change how Browser behaves, which of them are safe in production, and the import parameters that should usually be preferred.
order: 2
section: operations
---

Three environment variables change how Browser's Node process behaves. They are
documented here mainly so that nobody discovers them by accident and uses them
without knowing what they cost — **two of the three must not be set in
production**.

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
    - Set to `1` to collect code coverage for the Node process. For developing
      Browser itself. Not supported on Windows.
  - - "`ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS`"
    - "**No**"
    - Comma-separated Node command-line arguments, for example `--inspect`.
      A debugging tool; see [The Node process](/docs/operations/node-process).
---
::

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
for instance, where you want it to apply whatever anyone imports.

## BrowserBatteries

These variables behave identically whether the Node process comes from a Node.js
you installed yourself or from the one bundled in
[robotframework-browser-batteries](https://pypi.org/project/robotframework-browser-batteries/).

::doc-note
That was not always true. In **Browser 20.1.0 and earlier**, `NODE_COVERAGE` and
`NODE_DEBUG_OPTIONS` were silently ignored when BrowserBatteries was installed:
the Node process was a prebuilt binary that could not accept Node arguments. If
you are on an older release and a debug flag appears to do nothing, this is why.
::

## What is not here

Playwright reads environment variables of its own, and they reach Browser
unchanged because Browser runs Playwright. `PLAYWRIGHT_BROWSERS_PATH` is the one
you are most likely to want — it decides where `rfbrowser init` puts the browser
binaries, and it is how you share one download between users or bake browsers
into a container image. Those are documented by
[Playwright](https://playwright.dev/docs/browsers), not by us, and we deliberately
do not copy the list here: a copy would be wrong the day Playwright changes it.
