---
title: Emulating a device
description: Device descriptors, what the six properties they set actually change, and the one that emulation cannot give you.
order: 2
section: mobile
---

A viewport gets you the layout. A **device descriptor** gets you the rest: the
user agent the page sees, whether it thinks it has a touch screen, and how sharp
the screen is.

Playwright ships descriptors for the common handsets and tablets, and Browser
exposes them as keywords.

## Using one

```robot
*** Test Cases ***
The Product Page On A Phone
    ${device} =    Get Device    iPhone 13
    New Context    &{device}
    New Page    ${URL}
    Get Viewport Size    width    ==    ${390}
```

`Get Device` returns a dictionary, and `&{device}` expands it into `New Context`
as named arguments. That is the whole idiom — nothing to unpack by hand.

To find out what is available:

```robot
${devices} =    Get Devices
Log Dictionary    ${devices}
```

The list is Playwright's, so it grows when Playwright updates. Names are exact
and case-sensitive: `iPhone 13`, `iPhone 13 Pro Max`, `Pixel 7`, `Galaxy S9+`,
`iPad Mini`, and the `landscape` variants such as `iPhone 13 landscape`.

::doc-note
Pin the descriptor name in a variable rather than scattering it through a suite.
Device names do get retired between Playwright versions, and one variable is a
one-line fix.
::

## What a descriptor actually sets

Six properties. It is worth knowing them individually, because each one changes
something different, and you can set any of them yourself without a descriptor.

::doc-table
---
head:
  - Property
  - What it changes
rows:
  - - "`viewport`"
    - The layout size. This is what your CSS media queries react to.
  - - "`userAgent`"
    - The string the page reads. Anything doing server-side or JavaScript device
      sniffing branches on this.
  - - "`deviceScaleFactor`"
    - Device pixel ratio — 3 on a modern phone. Decides which image a
      `srcset` picks, and the resolution of your screenshots.
  - - "`isMobile`"
    - Sets the meta viewport behaviour, so the page is laid out the way a phone
      lays it out rather than a shrunken desktop. **Not supported in Firefox.**
  - - "`hasTouch`"
    - "Makes touch events available. Required before `Tap` will work, and it is
      what `@media (pointer: coarse)` and `'ontouchstart' in window` detect."
  - - "`defaultBrowserType`"
    - Which engine Playwright would launch for this device — `webkit` for
      Apple hardware, `chromium` for Android. See the caveat below.
---
::

Setting them directly is perfectly reasonable when you want one property rather
than a whole handset:

```robot
# A touch device, without pretending to be any particular phone.
New Context    viewport={'width': 400, 'height': 900}    hasTouch=True    isMobile=True
```

## The caveat that matters

**A descriptor does not change the browser engine.** `Get Device    iPhone 13`
applied to a running Chromium gives you a Chromium that reports an iPhone user
agent at an iPhone viewport. It is not Safari, and it is not WebKit.

If iOS is the thing you care about, launch WebKit and then apply the descriptor:

```robot
*** Test Cases ***
The Checkout On Something Close To An iPhone
    ${device} =    Get Device    iPhone 13
    New Browser    webkit    headless=True
    New Context    &{device}
    New Page    ${URL}
```

That is as close as automation gets: the same engine family Safari is built on,
at the right size, with touch enabled. It is genuinely useful — WebKit catches
CSS and JavaScript differences that Chromium never will — and it is still not
Safari on an actual iPhone. Keep that last mile for
[real humans on real devices](/docs/mobile/responsive).

::doc-note{kind="warning"}
`isMobile` is a Chromium and WebKit feature. Passing a descriptor that sets it
to a Firefox context raises an error, so a suite that loops "every device × every
engine" will fail on that combination. Choose the engine per device rather than
multiplying them.
::

## Orientation

There is no rotate keyword. Landscape is a viewport whose width exceeds its
height, so either use the landscape descriptor:

```robot
${device} =    Get Device    iPhone 13 landscape
```

or swap the numbers yourself:

```robot
Set Viewport Size    844    390
```

Both are the same thing to the page. If your app listens for
`orientationchange`, the resize is what fires it.

## A worked example

Putting the chapter together — one device, one context, a real check:

```robot [mobile.robot]
*** Settings ***
Library     Browser

*** Variables ***
${PHONE}        iPhone 13
${URL}          https://example.com/products

*** Test Cases ***
Filters Are Behind A Sheet On A Phone
    ${device} =    Get Device    ${PHONE}
    New Browser    webkit    headless=True
    New Context    &{device}
    New Page    ${URL}

    # On a phone the filter panel starts collapsed…
    Get Element States    id=filters    contains    hidden
    Tap    id=filter-toggle
    Get Element States    id=filters    contains    visible

    # …and the page never scrolls sideways.
    ${overflow} =    Evaluate JavaScript    ${None}
    ...    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    Should Not Be True    ${overflow}
```

`Tap` rather than `Click` is deliberate, and it only works because the
descriptor set `hasTouch`. That is the subject of
[the next page](/docs/mobile/touch).
