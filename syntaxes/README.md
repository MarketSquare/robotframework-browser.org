# Vendored grammars

Robot Framework TextMate grammars from
[robotcode](https://github.com/robotcodedev/robotcode/tree/main/syntaxes),
Apache-2.0. See `../NOTICE`.

| File | Shiki language | Use for |
|---|---|---|
| `robotframework.tmLanguage.json` | `robot` | Full suites, with `*** Settings ***` / `*** Test Cases ***` |
| `robotframework-repl.tmLanguage.json` | `robot-repl` | Bare keyword sequences — the shape of examples extracted from Libdoc |

Both were verified self-contained: neither `include`s an external scope, so
registering them together is sufficient and neither can silently degrade to
plain text through a missing dependency.

A third upstream file, `codeblock_robotframework.tmLanguage.json`, is a
Markdown *injection* that delegates ```` ```robot ```` fences to
`source.robotframework`. Shiki resolves languages itself, so it is not used.

## Updating

```bash
REF=<commit>
for f in robotframework.tmLanguage.json robotframework-repl.tmLanguage.json; do
  curl -sfL "https://raw.githubusercontent.com/robotcodedev/robotcode/$REF/syntaxes/$f" -o "syntaxes/$f"
done
echo "$REF" > syntaxes/.pinned-commit
pnpm test   # highlight.spec.ts will catch a grammar that stopped tokenising
```
