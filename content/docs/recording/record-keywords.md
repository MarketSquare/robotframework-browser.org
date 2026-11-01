---
title: Recording keywords
description: Click through the page and get a reusable user keyword, written into your suite while you work. Record Keyword and Record Keywords in five minutes.
order: 1
section: recording
---

:since{version="21.0.0"} You click through the page; Browser writes what you did as a
**user keyword** into your suite file — live, while you click, ready to call from any
test.

::doc-video{alt="A browser shows robotframework-browser.org. The recorder toolbar sits in the bottom right corner. The pointer opens Keywords, types Get Text into the search field and opens the Get Text keyword; with every click a new Keyword Call appears in the toolbar. Finally the toolbar's close button ends the recording." poster="/videos/recorder/quick-start.jpg" src="/videos/recorder/quick-start.mp4"}
`Record Keyword` with the name `Find The Get Text Keyword` — three clicks and a search become four
Keyword Calls.
::

## Keywords, not tests

A recorder that writes whole test cases produces long, brittle scripts nobody
wants to maintain. Browser records **one keyword at a time**, from wherever your
test happens to be: after the login, on the right page, with the right data.
You decide what the test does and which keywords it needs; the recorder fills in
the steps of one of them.

That changes how you use it:

- **You name the keyword while you record**, so it reads like your test design —
`Add Product To Cart`, not `Test 17`.
- **It starts where your test stands.** The setup is code you already have; the
recording begins after it.
- **Wrong steps are undone in place.** Click the wrong thing, press *Undo*, carry on.
- **Values become arguments** with a click, so the keyword is reusable from the
first run — see [Keyword arguments](/docs/recording/arguments).

## Your first recording

The recorder needs a browser you can see. Put `Record Keyword` where the keyword
should start:

```robot [first-recording.robot]
*** Settings ***
Library    Browser

*** Test Cases ***
Look Up A Keyword
    New Browser    chromium    headless=False
    New Page       https://robotframework-browser.org
    Record Keyword    Find The Get Text Keyword
```

Run it. The page opens with the **recorder toolbar**, already recording. Now do in
the page what the keyword should do. Each action shows up in the toolbar as a
Keyword Call the moment you make it:

::doc-table
---
head:
  - '#'
  - You do in the page
  - Recorded as
nowrap:
  - 0
rows:
  - - '1'
    - Click *Keywords* in the header
    - '`Click` on the *Keywords* link'
  - - '2'
    - Click the search field
    - '`Click` on the search field'
  - - '3'
    - Type `Get Text`
    - '`Fill Text` with `Get Text`'
  - - '4'
    - Click *Get Text* in the keyword list
    - '`Click` on that entry'
---
::

Then click **✕** in the toolbar's header to end the recording. The test continues
with its next line, and `first-recording.robot` now ends with the four Keyword
Calls:

```robot
*** Keywords ***
Find The Get Text Keyword
    [Tags]    recorded
    Click    role=link[name="Keywords"s]
    Click    role=searchbox[name*="Filter keywords"i]
    Fill Text    role=searchbox[name*="Filter keywords"i]    Get Text
    Click    role=link[name*="Get Text 5"i]
```

The same happens on any page. A login on [car.keyword-driven.de](http://car.keyword-driven.de),
recorded live — every click and every field becomes a Keyword Call the moment it happens:

::doc-video
---
alt: A login form. The pointer types demo as user name and secret as password and clicks login; the recorder toolbar next to the form lists Click, Fill Text, Click, Fill Text and Click as they happen.
poster: /videos/recorder/loop-login.jpg
src: /videos/recorder/loop-login.mp4
controls: false
---
Five Keyword Calls in eight seconds: the toolbar shows each one as it is written.
::

::doc-note
Every recorded keyword is tagged `recorded`. It marks the keywords nobody has
reviewed yet — read them before you commit, as described in
[Good practice and limits](/docs/recording/practice).
::

## One keyword or a session

::doc-table
---
head:
  - Keyword
  - Records
  - Ends with
nowrap:
  - 0
rows:
  - - '`Record Keyword` with a name'
    - Exactly one keyword, named in the call. The toolbar records from the first moment.
    - ✕ in the toolbar
  - - '`Record Keywords`'
    - Any number of keywords. Each is named and started in the toolbar, then saved; in between nothing is recorded, so you can move to the next starting point.
    - ✕ in the toolbar
---
::

`Record Keyword` fits a test that is missing one step. `Record Keywords` fits
building a keyword library: walk through the application once and save a
keyword at every stop. Both block until the recording ends, return the recorded
text, and write into the suite file unless you say otherwise — see
[Where recorded keywords go](/docs/recording/files).

```robot-repl
${text} =    Record Keyword    Login As Admin
Record Keyword     Search Product    ${CURDIR}/shop.resource
Record Keywords    ${CURDIR}/shop.resource
```

## In this chapter

::card-grid
  :::card{title="The toolbar" to="/docs/recording/toolbar"}
  Starting, saving, undoing and ending; naming rules; moving the toolbar out of the way.
  :::

  :::card{title="Arguments" to="/docs/recording/arguments"}
  Turn a typed value, a URL or part of a selector into an argument, with or without default.
  :::

  :::card{title="What gets recorded" to="/docs/recording/what-gets-recorded"}
  Which Browser keyword each action becomes, popups, dialogs, downloads, uploads and assertions.
  :::

  :::card{title="Target files" to="/docs/recording/files"}
  The suite file, a resource file, or only the log — and what the recorder never touches.
  :::

  :::card{title="Practice and limits" to="/docs/recording/practice"}
  How to get keywords worth keeping, what the recorder cannot do, and what to do when it goes wrong.
  :::
::
