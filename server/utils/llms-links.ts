/**
 * Links in the LLM exports are absolute (server/utils/llms.ts). Kept apart
 * from the rest so it imports nothing and can be unit-tested on its own.
 */

/**
 * Makes a relative link absolute, against the page's HTML URL.
 *
 * `/docs/x` gets the site's origin: a Markdown file read on its own — pasted
 * into a chat, fetched by an agent — has no base URL to resolve it against.
 * `#start` gets the page itself: the exports do not keep the HTML's anchor ids
 * (a `page-section`'s `id` becomes a plain heading), and in `llms-full.txt`
 * one document's `#x` would otherwise point into whichever document has it.
 */
export function absoluteUrl(href: string, pageUrl: string): string {
  // Already absolute (`https:`, `mailto:`) or protocol-relative: left as written.
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return href
  // Everything else — `/x`, `#x`, `./x`, `../x`, `x`, `?q` — as a browser on the page would.
  return new URL(href, pageUrl).href
}

/**
 * `absoluteUrl` over every `[text](link)` and `[text](link "title")` in
 * Markdown, leaving code fences and code spans alone.
 */
export function absoluteMarkdownLinks(markdown: string, pageUrl: string): string {
  return markdown
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) => (i % 2
      ? part
      : part.replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (_, href: string, title = '') => `](${absoluteUrl(href, pageUrl)}${title})`)))
    .join('')
}
