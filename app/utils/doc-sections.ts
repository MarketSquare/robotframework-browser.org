/**
 * Chapter order and display names of the docs.
 *
 * Ordering is a property of the whole set, so it lives here rather than in each
 * file's frontmatter — deriving it from a number in every file means
 * renumbering several files to insert one page. Read by the docs shell
 * (sidebar, prev/next) and by the Markdown exports for LLMs (`server/`), so
 * both list the chapters in the same order.
 */
export const DOC_SECTIONS: { id: string; name: string }[] = [
  { id: 'start', name: 'Getting started' },
  { id: 'concepts', name: 'Core concepts' },
  { id: 'recording', name: 'Recording keywords' },
  { id: 'mobile', name: 'Mobile web' },
  { id: 'extending', name: 'Extending Browser' },
  { id: 'operations', name: 'Running it' },
]
