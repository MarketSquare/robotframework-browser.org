# Extending Browser from Python — the demonstration sources

Vendored from `atest/test/13_Python_Extension/` in the
[Browser library](https://github.com/MarketSquare/robotframework-browser), which
is where they run. They back two pages:

- `content/docs/extending/python-libraries.md`
- `content/docs/extending/browser-as-a-base.md`

Those pages quote these files, and `test/example-provenance.spec.ts` fails the
build if a quoted block stops being a verbatim substring of the file it names.
That check is the whole reason the copies are here: this site cannot run Python,
so a pasted example has nothing holding it to the code it came from, and
`CONTRIBUTING.md` promises a contributor here needs neither Python nor a
checkout of the library.

The evidence for what the pages *claim* — which behaviour is measured by which
test, and which is read from source and never executed — is vendored too, in
`docs/research/python-extension-contexts.md`.

## What each file is

| | |
|---|---|
| `MyLibraryA.py` | Robot Framework imports Browser; this library sits alongside it and looks the instance up. |
| `MyLibraryB.py` | Robot Framework imports only this library, which constructs Browser and registers it as a listener. |
| `MyLibraryB_no_listener.py` | The same library without that registration. The difference between the two runs is what the registration buys. |
| `context_a.robot`, `context_b.robot`, `context_b_no_listener.robot` | The suites that exercise them. Some of their tests are **expected to fail** — the failures are the demonstration. |
| `python_extension.robot` | The parent suite. Pure orchestration: it runs the three above as child processes and asserts their exit codes, output directories and logs. |

## Do not edit these to fix the site

They are a copy. A change belongs in the library, where the tests prove it, and
comes back here as a re-copy — otherwise the site starts documenting code that
exists nowhere. If a quote and a file here disagree, the file is right.
