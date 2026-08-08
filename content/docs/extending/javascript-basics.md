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

const add = (a, b) => a + b        // must be defined before use
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

An `async` function returns a promise. `await` waits for one. Forgetting `await`
gives you a `Promise` object where you expected a value — if a JS extension
returns something that looks like `{}`, this is usually why.

## Evaluate JavaScript

You can run page-side JavaScript from Robot Framework directly, which is often
enough without writing an extension at all.

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
    IF    $text    Append To List    ${texts}    ${text}
END
```

Both are correct. The first is one round trip to the browser; the second is one
per element. On a page with a hundred links, that difference is visible.

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
Practise in your browser's devtools console before writing an extension. Open
F12, paste the expression, and see what comes back — that is the same
environment `Evaluate JavaScript` runs in.
::
