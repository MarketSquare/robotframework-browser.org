---
title: What gets recorded
description: Which Browser keyword each action becomes, how popups, dialogs, downloads and uploads are handled, recording assertions, and the selectors the recorder writes.
section: recording
order: 4
---

Playwright watches the page and reports each **action** — a click, a fill, a key
press. The recorder turns each one into a **Keyword Call** to a Browser keyword,
the same keyword you would have written by hand.

## Actions

::doc-table
---
head: [You, Recorded as]
rows:
  - ['Click', '`Click` with the selector']
  - ['Double-click, right-click, click with Shift / Ctrl / Alt / Meta', '`Click With Options` with the button, the modifiers and `clickCount`']
  - ['Type into a field', '`Fill Text` with the text — one call per field, however you typed it']
  - ['Press Enter, Tab, Escape, a shortcut', '`Press Keys`, modifiers joined with `+`']
  - ['Tick or untick a checkbox', '`Check Checkbox` / `Uncheck Checkbox`']
  - ['Choose in a `<select>`', '`Select Options By` with `value` and the chosen options']
  - ['Navigate by URL or bookmark', '`Go To` with the URL']
  - ['Close a tab', '`Close Page`']
---
::

```robot-repl
Click    role=button[name="Save"s]
Click With Options    role=row[name*="Order 4711"i]    right    Shift    clickCount=2
Fill Text    role=textbox[name*="Email"i]    jane@example.com
Press Keys    role=textbox[name*="Search"i]    Enter
Check Checkbox    role=checkbox[name*="Remember me"i]
Select Options By    role=combobox[name*="Country"i]    value    de
Go To    https://shop.example.com/cart
```

A navigation within five seconds of a click, fill or key press belongs to that
action — the click on a link *is* the navigation — so it gets no `Go To` of its
own. A recorded keyword never opens a browser or a page: it runs in whatever page
its caller set up, which is what makes it reusable.

## Popups, dialogs, downloads and uploads

Some actions need Browser keywords **around** them. Playwright reports these after
the action; the recorder puts the calls where Browser needs them. *Undo* removes
them together with the action.

**A new tab or popup** is followed by switching to it:

```robot-repl
Click    role=link[name="Open in new tab"s]
Switch Page    NEW
```

**An alert, confirm or prompt** gets its handler before the click that opens it.
Playwright does not report whether you accepted it, so the recorder accepts:

```robot-repl
Handle Future Dialogs    action=accept
Click    role=button[name="Delete"s]
```

**A download** is wrapped in a promise:

```robot-repl
${download}=    Promise To Wait For Download
Click    role=link[name="Export as CSV"s]
Wait For    ${download}
```

**An upload** through a file chooser is wrapped the same way. The page never
learns which folder the file came from, so the path starts with a placeholder;
the toolbar reminds you to fill it in:

```robot-repl
${upload}=    Promise To Upload File    <define_path_to_file>/report.zip
Click    role=button[name="Open Report"s]
Wait For    ${upload}
```

Replace `<define_path_to_file>` with the folder — `${CURDIR}/testdata` — or mark
it in the toolbar and make it an [argument](/docs/recording/arguments). When no
click opened the chooser, the recorder sets the file on the input directly:

```robot-repl
Upload File By Selector    input[type="file"]    <define_path_to_file>/report.zip
```

## Assertions

A keyword that only clicks proves nothing. **Playwright's toolbar** at the top
centre of the page has four assertion tools: pick one, then click the element to
check.

::doc-video{src="/videos/recorder/assertions.mp4" poster="/videos/recorder/assertions.jpg" alt="The Assertions page with both toolbars. The eye tool in Playwright's toolbar is chosen and the page heading clicked: a visibility check is recorded. Then the text tool is chosen, the heading clicked, and the proposed text Assertions accepted with the check mark: a text check is recorded."}
Assert visibility, then assert text — each a Keyword Call with a retrying
assertion.
::

