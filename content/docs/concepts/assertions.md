---
title: Assertions
description: Every getter can assert, every assertion retries, and each return type allows different operators. The complete AssertionEngine reference.
section: concepts
order: 3
---

Every keyword that gets something can also check it. There is no separate
assertion library, and — this is the part that matters — **the check retries**.

```robot-repl
Get Text    h1    ==    Welcome
```

Three things happen in that one line: the text is read, compared, and if it does
not match yet, read again until it does or the retry window expires. The value is
returned either way, so you can assert and capture at once:

```robot-repl
${title} =    Get Text    h1    ==    Welcome
```

## Why this replaces the waiting code

The classic flaky test looks once, too early:

```robot
# The old shape: look, then hope
Wait Until Element Is Visible    h1
${text} =    Get Text    h1
Should Be Equal    ${text}    Welcome
```

Three keywords, and still a race — the element became visible, then the text
arrived a moment later. The retrying form has no gap between the look and the
check, because they are one operation.

### Two timeouts, and they are not the same

::doc-table
---
head: [Setting, Governs, Default]
rows:
  - ['`timeout`', 'How long Playwright waits for the **element** to exist', '10s']
  - ['`retry_assertions_for`', 'How long the **value** is re-read while the assertion fails', '1s']
---
::

```robot
*** Settings ***
Library    Browser    timeout=15s    retry_assertions_for=5s
```

Element never appears → `timeout`. Element is there but the text is still
`Loading…` → `retry_assertions_for`. Raising the wrong one is the most common
reason a fix does not help.

## The operators

### Comparison

::doc-table
---
head: [Operator, Aliases, True when]
nowrap: [0, 1]
rows:
  - ['`==`', '`equal`, `should be`', '`value == expected`']
  - ['`!=`', '`inequal`, `should not be`', '`value != expected`']
  - ['`>`', '`greater than`', '`value > expected`']
  - ['`>=`', '', '`value >= expected`']
  - ['`<`', '`less than`', '`value < expected`']
  - ['`<=`', '', '`value <= expected`']
---
::

```robot-repl
Get Text             h1        ==    Welcome
Get Element Count    .row      >     ${5}
Get Style            body      width    !=    0px
```

### Substring and edges

::doc-table
---
head: [Operator, Aliases, True when]
nowrap: [0, 1]
rows:
  - ['`*=`', '`contains`', '`expected in value`']
  - ['`not contains`', '', '`expected not in value`']
  - ['`^=`', '`starts`', 'Value starts with expected — a literal, not a pattern']
  - ['`$=`', '`ends`', 'Value ends with expected — literal too']
---
::

```robot-repl
Get Text    .banner    *=              Welcome
Get Text    .banner    not contains    Error
Get Url     ^=         https://
Get Url     $=         /checkout
```

`^=` and `$=` escape what you give them, so `$=` with `.html` matches a literal
dot, not any character.

### `matches` — regular expressions

`matches` (also written `$`) runs `re.search` over the value. What it *returns*
depends on the groups in your pattern, and this catches people out:

::doc-table
---
head: [Pattern has, Returns]
rows:
  - ['No groups', 'The whole value, as a string']
  - ['Unnamed groups', 'A **tuple** of the groups']
  - ['All groups named', 'A **dictionary** of the groups']
---
::

```robot-repl
# No groups — returns the whole string
Get Text    .id    matches    ^ORDER-\\d+$

# Unnamed groups — returns a tuple
${parts} =    Get Text    .date    matches    (\\d+)-(\\d+)-(\\d+)
Should Be Equal    ${parts}[0]    2026

# Named groups — returns a dict
${d} =    Get Text    .date    matches    (?P<year>\\d+)-(?P<month>\\d+)-(?P<day>\\d+)
Should Be Equal    ${d}[year]    2026
```

So `matches` is both an assertion and an extractor. Use `re.search` semantics:
it is not anchored unless you anchor it.

### `validate` — any Python expression

When no operator says it, `validate` gives you one expression with the result
bound to `value`:

```robot-repl
Get Text             h1       validate    value.startswith("Welcome")
Get Element Count    .row     validate    value % 2 == 0
Get Text             .price   validate    float(value.strip("€")) < 100
Get Page State       validate    2020 >= value['year']
```

Getters returning a dictionary — `Get Page State`, `Get Browser Catalog` — are
usually asserted this way, indexing into `value` directly.

### `then` — derive instead of check

`then` (also `evaluate`) asserts nothing. It evaluates an expression and returns
the result, so a getter hands back exactly the piece you want:

```robot-repl
${id} =       Get Property    a#link    href     then    value.split("/")[-1]
${count} =    Get Text        .total            then    int(value.strip(" items"))
${upper} =    Get Text        h1                then    value.upper()
```

Because it runs after the value is read, `then` is also the retrying way to wait
for something you have to compute.

## Which operators a keyword allows

Not every operator works everywhere. The engine picks a rule set from the type
the keyword returns, and using the wrong one is an error, not a failed assertion.

::doc-table
---
head: [Return type, Allowed, Example keyword]
rows:
  - ['String, number', 'All of them', '`Get Text`, `Get Element Count`']
  - ['**List**', '`==` `!=` `contains` `validate` `then`', '`Get Classes`, `Get Elements`']
  - ['**Dictionary**', '`==` `!=` `contains` `validate` `then`', '`Get Page State`, `Get BoundingBox`']
  - ['**Boolean**', '`==` `!=` only', '`Get Checkbox State`']
  - ['**Element states**', 'Set operators, including `not contains`', '`Get Element States`']
