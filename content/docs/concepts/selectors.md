---
title: Finding elements
description: Which selector strategy to reach for, why the order matters, and how to chain across iframes and shadow DOM.
order: 2
section: concepts
---

Every keyword that touches the page takes a `selector`. Which strategy you choose
decides how often your suite breaks for reasons that have nothing to do with the
software under test.

This page covers the strategies, the order I would reach for them in, and the
syntax for chaining, iframes and shadow DOM.

## Pick a strategy

::doc-note{kind="note"}
**The ranking below is opinionated!**

It optimises for one thing: *a selector that keeps working when the page is redesigned but the feature is unchanged.*

Every project is different, and you should base your selector strategy on other criteria as well. For example, prior knowledge, GUI framework, or other factors.
::

::doc-table
---
head:
  - ""
  - Strategy
  - Reach for it when
rows:
  - - "1"
    - role=
    - The element has a proper accessible role and name. This is the default
      choice.
  - - "2"
    - data-testid=
    - Stability matters more than testing the interface as a user meets it.
  - - "3"
    - text=
    - The visible text is the thing you actually mean, and the app is
      single-language.
  - - "4"
    - id=
    - You know the id is contractual, not incidental.
  - - "5"
    - css=
    - None of the above identify the element.
  - - "6"
    - xpath=
    - Genuinely nothing else can select it.
---
::


### Example: Our Landing Page

On our landing page, we have some buttons and links.

One of them is a colour theme toggle, which is a button with a visible label and aria-label. It is the only button with that aria-label, so it is a perfect candidate for a `role=` selector. However, it also has a `data-testid` attribute, which is a good candidate for a `data-testid=` selector. The visible text is "DARK", which is a good candidate for a `text=` selector.

::doc-figure{src="/images/color-toggle.png" alt="A toggle button labelled DARK in the top-right corner"}
Color toggle at top right
::

See the following HTML DOM snippet for the button:

```html [Color Theme Toggle]
<button 
  type="button"
  class="toggle"
  data-testid="theme-toggle"
  aria-label="DARK-Mode colour theme. Activate to change."
>
  <span class="dot" aria-hidden="true" />
  DARK
</button>
```

### 1. `role=` — how the user finds it

```robot-repl
Click    role=button[name="DARK-Mode colour theme. Activate to change."]
# ^ matches the aria-label as exact match

Click    role=button[name*="colour theme"]
# ^ matches the aria-label which contains (*=) the substring "colour theme"

# other examples:
Click    role=link[name="Get started"]
Fill Text    role=textbox[name="Email"]    admin@example.com
```

A role selector matches on what the element *is* and what it is *called* —
the same two things a screen-reader user navigates by. It is semantic rather
than structural, so it survives a redesign that moves the button, restyles it,
or rebuilds the surrounding markup.

The name here is the **accessible name**, which the browser computes in this
order:

1. `aria-labelledby`
2. `aria-label`
3. An associated `<label>`
4. Visible text content
5. `title`

There is a bonus that is easy to miss. If you cannot write a role selector
because the element has no proper role or no accessible name, **you have found
an accessibility bug**. A screen-reader user cannot identify that control
either. That is worth an issue, not a workaround.

When accessible names are long and complex, `role=` selectors can be brittle if the name changes in a redesign.
In that case, matching by substring or regex is a good compromise, e.g. `role=button[name*="colour theme"]` matches the aria-label by substring.

The following operators are available for matching the name:

| Operator | Meaning | Example |
| -------- | ------- | ------- |
| `=` | exact match | `role=button[name="DARK-Mode colour theme. Activate to change."]` |
| `*=` | contains substring | `role=button[name*="Activ"]` |
| `^=` | starts with string | `role=button[name^="DARK"]` |
| `$=` | ends with string | `role=button[name$="Activate to change."]` |
| `~=` | contains one whole word | `role=button[name~="Activate"]` |
| `|=` | contains hyphenated word | `role=button[name|="DARK"]` |

Regex is also supported when the expected text is surrounded by slashes,
e.g. `role=button[name=/^(DARK|LIGHT|CONTRAST|AUTO)-Mode colour theme/]` matches the aria-label as a regex, case-sensitively.
Regex flags can be added after the closing slash, e.g. `i` for case-insensitive matching.

### 2. `data-testid=` — the one attribute that belongs to us

```robot-repl
Click   data-testid=theme-toggle
```

