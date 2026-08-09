---
title: Assertions
description: Every getter can assert, and every assertion retries. Why that removes most of the waiting code from a suite.
section: concepts
order: 3
---

Every keyword that gets something can also check it. There is no separate
assertion library, and — more importantly — **the check retries**.

```robot-repl
Get Text    h1    ==    Welcome
```

That reads as one line and behaves as a wait: the text is fetched, compared, and
if it does not match yet, fetched again until it does or the retry window
expires.

## Why this is the whole waiting story

The classic flake is a check that ran once, too early:

```robot
# The old shape: look, then hope
Wait Until Element Is Visible    h1
${text} =    Get Text    h1
Should Be Equal    ${text}    Welcome
```

Three keywords, and still a race — the element became visible, then the text was
filled in a moment later. The retrying form has no gap between the look and the
check, because they are the same operation.

The retry window is `retry_assertions_for`, one second by default, set at import:

```robot
*** Settings ***
Library    Browser    retry_assertions_for=5s
```

That is a different thing from `timeout`, which is how long Playwright waits to
find an element at all. Element missing → `timeout`. Element there but the value
is not right yet → `retry_assertions_for`.

## The operators

::doc-table
---
head: [Operator, Passes when]
nowrap: [0]
rows:
  - ['`==`', 'Equal']
  - ['`!=`', 'Not equal']
  - ['`>` `>=` `<` `<=`', 'Ordered comparison']
  - ['`*=`  /  `contains`', 'The value contains the expected']
  - ['`not contains`', 'It does not']
  - ['`^=`  /  `starts`', 'Starts with']
  - ['`$=`  /  `ends`', 'Ends with']
  - ['`$`  /  `matches`', 'Matches a regular expression']
  - ['`validate`', 'A Python expression over `value` is true']
  - ['`then`  /  `evaluate`', 'Not a check — returns something derived from `value`']
---
::

The library's own keyword documentation carries this table too, so it is
available in your editor without a browser.

## Types must match

The expected value is used exactly as written; the library does not convert it.
So the type you compare against has to be the type the keyword returns.

```robot-repl
# Get Text returns a string, even when it looks like a number
Get Text            #price      ==    ${99}     # fails
Get Text            #price      ==    99        # passes

# Get Element Count returns an integer
Get Element Count   .row        ==    ${3}      # passes
```

Keywords that return numbers do convert the expected value for you. Keywords
that return strings do not — and `Get Text` is the one that catches everyone.

## Comparing strings with `<` and `>`

Character by character, by code point, stopping at the first difference. Length
is never considered:

```
A < Z      Z < a      ac < dc
'abcde' < 'abd'       '100.000' < '2'
```

Both of the last two surprise people. `'abcde' < 'abd'` because `c` precedes
`d` at the third character, and the comparison stops there. `'100.000' < '2'`
because these are strings, and `'1'` precedes `'2'` — no numeric meaning is
involved.

You cannot compare a number with a string in Python, and therefore not here
either.

## `validate` — a Python expression

When no operator expresses the check, `validate` gives you one expression with
the result bound to `value`:

```robot-repl
Get Text             h1     validate    value.startswith("Welcome")
Get Element Count    .row   validate    value % 2 == 0
Get Page State       validate    2020 >= value['year']
Get Page State       validate    "IMPORTANT MESSAGE!" == value['message']
```

Getters that return a dictionary — `Get Page State`, `Get Browser Catalog` —
are usually asserted this way, indexing into `value` directly.

## `then` — derive rather than check

`then` is the odd one: it does not assert anything. It evaluates an expression
and returns the result, so a getter can hand back exactly the piece you want:

```robot-repl
${id} =        Get Property    a#link    href    then    value.split("/")[-1]
${count} =     Get Text        .total    then    int(value.strip(" items"))
```

`evaluate` is the same thing under a different name.

## Overriding the message

A failed assertion has a readable default message. When you want your own,
`message` accepts four placeholders:

::doc-table
---
head: [Placeholder, Is]
nowrap: [0]
rows:
  - ['`{value}`', 'What the keyword returned']
  - ['`{expected}`', 'What you asserted']
  - ['`{value_type}`', 'The type of the returned value']
  - ['`{expected_type}`', 'The type of the expected value']
---
::

```robot-repl
Get Text    h1    ==    Welcome
...    message=Landing headline was "{value}", expected "{expected}"
```

The two type placeholders exist for exactly the mismatch described above — when
a comparison fails and both sides *look* identical, printing the types shows why.

## Formatters

Formatters normalise the returned value before it is compared, so a test does
not fail on whitespace nobody can see:

```robot-repl
Set Assertion Formatters    {"Get Text": ["strip", "normalize spaces"]}
Get Text    h1    ==    Welcome back
```

Available: `normalize spaces`, `strip`, `case insensitive`, and `apply to
expected`, which applies the same treatment to your expected value rather than
only to the returned one.

## In short

- Assert in the getter, not after it — the retry is the point.
- `retry_assertions_for` is for values, `timeout` is for elements.
- Match the type. `Get Text` returns a string.
- `validate` for anything the operators do not cover, `then` when you want a
  value rather than a check.
