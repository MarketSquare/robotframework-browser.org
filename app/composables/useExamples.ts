/**
 * Example sources, read from disk at build time. Spec §6.4, §6.5.
 *
 * `import.meta.glob` with `?raw` inlines the file contents at build, so the
 * code rendered on the site is literally the file in examples/ — there is no
 * second, pasted copy to drift out of date. That drift is the specific problem
 * the old site had: a runnable `.robot` file and a Pygments-generated `.html`
 * snippet that were edited independently.
 */
/*
 * Scoped to comparison/ deliberately, and not to all of examples/.
 *
 * This glob is eager and reachable from the client, so every file it matches is
 * inlined into the browser bundle whether or not a page renders it. It was
 * `examples/**` once; vendoring the Python extension sources put 23 KB of
 * library code the site never renders over the bundle ceiling, and
 * `pnpm check:bundle` failed the build.
 *
 * Widen it only for files a component actually reads. Sources that exist to be
 * quoted in Markdown belong outside it — the fences are checked against them by
 * test/example-provenance.spec.ts, which runs at build time and ships nothing.
 */
const SOURCES = import.meta.glob('~/../examples/comparison/**/*.{robot,py,ts,js}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Keyed by path relative to examples/, e.g. `comparison/cypress/test.robot`. */
const byPath: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCES).map(([path, code]) => [path.replace(/^.*\/examples\//, ''), code]),
)

export function exampleSource(path: string): string {
  const code = byPath[path]
  if (code === undefined) {
    throw new Error(
      `No example at examples/${path}. Available: ${Object.keys(byPath).sort().join(', ')}`,
    )
  }
  return code.replace(/\s+$/, '')
}

export function exampleLineCount(path: string): number {
  return exampleSource(path).split('\n').length
}
