---
title: Every device descriptor
description: The full list of names Get Device accepts, with the viewport, pixel ratio, touch and engine each one sets — filterable and sortable.
order: 4
section: mobile
---

The names below are the ones `Get Device` accepts, spelled exactly as it wants
them. They are read out of the Playwright that ships with the Browser release
this site documents — the version is named above the table — so this is the same
list your own `Get Devices` returns, rather than Playwright's newest, which
would name devices you cannot use yet.

```robot
${device} =    Get Device    iPhone 13
New Context    &{device}
```

[Emulating a device](/docs/mobile/devices) covers what these properties do to a
page, and the one thing a descriptor cannot give you.

::device-table
::

## Reading the table

**Viewport** is the page area in CSS pixels, which is what your layout and your
media queries see. **DPR** is `deviceScaleFactor` — how many device pixels go
into one CSS pixel, so a 3 means the phone's screen is three times as fine as
the numbers beside it suggest. It changes what a screenshot looks like, not what
a selector finds.

**Touch** is `hasTouch`, and it is the one to check before writing `Tap`: on a
descriptor without it, tapping fails. **Engine** is the browser Playwright would
pick if you let it — the descriptors are not tied to it, but a WebKit profile
driven through Chromium is a combination that exists nowhere.

The **landscape** entries are separate descriptors rather than a rotation of
their portrait namesake, and on the foldables they are not the same numbers
turned around. `Galaxy Z Fold 6` is 928 × 1004 upright and 1028 × 876 on its
side, because the browser's own chrome is a different height each way. Ask for
the one you mean.

The seven `Desktop` entries have `isMobile` false and no touch. They set a user
agent and a viewport and nothing else, which makes them a convenient way to pin
a desktop size without hand-writing a user agent string.

## What is not in here

`screen` — the physical screen size, as opposed to the page area — is set on
about half of the descriptors and shown under the expander when it exists. Where
it is absent, Playwright reports the viewport as the screen.

Everything else a real handset has is not part of a descriptor: no GPU, no
touch hardware, no mobile network, and no platform browser. Chromium pretending
to be Safari on an iPhone is still Chromium. That distinction, and when it
starts to matter, is [on the previous page](/docs/mobile/devices).
