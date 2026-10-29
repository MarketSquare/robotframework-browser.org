---
title: Good practice and limits
description: How to record keywords worth keeping, what to check before you commit one, what the recorder cannot do, and what to do when it goes wrong.
section: recording
order: 6
---

The recorder gives you a first draft in seconds. Whether it becomes a keyword
your team keeps depends on a few habits.

## Record small keywords

One keyword per step of your test design — `Log In`, `Search Product`,
`Add Product To Cart` — not one keyword for the whole story. Small keywords are
easy to name, easy to review and reusable in other tests. `Record Keywords` makes
this cheap: *Save*, move on, *Record keyword*.

**Start from a known state.** Let the test do the setup — open the page, log in,
load the data — and record from there. A keyword recorded from the middle of a
half-finished manual session depends on whatever you did before.

**Check at the end.** Finish a keyword with an assertion from Playwright's
toolbar, so it proves it worked — see
[Assertions](/docs/recording/what-gets-recorded#assertions).

## Before you commit a recorded keyword

Every recorded keyword carries the tag `recorded`. Treat it as "not reviewed
yet", and remove the tag once you have checked:

- **Values from the page.** Everything typed is recorded as typed — passwords
  included. Make secrets [arguments](/docs/recording/arguments) without a
  default, and pass them in as Robot Framework Secrets — see [below](#secrets).
- **Selectors that will not last.** A name with a counter, a date or a generated
  id in it breaks on the next run. Shorten it, make the changing part an
  argument, or ask for a test id in the application.
- **Placeholders.** An upload path starts with `<define_path_to_file>` until you
  fill it in.
- **Notices.** A selector in Playwright-internal syntax, an action with no Browser
  keyword — the toolbar told you while recording; the file shows the result.
- **The name.** It should say what the keyword does for the test.

Run the keyword once on its own before you rely on it.

## Secrets

Robot Framework 7.4 and newer have a `Secret` type: a value that never shows
up in the log, created from the environment or a variable file. A recorded
`Fill Text` does not accept one, so change the password line to `Fill Secret`
and declare the argument as a Secret:

```robot
*** Keywords ***
Log In As
    [Arguments]    ${username}    ${password: Secret}
    Fill Text      role=textbox[name*="username"i]    ${username}
    Fill Secret    role=textbox[name*="password"i]    ${password}
```

```robot
*** Test Cases ***
Log In
    VAR    ${password: Secret}    %{APP_PASSWORD}
    Log In As    demo    ${password}
```

## Limits

- **A visible browser.** The recorder refuses a headless browser — nobody could
  use the toolbar there. A browser attached with `Connect To Browser` counts as
  visible.
- **One browser context.** Only the context that was active when the recording
  started is recorded.
- **Not everything is an action.** Hovering is not reported by Playwright and is
  not recorded; add `Hover` by hand where a menu needs it.
- **Playwright's toolbar stays.** It sits at the top centre of the page during
  the session and cannot be hidden.
- **Native modal dialogs** (`showModal()`) make the toolbar inert until they are
  closed. Other modals — the usual `div` with a backdrop — do not.
- **The page can see the toolbar.** Scripts on the pages of the context can read
  what is recorded and send toolbar commands. Record against applications you
  trust, and review the result.
- **Playwright's private recorder API.** Recording uses an interface Playwright
  does not publish, so a Playwright upgrade can affect it; Browser's tests check
  it with every upgrade.

## When something goes wrong

::doc-table
---
head: [You see, Because, Do]
rows:
  - ['`Recording needs a visible browser, but the active browser runs headless.`', 'The browser was opened headless, the default.', 'Open it with `New Browser` and `headless=False` before the page.']
  - ['No toolbar appears', 'The page belongs to another browser context than the active one.', '`Switch Context` to the context you want to record, then start again.']
  - ['Clicks are not recorded', '*Pick locator* is on in Playwright''s toolbar — the recorder shows a banner.', 'Switch *Pick locator* off.']
  - ['A navigation has no `Go To`', 'It followed a click, fill or key press within five seconds; it belongs to that action.', 'Nothing — the recorded click navigates when the keyword runs.']
  - ['The name is rejected', 'It exists in the file, was recorded in this session, shadows a keyword the suite can call, or is not a valid name.', 'Choose another name; the dialog says which rule it broke.']
  - ['The recording ended by itself', 'Nothing happened for `idle_timeout`.', 'Raise `idle_timeout`; what was recorded is saved.']
  - ['`Cannot record into <file>`', 'The folder does not exist, or the file is read-only — checked before recording starts.', 'Fix the path or the permission.']
  - ['`Could not write <file>`', 'The file became read-only or locked during the session, or is not valid UTF-8.', 'Fix the file; the next action writes again. If it is still not writable at the end, the keyword fails and the recorded text is in the log.']
  - ['A selector with `internal:` in it', 'The element has no role and is found by its `aria-label`; there is no public selector for that.', 'It works as recorded. Prefer a test id if you can add one.']
---
::
