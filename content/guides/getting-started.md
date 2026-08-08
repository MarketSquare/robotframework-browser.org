---
title: Getting started
description: Install Browser, write a first test, and run it.
order: 1
---

Install the library and its browser binaries, write one test, run it. Five minutes.

## Install

::terminal
---
sessions:
  - shell: bash
    steps:
      - command: pip install robotframework-browser
        output:
          - Successfully installed robotframework-browser-20.2.0
      - command: rfbrowser init
        status:
          - { ok: true, text: chromium, firefox and webkit downloaded }
  - shell: powershell
    steps:
      - command: py -m pip install robotframework-browser
      - command: py -m Browser.entry init
---
::

## Your first test

The assertion is part of the keyword — `Get Text` both reads and checks.

::editor
---
files:
  - name: first.robot
    lang: robot
    code: |
      *** Settings ***
      Library    Browser

      *** Test Cases ***
      Sign In
          New Page     https://example.com/login
          Fill Text    id=user    admin
          Click        text=Sign in
          Get Text     h1    ==    Welcome
---
::

No `Sleep`, and no `Wait Until Element Is Visible` in front of anything: every
keyword waits for the element to be actionable before it acts.
