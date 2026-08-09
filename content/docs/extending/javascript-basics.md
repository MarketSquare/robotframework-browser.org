---
title: Just enough JavaScript
description: The JavaScript you need to write extensions and Evaluate JavaScript, for people who write Python.
section: extending
order: 2
---

You do not need to know JavaScript to use Browser. You need a little to extend
it. This page is the little.

## Two different JavaScripts

The most common confusion, and worth getting straight first:

::doc-table
---
head: [Where it runs, What exists there, Reached by]
rows:
  - ['Node.js', 'Playwright, `page`, the filesystem', 'A JS extension module']
  - ['The browser page', '`document`, `window`, the DOM', '`Evaluate JavaScript`, `page.evaluate`']
---
::

Node-side code drives the browser. Page-side code runs *inside* it. `document`
does not exist in Node; Playwright does not exist in the page.

## Variables

```javascript
let count = 2      // block scoped, reassignable
const name = 'x'   // block scoped, not reassignable
var old = 1        // function scoped — avoid
```

Use `const` by default and `let` when you must reassign.

## Strings

`'single'` and `"double"` are the same. Backticks interpolate:

```javascript
const greeting = `Hello ${name}, you have ${count} items`
```

## Equality

The one that catches Python developers:

```javascript
"32" == 32     // true  — coerces types
"32" === 32    // false — compares type as well
```

Use `===`. Always.

## Functions and arrow functions

```javascript
function add(a, b) {
  return a + b
}                                  // can be called before it is defined

const sum = (a, b) => a + b        // must be defined before use
const double = a => a + a          // one expression: no braces, no return
```

Arrow functions are what you will mostly write, because callbacks are
everywhere:

```javascript
const odds = numbers.filter(n => n % 2)
```

## Objects and arrays

A JS object is close to a Python dict, with unquoted keys:

```javascript
const obj = { key: 'test', list: [1, 2, 3], nested: { subKey: 'test' } }
const asText = JSON.stringify(obj)
const back = JSON.parse(asText)
```

Arrays have the methods you want — `map`, `filter`, `forEach`, `find`. But many
DOM results are *iterable* without being arrays, so convert first:

```javascript
const inputs = Array.from(document.querySelectorAll('input'))
const values = inputs.filter(e => e.type === 'text').map(e => e.value)
```

Forgetting `Array.from` is the single most common mistake here:
`document.querySelectorAll(...)` has no `.map`.

## async and await

Almost every Playwright call is asynchronous:

```javascript
async function getTitle(page) {
  await page.goto('https://example.com')
  return await page.title()
}
```

An `async` function returns a promise. `await` waits for one.

Browser awaits whatever your keyword returns, so a promise returned *directly*
resolves fine. A promise tucked **inside** the returned value does not — it is
serialised as `{}`. If one field of your result comes back empty, a missing
`await` is usually why.

## Evaluate JavaScript

You can run page-side JavaScript from Robot Framework directly, which is often
enough without writing an extension at all.

Three things about its shape, because they are what people get wrong first:

- The **first argument is a selector**, and it cannot be omitted — pass
  `${None}` when you do not want one.
- With a selector, the function receives `(element, arg)`; with `all_elements=True`
  it receives `(elements, arg)` — that flag is what makes it an array. With no
  selector it receives just `(arg)`.
- The return value must be JSON-serialisable. Returning nothing gives you an
  empty string, and a DOM node comes back as the useless string `ref: <Node>`.

```robot
*** Test Cases ***
Collect Every Link Text
    ${texts} =    Evaluate JavaScript    a
    ...    elements => elements.map(e => e.innerText).filter(text => text)
    ...    all_elements=True
    Log Many    @{texts}
```

Compare that with doing it keyword by keyword:

```robot-repl
${elements} =    Get Elements    a
${texts} =    Create List
FOR    ${element}    IN    @{elements}
    ${text} =    Get Text    ${element}
    IF    $text    Append To List    ${texts}    ${text}    # needs Library Collections
END
```

Both are correct. The first is one round trip to the browser; the second is one
per element, plus one for `Get Elements`. On a page with a hundred links, that
difference is visible.

Returning an object works too, and arrives in Robot Framework as a dictionary:

```robot-repl
${links} =    Evaluate JavaScript    a
...    elements => {
...        const object = {}
...        elements.filter(e => e.innerText).forEach(e => object[e.innerText] = e.href)
...        return object
...    }
...    all_elements=True
```

::doc-note
Practise in your browser's devtools console before writing an extension: both
run in the page. One difference — the string you pass to `Evaluate JavaScript`
is compiled in Node first, so wrap what you paste in an arrow function,
`() => document.querySelectorAll('a').length`, rather than pasting a bare
expression. A bare one can be evaluated by Node and its *result* sent to the
page, which produces errors that make no sense, like
`ReferenceError: object is not defined`.
::
