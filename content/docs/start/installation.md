---
title: Installation
description: The two ways to install Browser — with a bundled Node.js runtime, or with one you provide yourself — and how to upgrade and remove each.
order: 1
section: start
---

Browser is a Python library that drives Playwright running in Node.js, so
something has to supply that Node.js. There are two ways to do it, and the only
real decision at install time is which.

Both need **Python 3.10 or newer**, and both should be done in a virtual
environment.

## Choose a route

::doc-table
---
head:
  - ""
  - Without Node.js
  - With Node.js
rows:
  - - "`pip install`"
    - "`robotframework-browser[bb]`"
    - "`robotframework-browser`"
  - - Then run
    - "`rfbrowser install`"
    - "`rfbrowser init`"
  - - Node.js from
    - The wheel, already on disk after `pip`
    - You, on the `PATH`
  - - Works on
    - Linux x64/arm64, Windows x64, macOS x64/arm64
    - Anywhere Python and Node.js both run
  - - Extra npm packages
    - No — what ships is what you get
    - Yes
  - - Leaves you `npm` and `npx`
    - No
    - Yes
---
::

Start on the left. It is fewer moving parts, and in an environment where
installing Node.js means a ticket and a wait, it removes the whole conversation.

Go right when something in that column is yours: a platform with no wheel, a
JavaScript extension that needs npm packages Browser does not ship, or an
existing Node toolchain you would rather Browser used.

The two are not exclusive and not a one-way door. They differ only in where the
Node.js comes from — the keywords, the arguments and the behaviour are the same
either way — so switching later costs an uninstall and a reinstall, not a
rewrite.

## Without Node.js

### Install

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install "robotframework-browser[bb]"
        output:
          - Successfully installed robotframework-browser-%%browser%%
            robotframework-browser-batteries-%%browser%%
  - shell: powershell
    steps:
      - command: py -m pip install "robotframework-browser[bb]"
        output:
          - Successfully installed robotframework-browser-%%browser%%
            robotframework-browser-batteries-%%browser%%
---
::

