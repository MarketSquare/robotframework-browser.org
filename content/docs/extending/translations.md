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
keyword names, and Libdoc shows the translated documentation — as do the editors
that read Libdoc output.

## How Browser finds it

There is no registry and no configuration file. Browser searches the
[module search path](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#module-search-path)
for installed Python packages whose name starts with
`robotframework_browser_translation`, using the
[Python plugin API](https://packaging.python.org/en/latest/guides/creating-and-discovering-plugins/).
The naming convention *is* the discovery mechanism, so the prefix is not
optional.

Each package implements exactly one function, `get_language`, taking no
arguments and returning a **list of dicts** — one entry per language the package
declares:

```python
from pathlib import Path

def get_language() -> list:
    here = Path(__file__).parent.absolute()
    return [
        {
            "language": "fi",          # matched case-insensitively against language=
            "path": here / "fi.json",  # the translation data
        },
    ]
```

::doc-note{kind="warning"}
It must be a list. Browser iterates the return value and ignores anything that
is not a list — a bare dict is dropped **silently**, with no warning, and your
suite runs in English as though the package were not installed. The same is true
of a misnamed function or a `language=` nobody declares.
::

`language` is compared against the `language=` import parameter, ignoring case.
`path` may be a string or a `Path`, and a relative one is resolved against the
working directory — so build it from `Path(__file__).parent` rather than writing
it by hand.

## The translation file

JSON. The name and extension do not matter — `path` says where it is.

The keys are **method names, not keyword names**. `Click` is implemented by a
method called `click`, so the key is `click`. This trips people up, and it is
deliberate: a keyword's name is the thing being translated, so it cannot also be
the thing used to look the translation up.

```json [fi.json]
{
  "__intro__": {
    "doc": "Selainkirjasto Robot Frameworkille.",
    "sha256": "b1946ac92492d2347c6235b4d2611184"
  },
  "click": {
    "name": "Klikkaa",
    "doc": "Klikkaa elementtiä, joka vastaa valitsinta.",
    "sha256": "3a7bd3e2360a3d29eea436fcfb7e44c7"
  },
  "fill_text": {
    "name": "Täytä Teksti",
    "doc": "Kirjoittaa tekstin syöttökenttään.",
    "sha256": "9f2feb8255f4b3d1d0f2a4a3b1c7e0d9"
  }
}
```

The `sha256` is written by the generator. It is a checksum of the **English**
documentation the entry was translated from — encoded as UTF-16, which is worth
knowing only if you ever compute one yourself. Leave it alone; it is what
`--compare` uses to tell you which docs have changed since you translated them.

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

::doc-note{kind="note"}
`__intro__` and `__init__` are not keywords, so only their `doc` is used. The
generator leaves their `name` as it found it, and so should you — nothing reads
it as a keyword name.
::

## Generating the template

Do not type the key list by hand. Browser will produce a complete, correctly
shaped file with the English text in place, ready to translate over:

```bash
rfbrowser translation /path/to/translation.json
```

The command translates nothing — it gives you every keyword, in the right format,
with nothing missing.

After a Browser upgrade, do not diff by hand. Every generated entry carries a
`sha256` of the English documentation it was translated from, and `--compare`
uses it:

```bash
rfbrowser translation --compare /path/to/translation.json
```

It writes nothing. It prints a table of what changed: keywords missing a
translation, entries whose documentation checksum no longer matches, entries
with no checksum at all, and keywords that have left the library. Nothing
validates that checksum at runtime — it exists only for this comparison.

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
is a published translation package, small enough to read in one sitting, and a
good model for the packaging and the JSON.

::doc-note{kind="warning"}
Do not copy its `get_language` as it stands. It returns a bare dict, which
current Browser ignores silently — wrap the dict in a list, as above, and it
works.
::

If you translate Browser into a language nobody has covered, please publish it
and tell us — [the forum](https://forum.robotframework.org/c/libraries/browser)
is the right place, and we will link it from here.
