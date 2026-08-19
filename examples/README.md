# Examples

Runnable sources, read from disk at build time and highlighted with Shiki.

The old site kept two copies of every example — the runnable file and a
Pygments-generated `.html` snippet pasted into a Vue component — and they
drifted. Nothing here is ever pasted anywhere: `/compare` and the landing page
read these files directly, so the code on the site is the code that runs.

`comparison/<tool>/` holds the same scenario written for Browser and for that
tool, taken from the previous site's `examples/` directory.

`python-extension/` is different in one way: a Markdown fence cannot read from
disk the way `<Comparison>` does, so the two extension pages quote those files
and `test/example-provenance.spec.ts` fails the build when a quote and its file
disagree. Same rule, enforced instead of mechanised. See the README in there.
