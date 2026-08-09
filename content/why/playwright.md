---
title: Browser vs Playwright Test
tool: Playwright Test
slug: vs-playwright
order: 2
tagline: Microsoft's browser automation framework, and its TypeScript test runner.
comparedAgainst: Playwright %%playwright%%, Browser %%browser%%
---

This is not really a competition, because **Browser library is built on
Playwright**. Every keyword here ends up as a Playwright call. When Playwright
gets faster, we get faster. When it gains an API, we can expose it.

So the honest comparison is not Browser against Playwright. It is Robot
Framework against **Playwright Test**, the TypeScript test runner — two
different answers to *how do you write and organise tests*, over the same
automation engine.

## What we do not have

First, because a comparison page that lists only its own strengths is marketing.

We have the Playwright **API**. We do not have Playwright **Test**. Concretely,
`expect()` and its web-first assertions do not map to Browser keywords 1:1.
Playwright's assertion library is large, specific and very well made; Browser's
getters cover the same ground for the things people actually assert, but they
are not a drop-in translation.

Nor do we have the Playwright Test runner's fixtures, projects, sharded
parallelism or HTML report. Robot Framework has its own answers to all of those
— but they are Robot Framework's answers, so porting a Playwright Test suite is
a rewrite rather than a translation.

::doc-note
If your test looks like `await expect(locator).toHaveText('x')` and that is
exactly how you want it to look, you are already using the right tool. This page
is for people choosing, not for people migrating away from something that works.
::

## What we offer instead

Four things, all of which come from Robot Framework rather than from us.

### 1. Readability

The same test, written both ways:

::comparison{left="comparison/playwright/test.robot" right="comparison/playwright/test.spec.ts"}
---
notes:
  - Same engine underneath, same auto-waiting, same role selectors.
  - The Robot Framework file has no async/await, no braces, no arrow functions and no fixture argument.
---
::

The right-hand file is good TypeScript. The point is that it *is* TypeScript: to
read it you need to know what `async` means, why every line needs `await`, what
destructuring `{ page }` does, and what a fixture is. The left-hand file needs
none of that.

### 2. Easier to learn

A tester who has never automated anything can write a useful Robot Framework
test on their first day. The syntax is a keyword, then its arguments, separated
by spaces.

Reaching the same point in Playwright Test means learning JavaScript's
asynchronous model first — not the syntax, the model. A missing `await` is a
test that passes while the application is broken, and it looks nothing like a
mistake.

### 3. Business logic, expressed as business language

Keyword-driven testing is the real feature here, and it is bigger than
readability.

You build vocabulary. `Log in as an approved supplier`, `Submit a claim over the
excess`, `The claim should be routed to manual review` — each a keyword,
composed of other keywords, all the way down to `Click`. The test reads as the
business process, and **the log reads the same way**: every compound keyword is
a collapsible step in the report, not a flattened list of clicks.

That is what makes a Robot Framework report something you can hand to a domain
expert. Not the styling — the structure.

### 4. Cross-technology testing

Robot Framework is a general-purpose automation framework that happens to be
very good at web. One suite, one report, one syntax across:

::doc-table
---
head:
  - Also in the same test
  - With
rows:
  - - REST and GraphQL APIs
    - RequestsLibrary, and others
  - - Databases
    - DatabaseLibrary
  - - Mobile apps
    - AppiumLibrary
  - - Desktop applications
    - FlaUI, SikuliX, RoboSAPiens for SAP
  - - Files, SFTP, SSH, archives
    - OperatingSystem, SSHLibrary, ArchiveLibrary
  - - Anything else
    - A Python class you write in an afternoon
---
::

Playwright Test tests web applications. You *can* call an API from a Playwright
test — the request fixture is good — but when one scenario spans a web UI, a
message queue and a mainframe, you are assembling a framework. Robot Framework
already is one.

## Our clear recommendation

We mean this, and we are not burying it in small type at the bottom:

::doc-note{kind="aside"}
**If you are looking for a great TypeScript web automation framework, and you do
not need to test other technologies, and you have people who read and write
TypeScript, and you have no requirement for business-readable test reports —
then our clear recommendation is Playwright Test.**

It is excellent. Use it.
::

Those four conditions are the whole decision. Break any one of them — a tester
who is not a developer, a system that is not only a web application, an auditor
who has to read the report — and Robot Framework starts earning its keep. Meet
all four, and Playwright Test is the better fit, and we would rather you were
productive than loyal.

## Thank you

Browser library exists because Playwright exists. The auto-waiting, the role
selectors, the trace viewer, three engines under one API — we did not build any
of that. We made it available to Robot Framework.

Best regards from our side to an awesome open-source project.
