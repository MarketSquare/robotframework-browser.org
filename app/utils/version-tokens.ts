import LIBDOC from '~/generated/libdoc.json'
import VERSIONS from '~/generated/versions.json'
import PROJECT from '~/../content/project.json'

/**
 * `%%browser%%` and friends, resolved when the page renders.
 *
 * These used to be substituted in a `content:file:beforeParse` hook, which
 * rewrote the Markdown source before it was parsed. That made the parsed
 * content and the file on disk disagree, and any editor that round-trips
 * through the parsed side wrote the substituted value back: opening a page in
 * Nuxt Studio — without editing or saving — rewrote `%%browser%%` to `20.3.0`
 * in the file, permanently. A token that only exists before parsing cannot
 * survive a save.
 *
 * So the tokens now stay in the source, all the way through the content
 * pipeline, and are resolved here on the way to `<ContentRenderer>`. Studio
 * reads and writes a file that still says `%%browser%%`, which is the whole
 * point; the version it shows in its own preview is the literal token, and
 * that is fine.
 *
 * Resolving the whole document rather than only its body is deliberate:
 * frontmatter carries tokens too (`comparedAgainst: Cypress 15, Browser
 * %%browser%%`), and pages read those fields directly.
 *
 * An unknown token is left alone rather than thrown on, because a render-time
 * throw takes the page down for a typo. `test/versions.spec.ts` fails the build for
 * one instead, which is where the old hook's loud failure went.
 */
const TOKEN = /%%(\w+)%%/g

/*
 * Three sources, one table.
 *
 * versions.json is the library's own numbers; project.json the two that live on
 * someone else's server, refreshed by hand with `pnpm project`; and the keyword
 * count is simply the length of the index the reference page already ships, so
 * it cannot drift from the reference itself. Nothing here adds to the client
 * bundle that was not in it already.
 */
const TABLE: Record<string, unknown> = {
  ...(VERSIONS as unknown as Record<string, unknown>),
  /*
   * Stringified on the way in. project.json holds these as numbers, and a
   * lookup that only accepts strings silently leaves `%%stars%%` in the page —
   * which is exactly what it did.
   */
  stars: String(PROJECT.stars),
  releases: String(PROJECT.releases),
  contributors: String(PROJECT.contributors),
  keywords: String(LIBDOC.index.length),
}

/** Every `%%name%%` in `text` that names a version we hold. */
export function resolveTokenString(text: string): string {
  if (!text.includes('%%')) return text
  return text.replace(TOKEN, (whole, name: string) =>
    typeof TABLE[name] === 'string' ? (TABLE[name] as string) : whole,
  )
}

/**
 * The same, over every string in a parsed document.
 *
 * Structure-preserving: arrays stay arrays, objects keep their keys, and
 * anything that is not a string is returned untouched. The parsed body is
 * minimark — nested arrays of `[tag, props, ...children]` — so one recursive
 * walk covers prose, component props, YAML block props and the text inside a
 * highlighted code fence alike.
 */
export function resolveTokens<T>(value: T): T {
  if (typeof value === 'string') return resolveTokenString(value) as unknown as T
  if (Array.isArray(value)) return value.map(resolveTokens) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = resolveTokens(v)
    return out as unknown as T
  }
  return value
}
