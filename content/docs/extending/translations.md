---
title: Translating keywords
description: Using a translation package to get keyword names and documentation in your language, and writing one for a language nobody has covered yet.
order: 4
section: extending
---

Browser's keyword names and documentation can be translated. `Click` becomes
`Klikkaa`, and the documentation your IDE shows on hover comes back in the same
language.

This page has two halves: using a translation that already exists, which is two
lines, and writing one, which is a small Python package.

::doc-note
Translating is a form of extending — a translation is a Python package that
Browser discovers through a plugin API — which is why it lives in this chapter
rather than under [Running it](/docs/operations/node-process).
::

## Using a translation

Install the package and name the language on import:

```robot
*** Settings ***
Library    Browser    language=fi
```

That is the whole thing. From that point the suite is written in translated
keyword names, and Libdoc, RobotCode and RIDE all show the translated
documentation.

## How Browser finds it

There is no registry and no configuration file. Browser searches the
[module search path](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#module-search-path)
for installed Python packages whose name starts with
`robotframework_browser_translation`, using the
[Python plugin API](https://packaging.python.org/en/latest/guides/creating-and-discovering-plugins/).
The naming convention *is* the discovery mechanism, so the prefix is not
optional.

Each package implements exactly one function, `get_language`, taking no
arguments and returning a dict with two keys:

```python
def get_language():
    return {
        "language": "fi",              # matched case-insensitively against language=
        "path": "/full/path/to/fi.json",  # the translation data
    }
```

`language` is compared against the `language=` import parameter, ignoring case.
`path` must be a full path to the translation file.

## The translation file

JSON. The name and extension do not matter — `path` says where it is.

The keys are **method names, not keyword names**. `Click` is implemented by a
method called `click`, so the key is `click`. This trips people up, and it is
deliberate: a keyword's name is the thing being translated, so it cannot also be
the thing used to look the translation up.

```json [fi.json]
{
  "__intro__": {
    "doc": "Selainkirjasto Robot Frameworkille."
  },
  "click": {
    "name": "Klikkaa",
    "doc": "Klikkaa elementtiä, joka vastaa valitsinta."
  },
  "fill_text": {
    "name": "Täytä Teksti",
    "doc": "Kirjoittaa tekstin syöttökenttään."
  }
}
```

Each entry may carry `name`, `doc`, or both. Providing only one is valid — a
package can translate names without translating documentation — but translating
both is what makes the library actually feel native, so do both if you can.

Two special keys are not keywords:

::doc-table
---
head:
  - Key
  - Translates
rows:
  - - "`__intro__`"
    - The library's own documentation, the introduction shown at the top of the
      keyword reference.
  - - "`__init__`"
    - The import parameters — what you see when you look up `Library    Browser`.
---
::

::doc-note{kind="warning"}
`__intro__` and `__init__` are not keywords, so their `name` must not be
translated. Set `doc` on them and leave `name` alone.
::

## Generating the template

Do not type the key list by hand. Browser will produce a complete, correctly
shaped file with the English text in place, ready to translate over:

```bash
rfbrowser translation /path/to/translation.json
```

The command translates nothing — it gives you every keyword, in the right format,
with nothing missing. Re-run it after a Browser upgrade and diff the result to
find keywords added since your last pass.

If your suites use plugins or JavaScript extensions, include their keywords too:

```bash
rfbrowser translation --plugings myplugin.SomePlugin \
    --jsextension /path/to/jsplugin.js /path/to/translation.json
```

::doc-note{kind="warning"}
The flag really is spelled `--plugings`. It is a typo that shipped and now cannot
be corrected without breaking everyone using it.
::

## A worked example

[robotframework-browser-translation-fi](https://github.com/MarketSquare/robotframework-browser-translation-fi)
is a complete, published translation package. It is small enough to read in one
sitting and is the fastest way to see the packaging, the entry point and the
JSON together.

If you translate Browser into a language nobody has covered, please publish it
and tell us — [the forum](https://forum.robotframework.org/c/libraries/browser)
is the right place, and we will link it from here.
