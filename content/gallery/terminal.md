---
title: Terminal
description: Literal shell only. Structured, because prompts, output and result lines are different things.
order: 5
---

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install robotframework-browser
        output: [Successfully installed robotframework-browser-20.2.0]
      - command: rfbrowser init
        status:
          - { ok: true, text: chromium downloaded }
          - { ok: false, text: webkit failed — see rfbrowser.log }
  - shell: powershell
    steps:
      - command: py -m pip install robotframework-browser
---
::

Unlike code, a terminal block stays structured. The prompt is not selectable,
so copying yields runnable commands; output and result lines are styled
differently because they *are* different. Supplying more than one shell gives
tabs that preselect the reader's own OS.
