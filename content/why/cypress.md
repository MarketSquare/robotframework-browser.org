---
title: Browser vs Cypress
tool: Cypress
slug: vs-cypress
order: 1
tagline: A JavaScript end-to-end runner that lives inside the browser it tests.
comparedAgainst: Cypress 15, Browser 20.2.0
---

Cypress made end-to-end testing pleasant when it was not, and a lot of people
learned that tests can be fast and debuggable because Cypress showed them. Credit
where it is due.

The argument below is not that Cypress is bad. It is that Cypress bought its
developer experience by moving the test *into* the browser, and most of what is
awkward about it follows from that one decision.

## 1. We are built on Playwright, so there is nothing to work around

Cypress runs your test code inside the browser, in the same event loop as the
application under test. That is where the live-reloading runner comes from. It
is also where the constraints come from, and you tend to meet those later.

Browser drives the browser from outside, over Playwright. There is no
same-origin boundary to work around, no `cy.origin()` wrapper for visiting a
second domain, no special case for a login flow that redirects through an
identity provider. Multiple tabs are multiple pages. Multiple browsers in one
test are multiple browsers.

::doc-table
---
head:
  - ""
  - Browser
  - Cypress
rows:
  - - Runs
    - Outside the browser, over Playwright
    - Inside the browser, in the app's event loop
  - - Engines
    - Chromium, Firefox and WebKit
    - Chromium family, Firefox, WebKit (experimental)
  - - Second origin in one test
    - Just navigate
    - "`cy.origin()`"
  - - Multiple tabs
    - "`New Page` again"
    - Not supported
  - - Two browsers at once
    - "`New Browser` twice"
    - Not supported
---
::

::doc-note
WebKit matters more than the row suggests. It is the engine behind Safari, and
therefore every browser on iOS.
::

## 2. Robot Framework tests everything, not only the web

This is the one that decides most real projects, and it has nothing to do with
browsers.

Your system is not a web page. It is a web page **and** a REST API, a database,
a message queue, an SFTP drop, a PDF, a mainframe screen, a Windows desktop
client, a mobile app, a piece of hardware on a serial port. A test that logs in
through the UI and verifies the result in the database is an ordinary
requirement, not an exotic one.

Robot Framework has libraries for all of that, and they compose in the same
test, in the same syntax, in the same report. If a library does not exist for
your particular thing, you write one — a Python class, published on PyPI, done.

Cypress tests web pages, which is what it is for. When your test needs to check
the database, you write a task in Node and call it through `cy.task` — at which
point you are maintaining a small integration framework of your own, and it
reports nothing to the log.

## 3. Keyword-driven, logged, parallel, and open source in the whole

Four things, all of which follow from Robot Framework being a test automation
framework rather than a web-test runner.

**Compound keywords are real abstractions.** You write `Given the user has an
overdrawn account`, and it appears in the log **as a step**, with everything it
did nested underneath it, collapsible. A JavaScript helper function is a
function: it runs, and the log shows whatever the commands inside it happened to
print, flat. This is the difference between a report a business analyst can read
and a report only its author can.

**Parallelism.** [Pabot](https://github.com/mkorpela/pabot) splits a suite across
processes, on your laptop or on one CI runner, and merges the results. It is
free and it is local. Cypress parallelisation is a feature of Cypress Cloud —
a paid, hosted service. You can hand-roll it with your own CI matrix, and many
teams do, but the batteries are not included.

**Open source through and through.** Robot Framework, Browser library, Pabot and
the report at the end are all Apache 2.0, and there is no tier above them.
Cypress the runner is MIT; the dashboard, the parallelisation and the flake
analytics are the product. That is a legitimate business model. It is worth
knowing which parts of your workflow you own and which you rent.

**Made for end-to-end testing.** Robot Framework has run acceptance tests since
2008, for people who mean *acceptance* in the contractual sense: suite setups
and teardowns, tags, per-environment variables, listeners, a machine-readable
`output.xml`, and libraries for every other system the same test touches.

## 4. The test reads like the thing it tests

Look at both files. Not at the line count — at what you have to know to read
them.

::comparison{left="comparison/cypress/test.robot" right="comparison/cypress/test.cy.js"}
---
notes:
  - Both wait automatically; neither needs an explicit sleep.
  - Browser puts the assertion inside the keyword — Get Text reads and checks in one line.
  - Cypress chains commands that are queued rather than executed where they appear, which is why `await` does not work as you expect in a Cypress test.
---
::

The Robot Framework file is readable by someone who has never used Robot
Framework. The JavaScript file is readable by someone who knows JavaScript,
knows that `cy` commands enqueue rather than execute, knows why you cannot
`await` them, and knows what `should('contain', ...)` does differently from
`should('have.text', ...)`.

That difference compounds. Tests are read far more often than they are written,
and usually by more people than wrote them.

## When Cypress is the right answer

Plainly: your team is front-end developers, the tests live beside the components
they cover, nobody outside the team reads the results, and the system under test
is a web application and nothing else. The Cypress runner is genuinely good to
develop against, and picking the tool your team already speaks is a real
argument.

Outside those conditions — more than one technology, more than one audience for
the report, testers who are not JavaScript developers — the constraints start to
cost you, and Robot Framework was built for the job you actually have.

::doc-note
Facts on this page are checked against Cypress 15 and Browser 20.2.0. If
something here has become wrong,
[tell us](https://github.com/MarketSquare/robotframework-browser/issues) —
a comparison page that quietly rots is worse than none.
::