Every other attribute on the page belongs to someone else. Classes belong to the
designers, ids to the developers, text to the copywriters — and all three of
them are entitled to change their minds without telling you.

A dedicated test id is the only hook that exists for testing, and the only one
nobody will change by accident. If long-term stability is what you are buying,
buy this one.

Be clear-eyed about what it costs, though. A test id is invisible to the user,
so a suite built on test ids is **using the interface to test the functionality
behind it**, not testing the interface. That is often exactly the right trade —
just make it deliberately rather than by default.

### 3. `text=` — what is written on it

```robot-repl
Click    text=DARK            # contains match
Click    "DARK"               # exact match

# if the aria-label would be the text:
Click    text=/^(DARK|LIGHT|CONTRAST|AUTO)-Mode colour theme/i    # regex match
```

Text selectors use a user-facing property, like `role=`, which is why they rank
above anything structural. They are one step behind `role=` because text alone
does not say what the element *is*, and because text is language-dependent: the
moment the app is localised, every text selector is a translation away from
failing.

`text=Sign in` matches by substring, case-insensitively. Quoting the value —
`"Sign in"` — makes it a whole-string, case-sensitive match. Both **normalise
whitespace**: edges trimmed and internal runs collapsed, so `"Sign in"` still
matches `<p> Sign in </p>`. The regex form is the exception — it runs
against the raw text, so `text=/^Sign in$/i` will not match a padded node.

### 4. `id=` — less stable than it looks

```robot-repl
Click    id=submit-button
Click    \#submit-button
```

An id feels like a stable, unique handle, and sometimes it is. But ids belong to
the developers, they are frequently generated by a framework, and nothing stops
them changing in a refactor that nobody thought was user-visible. The stability
is a **false sense of safety** unless you have agreed with the developers that
these particular ids are contractual.

::doc-note{kind="warning"}
`#` starts a comment in Robot Framework syntax, so a CSS id selector must be
escaped as `\#submit-button`, or written as `id=submit-button`.
::

### 5. `css=` — acceptable, not preferable

```robot-repl
Click    button.toggle:has-text("DARK")   #button with the class "toggle" that contains the text "DARK"

# other examples:
Click    css=button.primary
Click    .checkout > button
```

CSS is web-native and every web developer reads it, which is a real advantage:
a developer looking at your selector understands it immediately and can tell
you when a change will break it.

It ranks below the four above because it selects on *structure and styling* —
exactly the things a redesign changes. A class name is a styling decision, typically not a contract with you.

CSS is the implicit default: a selector that is not obviously something else is treated as CSS.

