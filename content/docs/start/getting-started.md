---
title: Getting started
description: Install Browser, write a first test, and run it.
order: 1
section: start
---

Install the library and its browser binaries, write one test, run it.

## Before you start

You need **Python 3.10 or newer** and **Node.js with npm on your PATH** —
`rfbrowser init` runs `npm ci` and `npx playwright install` underneath, and fails
with a clear message if npm is missing.

If you would rather not install Node.js at all, there is a second route: the
`robotframework-browser-batteries` package ships its own Node runtime. See
[how Browser works](/docs/concepts/architecture).

## Install

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install robotframework-browser
        output:
          - Successfully installed robotframework-browser-%%browser%%
      - command: rfbrowser init
        status:
          - { ok: true, text: chromium downloaded }
          - { ok: true, text: firefox downloaded }
          - { ok: true, text: webkit downloaded }
  - shell: powershell
    steps:
      - command: py -m pip install robotframework-browser
        output:
          - Successfully installed robotframework-browser-%%browser%%
      - command: rfbrowser init
        status:
          - { ok: true, text: chromium downloaded }
          - { ok: true, text: firefox downloaded }
          - { ok: true, text: webkit downloaded }
---
:::

`rfbrowser init` downloads three browser engines, so it is the slow part and it
needs a few hundred megabytes. You only do it once per environment.

## Your first test

The assertion is part of the keyword — `Get Title` both reads and checks.

```robot [first.robot]
*** Settings ***
Library    Browser

*** Test Cases ***
Open The Keyword Reference
    New Page     https://robotframework-browser.org
    Get Title    *=    Robot Framework Browser
    Click        text=Keywords
    Get Title    *=    Keyword reference
```

It drives this site, so you can run it right now without an application of your
own — and the pages it touches are the ones you are reading.

## Run it

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: robot first.robot
        output:
          - "Search The Robot Framework Site                                | PASS |"
          - "1 test, 1 passed, 0 failed"
---
:::

Robot Framework writes `log.html` next to the test. Open it — every keyword,
its arguments and its result are in there, and it is the first place to look
when something fails.

## What is not in that test

No `Sleep`, and no wait keyword before anything. Two different mechanisms are
doing that work:

- **Action keywords** like `Click` wait for the element to be actionable —
  attached, visible, stable and able to receive the click — before acting.
- **Assertions** like `Get Title    *=    Robot Framework` re-read the value
  until it matches or the retry window expires.

So a keyword with an assertion operator is itself the wait. A getter *without*
one reads once and returns. That distinction is the whole of
[assertions](/docs/concepts/assertions).