::doc-table
---
head: [Tool, Recorded as]
rows:
  - ['Assert visibility (eye)', '`Get Element States` with `*=` and `visible`']
  - ['Assert text (ab)', '`Get Text` with `contains` and the text — or `==` when you check the whole text']
  - ['Assert value, on a field', '`Get Property` with `value`, `==` and the value']
  - ['Assert value, on a checkbox', '`Get Checkbox State` with `==` and `checked` or `unchecked`']
  - ['Assert snapshot', '`Get Aria Snapshot` with `yaml`, `==` and the element''s accessibility tree']
---
::

```robot
*** Keywords ***
Check The Assertions Page
    [Tags]    recorded
    Get Element States    role=heading[name*="Assertions"i]    *=    visible
    Get Text    h1    contains    Assertions
```

These are ordinary Browser getters, so they **retry** until the page catches up —
see [Assertions](/docs/concepts/assertions). The expected values are arguments
like any other: make `Assertions` an argument and the keyword checks any page.

## Selectors

Playwright picks each selector the way its own code generator does: a test id if
the element has one, then role and accessible name, placeholder, label, alt text,
text and title, and CSS as a last resort — the best of these that finds only
this element. The recorder writes them in Browser's public selector syntax, with
the same meaning:

::doc-table
---
head: [Element, Recorded selector]
rows:
  - ['A link or button found by its name', '`role=link[name="Keywords"s]` — exact; `name*="…"i` — contains, any case']
  - ['An element with a test id', '`[data-testid="theme-toggle"]`']
  - ['A field found by its placeholder', '`[placeholder*="Email"i]`']
  - ['Text without a role', '`text=/^\s*Plain\s+text\s*$/` — the whole text, exactly']
  - ['One of several similar elements', '`… >> nth=1`, or `div:has-text("Card one")`']
  - ['Inside an iframe', '`#frame >>> role=button[name*="Pay"i]`']
  - ['Two or more frames deep', '`>>> #inner >>> role=button[name*="Pay"i]` — in whichever frame it is']
  - ['A widget known only by its label', '`label="Map"i` — from `aria-label`, `aria-labelledby` or a `<label>`']
---
::

Every selector finds exactly the element you clicked when it was recorded; the
library's tests check this for each kind of selector Playwright generates. Whether it
still finds it tomorrow depends on the page: a name with a counter in it, like
`role=link[name*="Get Text 5"i]`, breaks when the count changes. Shorten such a
selector, or make the changing part an [argument](/docs/recording/arguments#selectors).

::doc-note
Rarely, a selector has no public form — an attribute with an empty value, say. It
stays in Playwright-internal syntax, which works but may change with a Playwright
upgrade, and the toolbar says so.
::

## Values are written exactly

Whatever you typed is what the keyword types, even where it means something to
Robot Framework. Spaces Robot would read as a cell separator or strip at a cell
edge are escaped with a backslash, so no two plain spaces meet:

```robot-repl
Fill Text    id=ref       \#42                      # not a comment
Fill Text    id=name      two \ spaces              # not a cell separator
Fill Text    id=path      \${HOME}/reports          # not a variable
Fill Text    id=note      first line\nsecond line   # a line break
Fill Text    id=code      \ padded \                # edge spaces kept
Fill Text    id=tail      two trailing \ \          # both trailing spaces kept
Fill Text    id=empty     ${EMPTY}                  # the field was cleared
```

Password fields get no special treatment: what you type is recorded as typed.
Make it an argument without a default, so the keyword never holds a secret — see
[Good practice and limits](/docs/recording/practice).

## Not recorded

- **Hovering.** Playwright does not report it. Add `Hover` by hand where a menu
  needs it.
- **Anything while the toolbar picks a selector** with *Pick* in the toolbar or *Pick
  locator* in Playwright's — see [Picking a selector](/docs/recording/toolbar#picking-a-selector).
- **Actions a later Playwright version adds.** Every action Playwright reports
  today has a Browser keyword. One without names itself in a notice; the keyword
  stays as it was.
- **Other browser contexts.** Only the context that was active when the
  recording started is recorded.
