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
  - ['`trace.zip`', 'Every Playwright call, with DOM snapshots', 'Something failed and you need to see the page as it was']
  - ['Coverage report', 'Which code the run actually exercised', 'Asking what the suite does not touch']
---
::

## log.html

Robot Framework's log contains mostly the Python half. Some keywords log a
little from the Node side — usually just the status.

When a keyword fails, the info level already shows the error from the Playwright
call. Running at debug level shows a good deal more:

```bash
robot --loglevel debug --outputdir output tests/
```

## playwright-log.txt

`${OUTPUT_DIR}/playwright-log.txt` is always written and holds the Node side.
The Robot log level does not affect it.

For much more detail, enable Playwright's own logging at import:

```robot
*** Settings ***
Library    Browser    enable_playwright_debug=True
```

::doc-note
---
kind: warning
---
Playwright debug logging writes **everything as plain text, including secrets**.
A value passed with `Fill Secret` is masked in `log.html` but not here. Do not
enable this on a run that touches real credentials.
::

Each run overwrites the file.

## Traces

A trace records every Playwright call in a context, with a DOM snapshot at each
step. It is the single most useful artefact when a test fails somewhere you
cannot reproduce.

```robot-repl
New Context    tracing=True
```

Only recording when you need it is easy:

```robot-repl
New Context    tracing=${{$LOGLEVEL == 'TRACE'}}
```

Open the result either way:

```bash
rfbrowser show-trace output/trace.zip
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
    Start Coverage
    Take Screenshot
    Stop Coverage
```

Combine the per-page data into one report:

```bash
rfbrowser coverage output/browser/coverage/ output/report
```

Monocart takes a [config file](https://www.npmjs.com/package/monocart-coverage-reports#config-file)
if you need filtering, which you probably will — third-party bundles otherwise
dominate the numbers.