The `[bb]` extra pulls in
[robotframework-browser-batteries](https://pypi.org/project/robotframework-browser-batteries/),
a platform-specific wheel carrying an unmodified official Node.js build, the
gRPC wrapper and its production Node dependencies. It is not a single packed
binary: it is a real `node` and a real `node_modules`, installed into
`site-packages/BrowserBatteries/bin/`.

Which Node.js that is moves with the library, so it is a fact about a release
rather than about the package. The [release notes](/releases) say which Node.js
the BrowserBatteries wheel was built with — check there for the release you are
installing.

The quotes are for zsh, which is the default shell on macOS and treats bare
square brackets as a glob. `bash` and PowerShell do not need them and do not
mind them.

::doc-note{kind="aside"}
Installing `robotframework-browser-batteries` by name gets you the same two
packages — it depends on the matching `robotframework-browser` — so an existing
requirements file spelling it that way is not wrong. `robotframework-browser[bb]`
is written from the side you are more likely to remember: the library, with
batteries.
::

The two packages are **tied to one version** and having them differ is not
supported. That is what the extra buys beyond a shorter line: pip resolves both
from a single constraint, so they cannot drift apart.

### Where there is a wheel

A wheel is published for each of these, and tagged so that pip declines to
install it where the bundled Node.js could not start:

::doc-table
---
head:
  - Platform
  - Architecture
  - Needs at least
nowrap:
  - 0
  - 1
rows:
  - - Linux
    - x64
    - glibc 2.28 — Debian 10, RHEL 8, Ubuntu 20.04
  - - Linux
    - arm64
    - glibc 2.28 — Debian 10, RHEL 8, Ubuntu 20.04
  - - Windows
    - x64
    - Windows 10 or Windows Server 2016
  - - macOS
    - x64
    - macOS 13.5
  - - macOS
    - arm64
    - macOS 13.5
---
::

There is no musl wheel, and none for Windows on arm. Anywhere else, pip reports
that it found no matching distribution — which is the wheel tags doing their
job, and the signal to use the other route.

::doc-note{kind="warning"}
macOS **13.0 to 13.4** is the one case the tags cannot catch. Node.js needs
13.5, but pip only ever generates `macosx_13_0_*` tags, so the wheel installs
and then the bundled Node.js fails to start. On those four versions, either
update macOS or install Node.js yourself.
::

### Browser binaries

Playwright's browser builds are downloaded separately, because they are not in
the wheel:

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser install
        output:
          - Installing Playwright browser binaries…
        status:
          - ok: true
            text: chromium   downloaded
          - ok: true
            text: firefox    downloaded
          - ok: true
            text: webkit     downloaded
  - shell: powershell
    steps:
      - command: py -m Browser.entry install
        output:
          - Installing Playwright browser binaries…
        status:
          - ok: true
            text: chromium   downloaded
          - ok: true
            text: firefox    downloaded
          - ok: true
            text: webkit     downloaded
---
::

Three engines, a few hundred megabytes, once per environment. Name one to get
only that one — `rfbrowser install firefox`.

::doc-note{kind="warning"}
**`rfbrowser init`** **is not for this route.** It runs `npm ci` and stops with
*Couldn't execute npm. Please ensure you have node.js and npm installed and in
PATH* — which reads like a broken installation and is not one. On this route the
command is `rfbrowser install`.
::

You can also skip this step entirely. If you already have a Chromium-based
browser — Chrome or Edge — you can drive that instead by passing a `channel` to
`New Browser`, and download nothing:

```robot-repl
New Browser    chromium    channel=chrome
```

That combination — wheels only, no binary download — is what makes this route
work on a machine with no route to the public internet at all.

### Verify

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser --version
        output:
          - 'Installed Browser library version is: "%%browser%%"'
          - 'Installed Robot Framework version: "7.4.1"'
          - 'Required Playwright is: "%%playwrightBundled%%"'
---
::

It reports the Playwright as *Required* rather than *Installed* here, because
reading the installed version means asking `npm`, and there is no `npm` on this
route. The number is the one that ships in the wheel either way.

Note what it does **not** report: the browser binaries. `rfbrowser --version`
staying green says nothing about whether `rfbrowser install` ever ran.

### Upgrading

Upgrade both packages together, then rebuild the Node side:

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install -U robotframework-browser robotframework-browser-batteries
      - command: rfbrowser clean-node
        output:
          - Delete library node dependencies from
            …/BrowserBatteries/bin/wrapper/node_modules
      - command: rfbrowser install
---
::

`clean-node` removes the old Node dependencies and browser binaries. Skipping it
leaves the previous release's binaries behind, and a Playwright that has moved on
does not necessarily drive them.

### Uninstalling

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser clean-node
      - command: pip uninstall robotframework-browser robotframework-browser-batteries
---
::

`clean-node` first, and in that order: it is what deletes the browser binaries,
and once pip has removed the package there is nothing left that knows where they
were.

## With Node.js

### Install

Install [Node.js](https://nodejs.org/en/download/) first — at the time of
writing that is **22, 24 or 26**, and each release states the lines it supports
in its [release notes](/releases). Make sure `npm` is on your `PATH`. Then:

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install robotframework-browser
        output:
          - Successfully installed robotframework-browser-%%browser%%
  - shell: powershell
    steps:
      - command: py -m pip install robotframework-browser
        output:
          - Successfully installed robotframework-browser-%%browser%%
---
::

### Node dependencies and browser binaries

One command does both, and the library does not work until it has run:

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser init
        output:
          - Installing node dependencies...
          - Installing browser binaries to 0
          - rfbrowser init completed
  - shell: powershell
    steps:
      - command: py -m Browser.entry init
        output:
          - Installing node dependencies...
          - Installing browser binaries to 0
          - rfbrowser init completed
---
::

`init` runs `npm ci --omit=dev` against the lockfile shipped in the package, then
downloads the browsers. Name engines to narrow the download —
`rfbrowser init chromium firefox` — or pass `--skip-browsers` to install the Node
dependencies alone and take responsibility for the binaries yourself.

::doc-note{kind="warning"}
**`rfbrowser install`** **is not for this route.** It exists for installations that
have BrowserBatteries, and running it here does not install the Node
dependencies `init` is responsible for. On this route the command is
`rfbrowser init`.
::

Do not add npm packages to `Browser/wrapper` by hand either. `init` runs `npm ci`
there, which deletes `node_modules` and reinstalls exactly the shipped
production dependencies, so anything you put there disappears at the next init
or upgrade. Extensions that need their own packages are covered in
[JavaScript extensions](/docs/extending/javascript-extensions).

::doc-note
**On Node.js 26 with npm 12**, `init` needs two extra steps. npm 12 no longer
runs post-install scripts unless they are approved, and several of Browser's
dependencies use them. Run `rfbrowser init` once, then
`npm approve-scripts --allow-scripts-pending` to list what is waiting, then
`npm approve-scripts <package> <package>` for the ones belonging to Browser —
review the list, because it covers every npm project on the machine, not only
this one — and run `rfbrowser init` again.

This is a moving target and it is npm's, not ours. It does not arise without
Node.js, where the dependencies are already built into the wheel.
::

### Verify

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser --version
        output:
          - 'Installed Browser library version is: "%%browser%%"'
          - 'Installed Robot Framework version: "7.4.1"'
          - 'Installed Playwright is: "%%playwrightBundled%%"'
---
::

*Installed* rather than *Required* means the number came from `npm list` in the
wrapper directory — so a line reading *Installed* is also evidence that `init`
got as far as writing `node_modules`. It still says nothing about the browser
binaries.

### Upgrading

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: pip install -U robotframework-browser
      - command: rfbrowser clean-node
        output:
          - Delete library node dependencies from …/Browser/wrapper/node_modules
      - command: rfbrowser init
---
::

`clean-node` between the two is not optional housekeeping. `npm ci` reinstalls
from the new lockfile, but the browser binaries from the previous release are
outside its reach and stay until something deletes them.

### Uninstalling

::terminal-block
---
sessions:
  - shell: bash
    steps:
      - command: rfbrowser clean-node
      - command: pip uninstall robotframework-browser
---
::

## Behind a proxy, or offline

Both routes reach the network, but for different things, and that is the whole
of what changes here.

Without Node.js there is one download — the browser binaries — and it can be
avoided altogether by driving an installed Chrome or Edge through `channel`.
Wheels themselves can travel by hand: `pip download robotframework-browser-batteries`
on a connected machine gets you the pair, and they install from a directory on
the target with no index at all.

With Node.js there are two: npm resolving the wrapper's dependencies, and
Playwright fetching the binaries. Both have to work, and an internal npm
registry usually has to be configured before the first `init`.

The browser download itself is Playwright's, and so are the variables that steer
it through a proxy, a custom certificate authority or an internal mirror. They
reach Playwright unchanged from either route, and
[Playwright documents them](https://playwright.dev/docs/browsers#install-behind-a-firewall-or-a-proxy) —
we deliberately do not copy the list, because a copy is wrong the day it changes.

## Never install into the system Python

::doc-note
Use a virtual environment — `uv`, `venv` or `pyenv`, whichever your team already
uses. Installing into the system Python needs root, writes browser binaries into
a directory you do not own, and is painful to unpick. You will also need to test
against a second Python version sooner than you expect.
::

For Node.js on the second route, use a version manager for the same reason: `n`
or `nvm` on Linux and macOS, `nvm-windows` or `nodist` on Windows.

Where the files actually land, and what the two halves do at run time, is
[how Browser works](/docs/concepts/architecture).
