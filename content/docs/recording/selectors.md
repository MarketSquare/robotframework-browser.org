---
title: Recording selectors
description: Pick an element in the live browser and get a selector for it — Playwright's or a CSS one, checked against the page while you edit it.
section: recording
order: 6
---

Sometimes you need one selector, not a whole keyword. `Record Selector` stops the
test, lets you point at the element in the browser and returns a selector for it:

```robot
*** Test Cases ***
Find The Login Button
    ${selector} =    Record Selector    Login button
    Click    ${selector}
```

::doc-video{src="/videos/recorder/loop-record-selector.mp4" poster="/videos/recorder/loop-record-selector.jpg" alt="A login form with the Record Selector toolbar beside it. The pointer moves over the form; Playwright highlights each element under it. A click on the login button picks it: the toolbar shows role=button[name*=&quot;login&quot;i] and 1 match. Switching to CSS shows .loginButtonStyle; Use returns it." :controls="false"}
Hover, click to pick, switch the generator, use the selector.
::

## Picking

Move the pointer over the page: Playwright highlights the element under it and
names it in a tooltip. A click picks it — the click does not reach the page, so
nothing is submitted or opened. Elements in frames and in open shadow roots can be
picked too.

The toolbar is the one [Record Keyword](/docs/recording/toolbar) uses, with its
header showing the label you passed — `Login button` above — so you know what to pick.

## The selector

::doc-figure{src="/images/recorder/selector-picked.png" alt="The Record Selector toolbar for Login button: the buttons Playwright and CSS with Playwright chosen, the selector role=button[name*=&quot;login&quot;i] in colour, 1 match below it, and the buttons Highlight, Reselect and Use."}
The picked login button, with Playwright's selector and one match on the page.
::

After the pick the toolbar shows the selector and counts the elements it finds:

- **Playwright** writes Playwright's own selector, the one `Record Keyword` uses:
  role, text, label, placeholder or test id where they identify the element, in
  Browser syntax — `role=button[name*="login"i]`. This is the default.
- **CSS** writes a CSS selector from ids, classes, attributes and the element's
  position — `.loginButtonStyle`. Frames are joined with `>>>`, open shadow roots
  with `>>`.

Switching between them keeps the picked element; start with the other one using
`generator=css`. The selector is editable: shorten it, or drop a part that will
change, and the count below follows as you type — one match is what most keywords
need, several are shown as a warning, none as an error. *Highlight* marks the
matches on the page, *Reselect* picks another element, and *Use* returns what is
in the field, whatever it matches.

## Ending

*Use* returns the selector, and it is written to the console and the log as well.
*✕* in the header, or Escape, cancels: then the keyword fails, as it does when the
page is closed or after five minutes without a pick or a click in the toolbar —
change that with `idle_timeout`, or wait without limit with `idle_timeout=${None}`.

```robot
${heading} =    Record Selector    Page heading    generator=css    idle_timeout=1 minute
```

Like `Record Keyword`, `Record Selector` needs a visible browser, and it does not
run while a recording session is open in the same browser context.
