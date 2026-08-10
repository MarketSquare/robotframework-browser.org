---
title: The Node process
description: Browser starts a Node process to talk to Playwright. What that costs, how to share one across parallel runs, and how to pass it Node flags.
order: 1
section: operations
---

Browser is two halves. The Python half is the Robot Framework library you import;
the Node half drives Playwright. They talk over gRPC on a local port, and the
Python half starts the Node half for you the first time you call a Browser
keyword.

Most of the time you never think about this. It matters in two situations: when
you run many suites in parallel, and when you need to debug the Node side itself.

::doc-note
If none of that applies to you, you can skip this page. The default — one Node
process per Robot Framework run, started and stopped automatically — is the right
setting for a normal suite.
::

## What the startup costs

Starting the Node process is the slowest single step in a run: a process
launch plus a gRPC health handshake, once per Robot Framework execution. It is
paid at the first Browser keyword rather than at import — the library starts the
process lazily — and on a single suite it disappears into the noise.

Under [Pabot](https://github.com/mkorpela/pabot) it stops being noise. Pabot runs
each suite in its own Robot Framework process, so **each one starts its own Node
process**. Twelve parallel suites means twelve Node processes, twelve startups,
and twelve copies of the Playwright runtime resident at once.

## Sharing one Node process

::doc-note{kind="warning"}
This is an experimental feature. It works, but it is not covered by the same
compatibility promise as the keywords, and the trade-offs below are real.
::

You can start the Node side yourself, once, and point every run at it. Start it
from the directory where the Browser package is installed:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 node Browser/wrapper/index.js 127.0.0.1 12345
```

The two arguments are the host and the port, in that order — both are
required, and with only one the script exits with `No port defined`. Then tell
the runs where to find it:

```bash
ROBOT_FRAMEWORK_BROWSER_NODE_PORT=12345 pabot --processes 12 tests/
```

The same thing can be said at import time instead, which is better when only some
suites should share and the rest should stay independent:

```robot
*** Settings ***
Library    Browser    playwright_process_port=12345
```

There is a matching `playwright_process_host`, which defaults to `127.0.0.1`.
On its own it only changes the address the spawned process binds to; combined
with a port it is the address the library connects to. If both port settings are
set the **import parameter wins**: the
port from `playwright_process_port` is checked first and the variable is only a
fallback. There is no environment variable for the host — that is
`playwright_process_host` only.

The environment variable is the blunt instrument — it
applies to everything in that shell — and the import parameter is the precise one.

### What you give up

Sharing genuinely removes that startup from every run but the first. It also means:

- **One failure domain.** If the shared process dies, every run pointed at it
  fails, not just the one that killed it.
- **Teardown is per connection, not global.** A finishing run closes the
  browsers *it* opened. The Node side keeps separate state per client
  connection, so other runs on the same process are untouched — runs only share
  state if they deliberately call `Set Peer Id` with the same value.
- **You own its lifecycle.** Nothing starts it for you and nothing cleans it up.
  In CI that means a start step, a wait, and a teardown that runs even when the
  suite fails.
- **Debugging gets harder.** Logs from twelve suites interleave in one process.

Measure before you adopt it. If your suite takes four minutes and startup takes
two seconds, this is not your bottleneck — and a shared process is a new thing
that can break in exchange for nothing.

## Passing Node flags

::doc-note{kind="warning"}
Also experimental, and a development tool rather than a production one.
::

`ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS` is passed through to the Node process
as command-line arguments. Multiple arguments are separated by commas — not
spaces, which is the mistake to expect:

```bash
ROBOT_FRAMEWORK_BROWSER_NODE_DEBUG_OPTIONS=--inspect,--trace-warnings robot tests/
```

`--inspect` opens the Node inspector, so you can attach Chrome DevTools or an IDE
debugger to the Playwright side. That is occasionally the only way to understand
a failure that looks impossible from the Robot Framework log.

Keep it out of production runs. An open inspector port is a debugging affordance,
not something you want on a CI runner.

## Where to look next

- The full list of variables that affect the Node process is on
  [Environment variables](/docs/operations/environment-variables).
- How the two halves fit together, and why the library is built this way, is on
  [How Browser works](/docs/concepts/architecture).