---
::

Two consequences worth knowing:

**Lists are compared unordered.** With `==` and `!=` the engine sorts both sides
first, so this passes:

```robot-repl
Get Classes    .btn    ==    primary    large    # matches "large primary" too
```

**`not contains` does not work on lists** — it is absent from the sequence
operators. Use `validate` instead:

```robot-repl
Get Classes    .btn    validate    "disabled" not in value
```

**Booleans accept Robot's truthiness.** `Get Checkbox State` compares against
`is_truthy`, so `True`, `true`, `yes` and `checked` all mean the same, and the
empty string, `no` and `false` mean the other.

## Types must match

The expected value is used exactly as written — the library does not convert it.
So it has to already be the type the keyword returns.

```robot-repl
# Get Text returns a string, even when it looks like a number
Get Text             #price    ==    ${99}    # fails: int vs str
Get Text             #price    ==    99       # passes

# Get Element Count returns an integer
Get Element Count    .row      ==    ${3}     # passes
```

Keywords returning numbers *do* convert the expected value for you. Keywords
returning strings do not, and `Get Text` is the one everybody trips over. When a
failure shows two values that look identical, print the types — see
[messages](#custom-messages) below.

### Comparing strings with `<` and `>`

Character by character, by code point, stopping at the first difference. Length
never enters into it:

```
A < Z        Z < a        ac < dc
'abcde' < 'abd'           '100.000' < '2'
```

Both of the last two surprise people. `'abcde' < 'abd'` because `c` precedes `d`
at the third character and the comparison stops there. `'100.000' < '2'` because
these are strings and `'1'` precedes `'2'` — nothing numeric is involved. You
cannot compare a number with a string in Python, and so not here either.

## Formatters

A formatter normalises the value *before* it is compared, so a test does not fail
on whitespace nobody can see. This is the fix for the rendered-HTML problem:
markup that says `Hello   World` across two source lines becomes the string
`"Hello \n World"`.

::doc-table
---
head: [Formatter, Does]
nowrap: [0]
rows:
  - ['`strip`', 'Removes leading and trailing whitespace']
  - ['`normalize spaces`', 'Collapses every run of whitespace to one space']
  - ['`case insensitive`', 'Lower-cases the value']
  - ['`apply to expected`', 'Not a transform — makes all the others apply to your expected value too']
---
::

Set them per keyword:

```robot
*** Test Cases ***
Whitespace Does Not Matter
    Set Assertion Formatters    {"Get Text": ["strip", "normalize spaces"]}
    Get Text    .greeting    ==    Hello World
```

Without the formatters that comparison sees `"\n  Hello   World\n"` and fails.

They apply **in the order given**, and only to the value:

```robot-repl
# value "  HELLO  " becomes "hello", expected stays "  Hello  " -> fails
Set Assertion Formatters    {"Get Text": ["strip", "case insensitive"]}
Get Text    h1    ==    ${SPACE}${SPACE}Hello${SPACE}${SPACE}
```

Add `apply to expected` and both sides get the same treatment, which is usually
what you meant:

```robot-repl
Set Assertion Formatters    {"Get Text": ["strip", "case insensitive", "apply to expected"]}
Get Text    h1    ==    ${SPACE}${SPACE}Hello${SPACE}${SPACE}    # passes
```

Several keywords at once, and a scope:

```robot
Set Assertion Formatters
...    {"Get Text": ["strip", "normalize spaces"], "Get Property": ["case insensitive"]}
...    scope=Suite
```

The keyword returns the formatters that were set before, so a test can put them
back. Note that a formatter written as a lambda is not included in that returned
value — only the named rules survive the round trip.

## Custom messages

A failed assertion has a readable default. To replace it, `message` accepts four
placeholders:

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

The two type placeholders exist precisely for the mismatch above — when both
sides look the same and it still fails, printing the types shows why:

```robot-repl
Get Text    #price    ==    ${99}
...    message=Got {value} ({value_type}), expected {expected} ({expected_type})
# Got 99 (<class 'str'>), expected 99 (<class 'int'>)
```

## Common mistakes

::doc-table
---
head: [Symptom, Cause]
rows:
  - ['`Assertion operator is mandatory when specifying expected value`', 'An expected value with no operator between them']
  - ['Two identical-looking values, still fails', 'String against number. Print `{value_type}`']
  - ['`Operator ... is not allowed in this Keyword`', 'A list or dict getter given something outside `==` `!=` `contains` `validate` `then`']
  - ['Fails on invisible whitespace', 'No formatter. Add `strip` and `normalize spaces`']
  - ['Passes when it should not, on a list', '`==` sorts both sides — order is not checked']
  - ['Assertion never retries long enough', 'Raised `timeout` instead of `retry_assertions_for`']
---
::

## In short

- Assert inside the getter, not after it — the retry is the whole point.
- `retry_assertions_for` is for values, `timeout` is for elements.
- Match the type. `Get Text` returns a string.
- Lists and dictionaries only take `==` `!=` `contains` `validate` `then`, and
  `==` ignores order.
- `validate` for whatever the operators do not cover, `then` when you want a
  value rather than a check, `matches` when you want both.
- Reach for formatters before you reach for a regular expression.
