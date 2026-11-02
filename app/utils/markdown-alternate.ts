/**
 * `<link rel="alternate" type="text/markdown">` to a page's Markdown twin, so
 * an agent that fetched the HTML can find the version written for it. The
 * Markdown files themselves are built by server/ (see CONTRIBUTING.md, "The
 * site for language models"); `/raw/<content path>.md` for a content page,
 * `/keywords.md` for the current keyword reference.
 *
 * Takes the *content* path, not the route: `/why/vs-cypress` is the content
 * file `/why/cypress`, and the Markdown is named after the file.
 */
export function markdownAlternate(contentPath: string | undefined) {
  if (!contentPath) return []
  const href = contentPath === '/keywords.md'
    ? contentPath
    : `/raw${contentPath === '/' ? '/index' : contentPath}.md`
  return [{ rel: 'alternate', type: 'text/markdown', href }]
}
