---
title: Where recorded keywords go
description: The suite file, a resource file or only the log; written live after every action; what the recorder changes in a file and what it never touches.
section: recording
order: 5
---

Both recording keywords take a `file` argument. Wherever it points, the keyword
is written **after every action**, not at the end — a crashed browser or a
killed run leaves everything recorded so far behind.

## Choosing the file

::doc-table
---
head: [file, Writes to]
nowrap: [0]
rows:
  - ['*(not given)*', 'The suite file that is running — `${SUITE_SOURCE}`. The keyword lands next to the test that recorded it. Called from a suite initialisation file, it goes into that `__init__.robot` — and can then only be used in that file.']
  - ['`${CURDIR}/keywords.resource`', 'A resource file, created if it does not exist. Use `${CURDIR}` for a path next to the suite; a relative path is resolved against the working directory, not the suite.']
  - ['`${None}`', 'No file at all. The keywords go to the console and the log, at INFO level.']
---
::

```robot-repl
Record Keyword     Add Product To Cart
Record Keyword     Add Product To Cart    ${CURDIR}/shop.resource
Record Keywords    ${CURDIR}/shop.resource
Record Keyword     Try Something         file=${None}
```

A resource file is the usual home for a keyword library: import it in the
suites that need it.

```robot
*** Settings ***
Library     Browser
Resource    shop.resource
```

`${None}` is for trying things out — and for pipelines where nothing may write
to the sources. Both keywords also **return** the recorded text, including the
`*** Keywords ***` header, whatever `file` says:

```robot-repl
${keywords} =    Record Keywords    file=${None}
Log    ${keywords}
```

## What the recorder changes in a file

The recorder owns **only the keyword it is recording**. Before every save it
reads the file again and replaces that one block; the rest is left as it is on
disk at that moment. So you can keep the file open in your editor and even
change other parts of it while recording.

- A missing `*** Keywords ***` section is added at the end of the file.
- The file keeps its line endings (LF or CRLF), its byte order mark and whether it
  ends with a newline.
- An **existing keyword is never extended or overwritten.** A name that is
  already in the file is rejected when you start recording.
- If you edit the block of the keyword *while* it is being recorded, the next
  action writes the recorded version again, and the toolbar tells you so.
- A file that is not valid UTF-8 is refused rather than rewritten, with the
  reason in the toolbar.
- *Discard* removes the keyword from the file again.

The folder must exist, and an existing file must be writable — a read-only file
is never overwritten. Both are checked **before** recording starts, so a typo in
the path fails at once, not after ten minutes of clicking.

If the file stops being writable during the session — the disk fills up, another
tool locks it — the toolbar shows the error, the keyword stays in memory and the
next action tries again. A keyword that still cannot be written when the session
ends is never lost silently: `Record Keyword` fails, and the recorded text is in
the log as a warning, ready to copy.

## When the new keyword is usable

Robot Framework reads a suite before it runs it, so a keyword recorded into the
running suite exists from the **next** run on. To use it in the same run, record
into a resource file and import it afterwards:

```robot
*** Test Cases ***
Record And Use
    New Browser    chromium    headless=False
    New Page       https://robotframework-browser.org
    Record Keyword    Find The Get Text Keyword    ${CURDIR}/recorded.resource
    Import Resource    ${CURDIR}/recorded.resource
    Go To    https://robotframework-browser.org
    Find The Get Text Keyword
```

## The idle timeout

A recording ends by itself after `idle_timeout` without an action or toolbar
command — 5 minutes by default — so a forgotten recording cannot block a run
forever. The keyword being recorded is saved.

```robot-repl
Record Keywords    ${CURDIR}/shop.resource    idle_timeout=20 min
Record Keywords    ${CURDIR}/shop.resource    idle_timeout=${None}
```

`${None}` waits without limit; use it only where somebody is sure to end the
session.
