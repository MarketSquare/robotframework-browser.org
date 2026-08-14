---
title: Touch, permissions and location
description: Tap and why it needs hasTouch, granting camera or notifications without a dialog, faking where the user is, and the gestures Browser has no keyword for.
order: 3
section: mobile
---

A phone is not only a small screen. It is a touch screen that knows where it is
and can be asked for the camera. All three are context options, and all three
are testable without a device.

## Tap

```robot
Tap    id=filter-toggle
```

`Tap` dispatches a real touch event through the browser's touchscreen, rather
than a mouse click. It runs the same actionability checks as `Click` — the
element must be visible, stable, receiving events and enabled — and scrolls it
into view first.

::doc-note{kind="warning"}
**`Tap` requires `hasTouch=True` on the context.** Without it, Playwright
refuses. This is the first thing that goes wrong for everybody, and the error is
clear once you know to look for it. A mobile device descriptor sets `hasTouch` for you — the `Desktop *` ones do not;
a bare `viewport=` does not.
::

```robot
# Works.
New Context    viewport={'width': 390, 'height': 844}    hasTouch=True
Tap    text=Menu

# Fails: no touch support on this context.
New Context    viewport={'width': 390, 'height': 844}
Tap    text=Menu
```

### Tap or Click?

Use `Tap` when the touch event itself is the thing under test — a handler bound
to `touchstart`, a control that behaves differently for touch, a tap target you
want to prove is reachable.

Use `Click` for everything else, including on a mobile-sized context. `Click`
works on a touch context and is what most of your suite should say, because most
of your suite is testing the application rather than the input method.

## Gestures beyond a tap

Being straight about a gap: **there is no swipe keyword, and no pinch or
multi-touch.** Playwright's touchscreen API is a single tap.

What you can do instead, in rough order of preference:

::doc-table
---
head:
  - You want
  - Use
rows:
  - - A carousel moved along
    - Its next/previous control. It has one, because it needs one for keyboard
      users too.
  - - Scrolling
    - "`Scroll To`, or `Mouse Wheel`. Neither needs touch."
  - - Drag-style reordering
    - "`Drag And Drop`, which uses mouse events"
  - - A swipe-like drag
    - "`Drag And Drop Relative To` — mouse-based, so it fires pointer events, not touch"
  - - A genuine touch swipe
    - "`Evaluate JavaScript`, dispatching TouchEvents yourself"
  - - Pinch to zoom
    - Nothing. This is a real-device test.
---
::

If a feature is *only* reachable by swiping, that is worth raising with the team
regardless of testing: it is unreachable by keyboard too, which is an
accessibility defect rather than a test-automation inconvenience.

## Permissions

Browsers ask the user before handing over the camera, the microphone or the
location. That dialog is browser chrome, not page content, so it is not
something a test can click. Grant it up front instead:

```robot
New Context    permissions=['geolocation', 'notifications']
```

or during the test, when the point is to check the before-and-after:

```robot
Grant Permissions    geolocation
Grant Permissions    camera    microphone    origin=https://example.com
Clear Permissions
```

Available permissions — though only **Chromium accepts all of them**. WebKit
accepts `geolocation`, `notifications`, `camera`, `microphone` and
`clipboard-read`; Firefox accepts `geolocation`, `notifications` and
`local-network-access`. Anything else fails — from `New Context` or
`Grant Permissions` on Chromium and Firefox, but on WebKit not until the next
`New Page`, which makes it look like a navigation problem.

::doc-table
---
head:
  - Group
  - Values
rows:
  - - Location
    - "`geolocation`"
  - - Media
    - "`camera`, `microphone`"
  - - Clipboard
    - "`clipboard-read`, `clipboard-write`"
  - - Notifications and payments
    - "`notifications`, `payment-handler`"
  - - Sensors
    - "`accelerometer`, `gyroscope`, `magnetometer`, `ambient-light-sensor`"
  - - Other
    - "`background-sync`, `midi`, `midi-sysex`,
      `local-network-access`"
---
::

`Clear Permissions` resets every grant on the context — useful for testing the
denied path, which is the one that actually breaks in production:

```robot
*** Test Cases ***
Store Finder Degrades Without Location
    New Context    viewport={'width': 390, 'height': 844}    hasTouch=True
    New Page    ${URL}
    Clear Permissions
    Tap    id=find-near-me
    Get Text    id=message    ==    Enter a postcode instead
```

::doc-note
Permissions belong to the context, not the page, so a new context starts with
nothing granted. That is usually what you want — it is what a first-time visitor
gets.
::

## Location

With `geolocation` granted, set the coordinates:

```robot
New Context
...    permissions=['geolocation']
...    geolocation={'latitude': 60.17, 'longitude': 24.94}

# or later, to simulate movement
Set Geolocation    60.17    24.94    accuracy=50
```

`accuracy` is in metres, and it is worth exercising: an app that draws a
confidence circle, or refuses to act on a vague fix, behaves differently at 5 m
and at 5000 m.

::doc-note{kind="warning"}
Setting a location without granting `geolocation` gets you a page whose location
request is denied — which looks exactly like a broken test. If your store finder
"cannot find you", check the permission before you check the coordinates.
::

## Locale, timezone and colour scheme

Context options too, and worth pairing with a device when you are testing what a
traveller sees, or what someone with dark mode enabled sees:

```robot
New Context
...    locale=de-DE
...    timezoneId=Europe/Berlin
...    colorScheme=dark
...    reducedMotion=reduce
```

`colorScheme` and `reducedMotion` drive `@media (prefers-color-scheme)` and
`@media (prefers-reduced-motion)`. Both are one line to test and are routinely
shipped broken, because the person who built the feature had the other setting.

## Putting it together

```robot [locate-me.robot]
*** Settings ***
Library     Browser


*** Variables ***
# Robot Framework ry, Kampinkuja 2, 00100 Helsinki.
${LAT}      ${60.16829}
${LON}      ${24.93051}


*** Test Cases ***
The Map Finds The Phone, In Helsinki
    ${device} =    Get Device    iPhone 13
    New Browser    webkit    headless=True
    New Context
    ...    &{device}
    ...    permissions=['geolocation']
    ...    geolocation={'latitude': ${LAT}, 'longitude': ${LON}}
    ...    locale=fi-FI
    ...    timezoneId=Europe/Helsinki
    New Page    https://www.openstreetmap.org

    Tap        role=button[name="Näytä oma sijaintini"]
    Get Url    *=    60.168
```

That runs against the real OpenStreetMap, and the coordinates it proves are the
Foundation's own front door.

The Finnish in that selector is not decoration, and it is the trap in this
chapter: `locale` changes the page, including the accessible names that
`role=…[name=…]` matches on. Set `locale=fi-FI` and "Show My Location" becomes
"Näytä oma sijaintini". A suite that sets a locale and selects by visible name
has to pick one — either select on something the translation does not touch, or
accept that the selector belongs to that locale.

One context, one device, no hardware. Everything a real phone would have told
you about *behaviour* — and none of what it would have told you about how the
thing feels in a hand, which is
[a job for a person](/docs/mobile/responsive).
