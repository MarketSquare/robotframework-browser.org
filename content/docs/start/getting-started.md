---
title: Getting started
description: Install Browser, write a first test, and run it.
order: 2
section: start
---

Install the library and its browser binaries, write one test, run it.

## Before you start

You need **Python 3.10 or newer**, and a virtual environment to put this in —
`uv`, `venv` or `pyenv`, whichever your team uses.

## Install

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install "robotframework-browser[bb]"
        output:
          - Successfully installed robotframework-browser-%%browser%% robotframework-browser-batteries-%%browser%%
      - command: rfbrowser install
        output: [Installing Playwright browser binaries…]
        status:
          - { ok: true, text: chromium   downloaded }
          - { ok: true, text: firefox    downloaded }
          - { ok: true, text: webkit     downloaded }
  - shell: powershell
    steps:
      - command: py -m pip install "robotframework-browser[bb]"
        output:
          - Successfully installed robotframework-browser-%%browser%% robotframework-browser-batteries-%%browser%%
      - command: py -m Browser.entry install
        output: [Installing Playwright browser binaries…]
        status:
          - { ok: true, text: chromium   downloaded }
          - { ok: true, text: firefox    downloaded }
          - { ok: true, text: webkit     downloaded }
---
:::

That is the route that needs no Node.js: the `[bb]` extra brings a Node.js
runtime along in the wheel. `rfbrowser install` then downloads three browser
engines, so it is the slow part and it needs a few hundred megabytes — once per
environment.

If you would rather provide Node.js yourself — because your platform has no
wheel, or because a JavaScript extension needs npm packages Browser does not
ship — the commands are `pip install robotframework-browser` and `rfbrowser
init` instead. Both routes, in full, are on
[Installation](/docs/start/installation).

## Your first test

The assertion is part of the keyword — `Get Title` both reads and checks.

The browser runs **headless** by default, so this prints a result without
anything appearing on screen. To watch it, open the browser yourself above
`New Page`:

```robot-repl
New Browser    chromium    headless=False
```

```robot [first.robot]
*** Settings ***
Library    Browser

*** Test Cases ***
Open The Keyword Reference
    New Page     https://robotframework-browser.org
    Get Title    *=    Robot Framework Browser
    Click        nav[aria-label="Main"] >> text="Keywords"
    Get Title    *=    Keyword reference
```

It drives this site, so you can run it right now without an application of your
own — and the pages it touches are the ones you are reading.

Two things are doing work in that selector, and both are worth copying.

`>>` chains: everything left of it narrows the search, so `text="Keywords"` is
looked for only inside the main navigation. The page has a second link with that
exact text — in the row of figures on the landing page — and Playwright is
strict: a selector matching more than one element is an error, not a silent
first-match.

The quotes make it an *exact* match. Without them, `text=Keywords` is a
case-insensitive substring, which would also find "keywords" inside a sentence.
See [selectors](/docs/concepts/selectors).

## Run it

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: robot first.robot
        output:
          - "Open The Keyword Reference                                            | PASS |"
          - "1 test, 1 passed, 0 failed"
---
:::

Robot Framework writes `log.html` into the directory you ran `robot` from — not
next to the test file — unless you pass `--outputdir`. Open it — every keyword,
its arguments and its result are in there, and it is the first place to look
when something fails.

## What is not in that test

No `Sleep`, and no wait keyword before anything. Two different mechanisms are
doing that work:

- **Action keywords** like `Click` wait for the element to be actionable —
  attached, visible, stable and able to receive the click — before acting.
- **Assertions** like the `Get Title` line above re-read the value until it
  matches or the retry window expires.

So a keyword with an assertion operator is itself the wait. A getter *without*
one reads once and returns. That distinction is the whole of
[assertions](/docs/concepts/assertions).
