---
title: Logging and debugging
description: Four places Browser tells you what happened — log.html, the Playwright log, traces and coverage.
section: concepts
order: 5
---

Browser writes to more than one place, because it *is* more than one process.
Knowing which file answers which question saves a lot of guessing.

::doc-table
---
head: [Where, What it holds, When to open it]
rows:
  - ['`log.html`', 'The Python side: keywords, arguments, status', 'First. Always.']
  - ['`playwright-log.txt`', 'The Node side of the library', 'A keyword failed and log.html does not say why']
  - ['`browser/traces/trace_*.zip`', 'Every Playwright call, with DOM snapshots', 'Something failed and you need to see the page as it was']
  - ['Coverage report', 'Which code the run actually exercised', 'Asking what the suite does not touch']
---
::

## log.html

Most Browser keywords log a message produced by the Node side — often
including the selector and the value used. More of them appear at DEBUG level.

When a keyword fails, the info level already shows the error from the Playwright
call. Running at debug level shows a good deal more:

```bash
robot --loglevel debug --outputdir output tests/
```

## playwright-log.txt

`${OUTPUT_DIR}/playwright-log.txt` holds the Node side. It is written by
default, created when the Node process starts, and not written at all if you
import with `enable_playwright_debug=disabled`.
The Robot log level does not affect it.

The argument takes three values: `library` (the default — only Browser's own
Node messages), `playwright` (those plus Playwright's `DEBUG=pw:api` output), and
`disabled` (no file at all). `False` and `True` are older aliases for the first
two. For much more detail:

```robot
*** Settings ***
Library    Browser    enable_playwright_debug=playwright
```

::doc-note
---
kind: warning
---
The file mixes two formats: the library's own Node messages are JSON lines, and
Playwright's `DEBUG=pw:api` output is plain text.

That Playwright output includes **the values passed to `fill` and `type`, in
clear text**. `Fill Secret` and `Type Secret` never write the value to
`log.html` — the response is not logged and error messages are scrubbed — but
they cannot stop Playwright's own debug log, and the value also lands in
`trace.zip`. Treat both as secret-bearing. Do not
enable this on a run that touches real credentials.
::

Each run replaces the file. If the old one cannot be deleted — still open on
Windows, for instance — the new log is written beside it as
`playwright-log-<nanoseconds>.txt`.

## Traces

A trace records every Playwright call in a context, with a DOM snapshot at each
step. It is the single most useful artefact when a test fails somewhere you
cannot reproduce.

```robot-repl
New Context    tracing=True
```

The zip is written when the **context closes** — automatically at the
auto-closing level, or when you call `Close Context`. Do not go looking for it
while the browser is still open.

To record for a whole run without touching the tests, set the environment
variable `ROBOT_FRAMEWORK_BROWSER_TRACING=True`. And
`auto_delete_passed_tracing=True` at import keeps only the traces of failed
tests, which is what makes this affordable in CI:

```robot-repl
New Context    tracing=True
```

Open the result either way:

```bash
rfbrowser show-trace output/browser/traces/trace_context=<id>.zip
```

or drop it on [trace.playwright.dev](https://trace.playwright.dev/), which runs
entirely in your browser.

## Coverage

Browser can collect code coverage from the pages it drives — data from
Playwright, report from
[monocart-coverage-reports](https://www.npmjs.com/package/monocart-coverage-reports).

Coverage is enabled **per page**:

```robot
*** Test Cases ***
Checkout Coverage
    New Page    https://example.com/checkout
    Start Coverage    raw=True
    Take Screenshot
    Stop Coverage
```

Combine the per-page data into one report:

```bash
rfbrowser coverage output/browser/coverage/ output/report
```

Combining needs the raw data, which is why `Start Coverage` above passes
`raw=True` — without it there is nothing to merge and the command fails with
`No raw reports found`. The same thing is available as the
`Merge Coverage Reports` keyword.

Monocart takes a [config file](https://www.npmjs.com/package/monocart-coverage-reports#config-file)
if you need filtering, which you probably will — third-party bundles otherwise
dominate the numbers.
