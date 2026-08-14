---
title: Robot Framework Browser
description: A browser automation library for Robot Framework, powered by Playwright. Speed, reliability and visibility, with assertions built into the keywords.
---

::::page-hero{logo="/logo/browser.svg"}
#title
:::rotating-title
---
titles:
  - "Browser automation\nthat doesn't flake."
  - "Browser automation\nthat doesn't suck."
  - "Browser automation\nfaster than sound."
  - "Browser automation\nready for the future."
  - "Browser automation that sees shadow DOM."
  - "Browser automation\nthat waits for you."
  - "Browser automation\nyour team can read."
  - "Browser automation\nwith zero sleeps."
  - "Browser automation\nbuilt to outlast CSS."
  - "Browser automation\nthat says what broke."
---
:::

#default
Robot Framework deserves a browser automation solution designed for the 2020s.
Browser library, powered by [Playwright](https://playwright.dev/), provides
speed, reliability and visibility.

:::btn-row
:btn{to="#start" primary}[Get started]
:btn{to="/why"}[Why Browser]
:::

:::stat-row
:stat{value="%%browser%%" to="https://github.com/MarketSquare/robotframework-browser/releases"}[Browser]
:stat{value="%%playwrightBundled%%" to="https://playwright.dev/docs/release-notes"}[Playwright]
:stat{value="%%node%%" to="https://nodejs.org/en/download"}[Node]
:stat{value="%%keywords%%" to="/keywords"}[Keywords]
:stat{value="%%stars%%" icon="⭐" to="https://github.com/MarketSquare/robotframework-browser"}[Stars]
:stat{value="%%contributors%%" to="/community#hall"}[Contributors]
:stat{value="%%releases%%" to="https://pypi.org/project/robotframework-browser/#history"}[Releases]
:stat{value="0"}[Sleeps]
:::
::::

::::page-section{label="What you get" title="Speed, reliability and visibility."}
:::card-grid
::card{title="Speed" accent="green"}
One Node process drives Chromium, Firefox and WebKit. No driver binary per
browser, no version to keep in step with an update.
::

::card{title="Reliability" accent="green"}
Every action waits for the element to be actionable before it acts. No sleeps
to tune, and no flake to chase down.
::

::card{title="Visibility" accent="green"}
Video, a Playwright trace and a screenshot on failure, attached to the Robot
Framework log.
::
:::

:::feature-grid
- Conscientious assertions
- Precise and fast browser window and tab control
- Chainable selector strategies
- Good shadow DOM support
- Simple descriptors for mobile devices
- Sending HTTP requests
:::

[How it works, and how it compares](/why)
::::

::::page-section{label="Quick start" title="Running in five minutes." tone="panel" id="start"}
Three blocks. Copy them in order and you have a passing test — nothing to
configure in between.

### Install the library and the browsers

`rfbrowser init` downloads the browser binaries Playwright drives. The tabs
below pick your shell automatically.

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install robotframework-browser
        output: [Successfully installed robotframework-browser-%%browser%%]
      - command: rfbrowser init
        output: [Installing Playwright browser binaries…]
        status:
          - { ok: true, text: chromium   downloaded }
          - { ok: true, text: firefox    downloaded }
          - { ok: true, text: webkit     downloaded }
  - shell: powershell
    steps:
      - command: py -m pip install robotframework-browser
        output: [Successfully installed robotframework-browser-%%browser%%]
      - command: py -m Browser.entry init
        output: [Installing Playwright browser binaries…]
        status:
          - { ok: true, text: chromium   downloaded }
          - { ok: true, text: firefox    downloaded }
          - { ok: true, text: webkit     downloaded }
---
:::

### Write a test

One import, no setup keyword, no explicit waits. `Get Text` both reads the
value and asserts it.

```robot [first.robot]
*** Settings ***
Library     Browser

*** Test Cases ***
Search Robot Framework
    New Page      https://robotframework.org
    Fill Text     css=input[type="search"]    browser
    Keyboard Key  press    Enter
    Get Text      body    *=    Browser
```

### Run it

Robot Framework as usual — the browser opens, acts and closes.

:::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: robot first.robot
        output: ['=========================================================', First]
        status:
          - { ok: true, text: Search Robot Framework }
      - output: ['1 test, 1 passed, 0 failed']
---
:::

Next: the [getting-started guide](/docs/start/getting-started), or the
[keyword reference](/keywords).
::::

::::page-section{label="Community" title="Use. Benefit. Contribute." last}
Browser library is built in the open by the Robot Framework community — 206
people so far. Questions, ideas and bug reports are how most of them started,
and how the library got this far.

:::btn-row
:btn{to="/community" primary}[Community and contributing]
:btn{to="https://forum.robotframework.org/c/libraries/browser"}[Forum]
:btn{to="https://github.com/MarketSquare/robotframework-browser"}[GitHub]
:::

::core-team
::

### And 206 people who made it better

Bug reports, ideas, documentation, running main against a real suite before it
was ever released. Most of them never wrote a line of code for Browser.
[See who did what](/community#hall).

::contributor-wall{compact :limit="60"}
::

**Let's make the best Browser library.**
::::
