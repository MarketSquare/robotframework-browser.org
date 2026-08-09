---
title: Testing responsive pages
description: Why a browser at a phone-sized viewport tests responsiveness properly, what emulation cannot tell you, and where real devices actually belong.
order: 1
section: mobile
---

Your page has to work on a phone. That is not a separate application, it is the
same application at a different width — and a browser at that width is a
faithful test of it.

This chapter is about testing that in automation: viewports, device descriptors,
touch, permissions and location. It starts with the part people get wrong, which
is deciding what needs a real device.

## Emulation is enough, until it is not

A responsive layout is CSS reacting to viewport width, and occasionally to
pointer type and device pixel ratio. All of those are inputs you can set. When
you set them, the browser lays the page out exactly as it would on the device —
because it is the same layout engine doing the same work.

So these are properly testable in automation, and cheaply:

- Does the navigation collapse into a menu below the breakpoint?
- Does the table become cards, or does it scroll sideways off the screen?
- Is the primary action still reachable without scrolling?
- Do tap targets keep a sane size?
- Does anything overflow horizontally? (This one is worth asserting on every
  page you have.)

And these are **not** things emulation can tell you:

::doc-table
---
head:
  - Emulation cannot judge
  - Because
rows:
  - - Whether it feels fast on a four-year-old phone
    - Your CI machine is not that phone. CPU throttling approximates it; it does
      not reproduce it.
  - - Whether the on-screen keyboard covers the field you just focused
    - There is no on-screen keyboard.
  - - Whether the thumb can actually reach the button
    - Ergonomics are physical.
  - - Whether Safari on iOS 17.2 has a bug
    - WebKit is the same engine, not the same browser build.
  - - Whether the page is legible outdoors
    - Screens and eyes are involved.
---
::

That list is the case for real devices, and it is a real case. Note what it has
in common: **every item is a human judgement.** Which is exactly why it belongs
in manual exploratory testing on real hardware, done by people, and not in an
automated suite pretending to be a person.

::doc-note
Our position, stated plainly: **test responsiveness in automation with
emulation, and test the experience on real devices with real humans.** A device
farm running the same assertions your CI already runs is an expensive way to
learn the same thing twice.
::

## The viewport is the input

Browser's default viewport is **1280×720**. Every context can have its own, and
it is the main lever — `deviceScaleFactor`, `isMobile` and `hasTouch` sit
alongside it on the same keyword.

```robot
*** Test Cases ***
Navigation Collapses On A Phone
    New Context    viewport={'width': 390, 'height': 844}
    New Page    ${URL}
    Get Element States    id=menu-button    contains    visible
    Get Element States    nav.desktop        contains    hidden    attached
```

Contexts are cheap — a fresh, isolated profile in a few milliseconds — so a viewport
per context is the natural unit. Nothing leaks between them: no cookies, no
storage, no permissions.

To change the size *within* a test, for instance to watch a layout cross a
breakpoint, set it on the page instead:

```robot
Set Viewport Size    1200    800
Get Element States    nav.desktop    contains    visible
Set Viewport Size    380     800
Get Element States    nav.desktop    contains    hidden
```

::doc-note{kind="warning"}
`Set Viewport Size` changes the page's viewport, not the emulated device. A page that renders
differently because of `isMobile` or touch support will not change just because
you made the window narrow. For that you want a device descriptor —
[Emulating a device](/docs/mobile/devices).
::

## Test the breakpoints, not the phones

The temptation is to write one test per popular handset. Resist it: you end up
with fifteen tests that all exercise the same three CSS rules, and they go stale
every time a manufacturer changes a screen.

Your CSS has breakpoints. Those are the real boundaries, and there are usually
three or four of them. Test **either side of each**, and name the tests after
the layout rather than the hardware:

```robot
*** Variables ***
&{LAYOUTS}
...    phone=380
...    tablet=800
...    desktop=1280


*** Test Cases ***
Primary Action Is Reachable
    [Template]    Check Primary Action
    FOR    ${name}    ${width}    IN    &{LAYOUTS}
        ${name}    ${width}
    END


*** Keywords ***
Check Primary Action
    [Arguments]    ${name}    ${width}
    New Context    viewport={'width': ${width}, 'height': 900}
    New Page    ${URL}
    Get Element States    id=checkout    contains    visible
```

When a test fails, "the checkout button is hidden at tablet width" locates the
bug. "It failed on the Galaxy S21" does not.

## The assertion worth having everywhere

Horizontal overflow is the most common responsive defect, one of the most
annoying, and trivially detectable — an element wider than the viewport makes
the whole page scroll sideways:

```robot
*** Keywords ***
Page Should Not Scroll Sideways
    ${overflow} =    Evaluate JavaScript    ${None}
    ...    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    Should Not Be True    ${overflow}    Page scrolls horizontally
```

Call it after loading each page at your narrowest layout. It costs nothing and
it catches the long unbreakable string, the fixed-width table and the image
without `max-width` — every time, before anyone has to notice it by hand.

## Where to go next

- [Emulating a device](/docs/mobile/devices) — descriptors, `isMobile`,
  pixel ratio, and what emulation actually changes.
- [Touch, permissions and location](/docs/mobile/touch) — `Tap`, granting
  camera or notifications, and faking where the user is.
