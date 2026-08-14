---
title: Emulating a device
description: Device descriptors, what the six or seven properties they set actually change, and the one that emulation cannot give you.
order: 2
section: mobile
---

A viewport gets you the layout. A **device descriptor** gets you the rest: the
user agent the page sees, whether it thinks it has a touch screen, and how sharp
the screen is.

Playwright ships descriptors for the common handsets and tablets, plus a few
desktop profiles, and Browser
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
Log Dictionary    ${devices}    # needs Library Collections
```

The list is Playwright's, so it grows when Playwright updates. Names are exact
and case-sensitive: `iPhone 13`, `iPhone 13 Pro Max`, `Pixel 7`, `Galaxy S9+`,
`iPad Mini`, and the `landscape` variants such as `iPhone 13 landscape`.

::doc-note
Pin the descriptor name in a variable rather than scattering it through a suite.
Pin the name in a variable rather than scattering it through a suite — the list
is Playwright's, and an upgrade is the one thing that can move it under you. One
variable is a
one-line fix.
::

## What a descriptor actually sets

Six or seven properties — most phone and tablet descriptors also carry
`screen`, what `window.screen` reports. On a portrait descriptor it is taller
than the viewport, which excludes browser chrome; a landscape descriptor keeps
the *portrait* screen, so `iPhone 13 landscape` is a 750×342 viewport on a
390×844 screen. It is worth knowing them individually, because each one changes
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
    - Device pixel ratio — 2 to 4.5 depending on the handset, 3 on an iPhone 13
      and 2.625 on a Pixel 7, down to 1 on older hardware. Decides which image a
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

**A descriptor changes the engine only when nothing is open yet.** Every
descriptor carries `defaultBrowserType`, and `New Context` honours it if there
is no browser running — so `Get Device` for `iPhone 13` followed by `New Context`
does launch WebKit. Applied to an *already running* Chromium it changes nothing
but the emulation: a Chromium reporting an iPhone user agent at an iPhone
viewport. It is not Safari either way.

If iOS is the thing you care about, be explicit about the engine:

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
Playwright's API documentation still lists `isMobile` as unsupported in Firefox,
but the version Browser bundles applies it: Firefox honours the meta viewport
exactly as Chromium does, and raises no error. Treat that note as stale rather
than as a reason to skip Firefox — but check it against the Playwright you
ship, since this is undocumented behaviour.
::

## Orientation

There is no rotate keyword. Landscape is a viewport whose width exceeds its
height, so either use the landscape descriptor:

```robot
${device} =    Get Device    iPhone 13 landscape
```

or set the size yourself:

```robot
Set Viewport Size    750    342
```

Read those numbers off the descriptor rather than transposing the portrait ones
— `iPhone 13` is 390×664 and its landscape descriptor is 750×342, not a swap.
And the two routes are not equivalent: the descriptor also carries `screen`, the
user agent and `isMobile`, while `Set Viewport Size` leaves those alone and
*overwrites* `window.screen` with the new size, so the screen/viewport
distinction disappears.
If your app listens for `orientationchange`, the resize is what fires it.

## A worked example

Putting the chapter together — one device, one context, a real check:

```robot [mobile.robot]
*** Settings ***
Library     Browser

*** Variables ***
${PHONE}        iPhone 13
${URL}          https://www.imbus.de/en/academy/rfcp-robot-framework-certified-professional

*** Test Cases ***
The Certification Page On A Phone
    ${device} =    Get Device    ${PHONE}
    New Browser    webkit    headless=True
    New Context    &{device}
    New Page    ${URL}

    # A real cookie banner, in the way of everything until it is dealt with.
    Tap                        text="allow all cookies"
    Wait For Elements State    button.cc-allow-all    hidden

    Get Text    h1    *=    Certified Professional

    # …and the page never scrolls sideways.
    ${overflow} =    Evaluate JavaScript    ${None}
    ...    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    Should Not Be True    ${overflow}
```

Two details in there are worth more than the example itself.

`hidden`, not `detached`: that banner is still in the document after you accept
it, sized to nothing. Reaching for `detached` — the obvious guess — waits out
the full timeout and fails.

And it is a page you can actually run this against, which is the point. An
example that only works against an app you do not have teaches the syntax and
hides every problem the syntax exists for.

`Tap` rather than `Click` is deliberate, and it only works because the
descriptor set `hasTouch`. That is the subject of
[the next page](/docs/mobile/touch).