::doc-note{kind="aside"}
CSS is way more powerful than many realise. It can select by attribute, by position, by relationship, and even by text content. See [CSS Basics and Advanced](#css-basics-and-advanced) for a full reference.
::

### 6. `xpath=` — the last resort

```robot-repl
Click    xpath=//button[contains(@class, "toggle") and contains(text(), 'DARK')]
# ^ the literal same as the CSS above, but in XPath

Click    xpath=//header//button[contains(text(),'DARK')]    # text contains, preceding whitespace ignored
Click    //header//button[text()=' DARK']    # exact match, whitespace matters!
```

XPath is CSS's powerful, unpleasant relative. It is more verbose for the same
result, many web developers do not read it fluently, it is not web-native, and
it invites selecting by document position rather than function — which is the
most brittle thing you can possibly do.

It is partially more powerful, and occasionally something is unselectable
without it. Use it then, and only then. It is the last resort, not a
general-purpose tool. One of the very rare occasions where it is appropriate
to use XPath is when you need to navigate relative to a reliably identified element

And if you are about to paste something like this out of your browser's
devtools:

```robot-repl
Click    //body/div[1]/div/header/span/button
```

**DON'T!** That selector describes where the button sits today, not what it is.
It will break on the next layout change, and the failure will look like a bug in
the software rather than in the test.

A legitimate use for XPath is **relative navigation**: start from an element you can identify reliably, then move through the DOM to an otherwise ambiguous element.

For example, imagine a form with several fields, each with the same info button:

```html [DOM]
...
<div class="field">
    <label for="email">Email</label>
    <div class="control">
        <input id="email" type="text">
        <button type="button" aria-label="More information">ⓘ</button>
    </div>
</div>
<div class="field">
    <label for="phone">Phone</label>
    <div class="control">
        <input id="phone" type="text">
        <button type="button" aria-label="More information">ⓘ</button>
    </div>
</div>
...
```

`role=button[name="More information"]` alone is ambiguous: there are two of them. But the Email textbox is easy to identify. We can anchor there, move up to the common parent, and then find the button within it:

```robot-repl [Bad Example]
Click    xpath=//label[text()="Email"]/..//button[@aria-label="More information"]
```

The above example solves the problem but just because you need one functionality of XPath, does not mean you have to use it all the way. See [Cascading Selectors](#chaining-with)

```robot-repl [Good Example]
Click    role=textbox[name="Email"] >> xpath=.. >> role=button[name="More information"]
```

Here XPath is doing something useful and narrowly scoped: **navigating relative to a reliably identified element**. We are not describing where the element happens to sit in the entire document; we are expressing a local relationship between two elements.

That is a good use of XPath.

### Also available: the `data-testid` aliases

`data-testid=` has two siblings that do exactly the same job against a different
attribute. Which one you use is decided by what your developers already put in
the markup, not by preference:

::doc-table
---
head:
  - Prefix
  - Matches
nowrap:
  - 0
rows:
  - - "`data-testid=`"
    - "`data-testid` — Playwright's own default, and the most common in the wild"
  - - "`data-test-id=`"
    - "`data-test-id`"
  - - "`data-test=`"
    - "`data-test`"
---
::

All three behave identically. Pick the one your application emits and stay with
it.

## How a strategy is used

You can always be explicit with a `strategy=value` prefix. Spaces around the
separator are ignored by `css=`, `xpath=` and `text=`, so `css=foo`, `css= foo`
and `css = foo` are equivalent. They are **not** ignored by `id=` or the
test-id engines: the space becomes part of the value, so `id = save` silently
matches nothing.

Without a prefix, the strategy is inferred:

::doc-table
---
head:
  - Selector looks like
  - Treated as
rows:
  - - Starts with `//` or `..`
    - XPath
  - - Starts and ends with a quote
    - Text
  - - Anything else
    - CSS
---
::

```robot-repl [Implicit Selector Strategies]
Get Element    //html/body/div      # xpath
Get Element    "foo"                # text exact match
Get Element    div                  # css
```

## Cascading Selectors with `>>`

This is the part that makes Browser's selectors worth learning. Strategies
combine in a single string, left to right, with `>>`. Each step searches inside
the result of the previous one.

```robot-repl
# Find the element with text "Login", then the input beside it
Click    "Login" >> xpath=../input

# Find a css element, then a button inside it by text
Click    css=.checkout >> text=Confirm

# Start with a role, narrow with css
Get Text    role=listitem >> css=.price
```

That means you rarely need one clever selector. You need two obvious ones.

### When the chain returns the wrong element

By default a chain returns what the *last* step matched. Prefix a step with `*`
to return that step's element instead, while still requiring the rest of the
chain to match:

```robot-repl
# The article that contains "Hello" — not the text node inside it
Get Element    *css=article >> text=Hello
```

### When `>>` appears in the text you are matching

Escape it by quoting the value, or the chain splits in the wrong place:

```robot-repl
Get Text    text="some >> text"
```

## Filter selectors

Some prefixes do not find elements at all. They take what the previous step
found and **narrow it**, which is why they are only *useful* as a step in a
chain. Used alone they apply to the whole document rather than being rejected.

It is worth holding the two kinds apart in your head:

::doc-table
---
head:
  - Kind
  - Does
  - Examples
nowrap:
  - 0
rows:
  - - Strategy
    - Finds elements in the page
    - "`css=`, `xpath=`, `text=`, `role=`, `id=`"
  - - Filter
    - Narrows what the step before it found
    - "`nth=`, `visible=`"
---
::

### `nth=` — pick one out of many

Zero-based, and `-1` is the last one:

```robot-repl
Click    css=.result >> nth=0     # the first result
Click    css=.result >> nth=2     # the third
Click    css=.result >> nth=-1    # the last
```

This is the honest escape hatch from [strict mode](#strict-mode): when a
selector legitimately matches several elements and you want a specific one,
say so. It is still positional, so prefer narrowing by something meaningful
first — `css=.result >> text=Helsinki` beats `nth=3` whenever it is available.

### `visible=` — keep only what can be seen

```robot-repl
Click    css=button.save >> visible=true
Get Element Count    css=.row >> visible=false    ==    2
```

Useful when a page keeps hidden copies of things in the DOM — a mobile menu
next to a desktop one, a template, a collapsed panel.

::doc-note{kind="warning"}
**The order of filters changes the answer.** These two are not the same
selector:

```robot-repl
# Third input among the visible ones
Click    //input >> visible=true >> nth=2

# Third input in the DOM, then check it happens to be visible
Click    //input >> nth=2 >> visible=true
```

Each step operates on the result of the one before it. Reading a chain left to
right tells you exactly what it does, and reading it in any other order tells
you something false.
::

## CSS Basics and Advanced

### CSS Basics

| Syntax           | Meaning                          | Example                           |
| ---------------- | -------------------------------- | --------------------------------- |
| `tag`            | Element type                     | `button`                          |
| `.class`         | Class                            | `.submit-button`                  |
| `#id`            | ID                               | `#email`                          |
| `[attr]`         | Has attribute                    | `[disabled]`                      |
| `[attr="value"]` | Attribute equals                 | `[type="submit"]`                 |
| `A B`            | Descendant                       | `form button`                     |
| `A > B`          | Direct child                     | `form > button`                   |
| `A + B`          | **Next sibling**                 | `label + input`                   |
| `A ~ B`          | **Any following sibling**        | `label ~ button`                  |
| `:nth-child(n)`  | Child by position                | `li:nth-child(2)`                 |
| `:not(...)`      | Exclude matches                  | `button:not([disabled])`          |
| `:has(...)`      | Has matching descendant/relative | `.field:has(input[name="email"])` |

One useful distinction to xpath: CSS can select **following** siblings with `+` and `~`, but it has no simple equivalent of XPath's `..` for selecting a parent directly.

### Filtering inside a CSS selector

Playwright adds pseudo-classes to CSS that stay inside one step, rather than
becoming another link in the chain. These are strategies-with-conditions, not
filters, because they still describe *which* element you want:

::doc-table
---
head:
  - Pseudo-class
  - Matches
nowrap:
  - 0
rows:
  - - "`:has(sel)`"
    - An element that contains something matching `sel`
  - - '`:has-text("x")`'
    - An element containing that text anywhere inside it, case-insensitive
  - - '`:text("x")`'
    - The *smallest* element containing that text
  - - '`:text-is("x")`'
    - The smallest element whose text is exactly that
  - - '`:text-matches("re")`'
    - Text matching a regular expression
  - - "`:visible`"
    - Only elements that are visible
  - - "`:is(a, b)`"
    - An element matching *any* of the listed selectors
  - - "`:nth-match(sel, n)`"
    - The n-th match, one-based, across the whole query
---
::

```robot-repl
# The row that contains the name, then the button inside that row
Click    css=tr:has-text("Ada Lovelace") >> role=button[name="Edit"]

# A card that contains an image, rather than a card whose text mentions one
Get Text    css=.card:has(img) >> css=.title
```

`:has-text()` is the one you will reach for most. Note the difference from
`:text()`: `tr:has-text("Ada")` is the whole row, while `tr :text("Ada")` is the
cell.

### Layout selectors

Playwright can also select by where an element sits relative to another:
`:right-of()`, `:left-of()`, `:above()`, `:below()` and `:near()`.

They return **every** element in that direction, sorted by distance — not the
nearest one — so under strict mode you need a `nth=0` to say you meant the
closest.

```robot-repl
Fill Text    css=input:right-of(:text("Postcode")) >> nth=0    00100
```

::doc-note{kind="warning"}
These match on rendered geometry, so they break when the layout changes — the
same objection as selecting by document position with XPath, and for the same
reason. A form field is nearly always reachable through its `<label>`, which is
what `role=textbox[name="Postcode"]` uses and what a screen reader uses too.

Reach for a layout selector when the markup genuinely offers nothing else, and
treat it as a note that the page has an accessibility problem worth reporting.
::

## XPath Basics

XPath has tons of features and was generally designed to navigate in XML trees.
Here are some of the more common used ones.

As you can see, unlike in CSS, `class` and `id` attributes are not treated specially. To identify an element whose `class` attribute contains `error`, you need to use the `contains()` function.

| Syntax                | Meaning                   | Example                            |
| --------------------- | ------------------------- | ---------------------------------- |
| `//`                  | Descendant anywhere below | `//button`                         |
| `/`                   | Direct child              | `//form/button`                    |
| `..`                  | Parent                    | `//input/..`                       |
| `@`                   | Attribute                 | `//input[@name="email"]`           |
| `[...]`               | Filter / condition        | `//button[@type="submit"]`         |
| `*`                   | Any element               | `//*[@data-id="123"]`              |
| `text()`              | Element text              | `//button[text()="Save"]`          |
| `contains()`          | Partial match             | `//div[contains(@class,"error")]`  |
| `[1]`, `[2]`          | Positional match          | `(//button)[1]`                    |
| `ancestor::`          | Navigate upward           | `//input/ancestor::form`           |
| `following-sibling::` | Following sibling         | `//label/following-sibling::input` |

There are way more functionalities supported by XPath that you may learn somewhere else.

## Crossing into iframes with `>>>`

Selector chains stop at frame boundaries by default. To cross one, use `>>>`:

```robot-repl
Get Text    iframe#preview >>> h1
Click       iframe[name="editor"] >>> role=button[name="Bold"]
```

No context switching, and no switching back afterwards — the frame boundary is
just another step in the chain.

Two rules it is easy to trip over. `>>>` must have **spaces around it**: written
as `a>>>b` it is parsed as ordinary CSS and you get a timeout with no
explanation. And the clause immediately before it must select the `<iframe>`
element itself — under strict mode, exactly one of them.

## Shadow DOM

Browser pierces open shadow roots automatically, so a normal chain reaches into
a web component without any special syntax:

```robot-repl
Get Text    css=my-widget >> css=button
```

This is one of the places Browser is genuinely ahead of older tools: automatic
piercing means a component-based frontend does not need a different approach
from any other page.

Closed shadow roots cannot be pierced by anything, by design — if you hit one,
that is a conversation with the developers rather than a selector problem.

Piercing is what most engines do — `css`, `text`, `role` and the attribute
engines all cross open shadow roots. `xpath` does not. Every descendant
combinator, including the implicit one at the start of a selector, crosses any
number of open roots. Elements are searched in the light DOM first, then inside
open shadow roots, in document order. No engine enters an iframe — that needs
`>>>`.

### Turning piercing off

One engine stops at the shadow boundary: `css:light=`, which behaves like
`document.querySelector` and follows the CSS spec exactly.

```robot-repl
# Matches .label inside the component's shadow root
Get Text    css=my-widget .label

# Matches only if .label is in the light DOM
Get Text    css:light=my-widget .label
```

Reach for `css:light=` when you specifically need to assert that something is
*not* inside a shadow root. The rest of the time the piercing default is what
you want.

::doc-note{kind="warning"}
The other `:light` engines are deprecated. `text:light=`, `id:light=`,
`xpath:light=`, `data-testid:light=`, `data-testid:light=` and `data-test:light=`
do not work anymore.
::

## Strict mode

By default, a selector that matches more than one element is an error rather
than a silent pick of the first one.

```robot
*** Settings ***
Library    Browser    strict=False    # opt out globally
```

Leave it on. A selector matching three elements when you meant one is a bug in
the selector, and strict mode tells you immediately instead of at some later
point when the order changes.

## Element references

`Get Element` returns a reference you can pass to other keywords, so an
expensive lookup is done once:

```robot-repl
${button} =    Get Element    role=button[name="Save"]
Get Element States    ${button}    contains    enabled
Click    ${button}
```

What you get back is a **selector string** — the selector Playwright resolved for
that element — not a snapshot of the DOM node. `Get Elements` returns a list of
them.

That distinction matters in both directions. It re-resolves on every use, so it
survives a re-render that would invalidate a stored node. But it is only a
selector, so it goes in the *first* clause of a chain and nothing more:

```robot-repl
${row} =    Get Element    css=tr.selected
Click       ${row} >> css=button.delete    # relative to the row
```

A reference works like any other first clause, `>>>` included: if it points at
an iframe, `${frame} >>> h1` crosses into it. And there is no `element=` prefix —
the value is already an ordinary selector, so it needs no strategy in front of it.

## In short

- Reach for `role=` first. If you cannot, you may have found an accessibility bug.
- Use `data-testid=` when stability is the priority, knowing what it trades away.
- `text=` is fine until you localise.
- `css=` is acceptable; `id=` is less stable than it looks.
- `xpath=` last, and never by document position.
- Two obvious selectors chained with `>>` beat one clever one.
- `nth=` and `visible=` are filters, not strategies: they narrow the step
  before them, and their order in a chain changes the answer.
