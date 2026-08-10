/**
 * On-this-page links, built from the body rather than from `body.toc`.
 *
 * Two reasons not to use the generated table of contents:
 *
 * 1. It nests. Nuxt Content collects h2 and h3 (`toc.depth: 2` selects the
 *    first two of h2..h6), but `generateToc` files each h3 under the h2 above
 *    it, so `toc.links` holds only h2s — which is why the rail used to stop at
 *    h2 while carrying a `.d3` rule that never matched.
 * 2. It flattens the text. `flattenNodeText` reduces a heading to a plain
 *    string, so `## \`Wait For Condition\`` arrives as prose and loses the
 *    monospace that tells the reader it is a keyword.
 *
 * The body keeps both: headings are top-level minimark nodes, `["h2", {id},
 * ...children]`, with the inline markup intact. Walking it gives document
 * order, real depth, and the original `code`/`strong`/`em` nodes for TocText
 * to render.
 */

/** A minimark node: `[tag, props, ...children]`. Children are nodes or text. */
export type MarkNode = string | [string, Record<string, unknown>, ...MarkNode[]]

export interface TocEntry {
  id: string
  depth: 2 | 3
  /** The heading's inline children, markup and all. */
  nodes: MarkNode[]
}

function tag(node: MarkNode): string | null {
  return Array.isArray(node) && typeof node[0] === 'string' ? node[0] : null
}

/**
 * Headings, in the order they appear.
 *
 * Only the top level is walked. Every heading in this site's content sits
 * there, and descending further would pull in headings written inside a
 * component — which belong to that component, not to the page outline.
 */
export function tocFromBody(body: MarkNode[] | undefined): TocEntry[] {
  const out: TocEntry[] = []
  for (const node of body ?? []) {
    const name = tag(node)
    if (name !== 'h2' && name !== 'h3') continue
    const [, props, ...children] = node as [string, Record<string, unknown>, ...MarkNode[]]
    const id = typeof props?.id === 'string' ? props.id : ''
    if (!id) continue
    out.push({ id, depth: name === 'h2' ? 2 : 3, nodes: children })
  }
  return out
}

/** The heading as plain text, for `title` and `aria-label`. */
export function tocPlainText(nodes: MarkNode[]): string {
  return nodes
    .map(n => (typeof n === 'string' ? n : tocPlainText((n as unknown[]).slice(2) as MarkNode[])))
    .join('')
}
