#!/usr/bin/env bash
#
# Generates content/libdoc/Browser-<version>.json for a released version of the
# library, which is what the keyword pages are rendered from.
#
#   scripts/fetch-libdoc.sh 20.3.0            # add a version
#   scripts/fetch-libdoc.sh 20.3.0 --latest   # ...and make it the current one
#
# Libdoc imports the library and reads its keywords by introspection, so this
# needs the Python package — and only that. It does NOT need `rfbrowser init`,
# Node, Playwright or any browser: no keyword is executed. A run takes seconds.
#
# The environment is ephemeral and built by uv, so nothing is installed into
# whatever Python you happen to be using, and the version generated is exactly
# the version asked for rather than the one that is lying around.
#
# ROBOT FRAMEWORK IS FLOORED, NOT PINNED, AND THE FLOOR MATTERS.
#
# Libdoc's type documentation comes from the Robot Framework doing the
# introspecting, not from the library. Generating Browser 20.3.0 with RF 7.3.2
# silently produces a *valid* file that is missing the `Secret` and `Mapping`
# type pages — no error, no warning, two fewer documents on the site. RF 7.4.1
# reproduces the committed file exactly.
#
# So this floors rather than pins: an older RF loses documentation, while a
# newer one has only ever added it. If a future release needs a higher floor,
# raise it here.
set -euo pipefail

RF_SPEC="${RF_SPEC:-robotframework>=7.4}"

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "usage: $0 <version> [--latest]" >&2
  exit 64
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 69
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/content/libdoc/Browser-$VERSION.json"

echo "libdoc: Browser $VERSION ($RF_SPEC)"

uv run --quiet --python 3.12 \
  --with "robotframework-browser==$VERSION" \
  --with "$RF_SPEC" \
  python -m robot.libdoc Browser "$OUT"

# Make the file machine-independent.
#
# Libdoc records each keyword's `source` as an absolute path, so it points into
# whatever throwaway environment generated it. Regenerating the same version on
# a different machine therefore produces a diff of ~150 changed lines that mean
# nothing, which is exactly the noise that makes a release PR unreviewable.
#
# The renderer only ever takes basename(source), so rewriting these to a
# repo-relative form loses nothing. Done as text rather than by re-encoding the
# JSON, because re-dumping would reformat all 800 KB and defeat the purpose.
python3 - "$OUT" <<'PY'
import re, sys

path = sys.argv[1]
text = open(path, encoding='utf8').read()
text, n = re.subn(r'"[^"]*?(Browser/[A-Za-z0-9_./-]*\.py)"', r'"\1"', text)
open(path, 'w', encoding='utf8').write(text)
print(f'normalised {n} source paths')
PY

# Fail rather than commit a file describing a different version than its name
# claims — a typo in the argument would otherwise pass silently, and the site
# would serve one version's keywords under another's URL.
ACTUAL="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['version'])" "$OUT")"
if [ "$ACTUAL" != "$VERSION" ]; then
  rm -f "$OUT"
  echo "asked for $VERSION but libdoc reported $ACTUAL" >&2
  exit 65
fi

if [ "${2:-}" = "--latest" ]; then
  echo "$VERSION" > "$ROOT/content/libdoc/LATEST"
  echo "LATEST → $VERSION"
fi

echo "wrote content/libdoc/Browser-$VERSION.json"
