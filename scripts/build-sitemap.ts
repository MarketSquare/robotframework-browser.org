/**
 * Writes sitemap.xml from what was actually prerendered.
 *
 * Derived from the output rather than from a route list, so it cannot claim a
 * page that does not exist or miss one that does — the routes come from
 * content and from the version data, and any hand-maintained list would drift
 * the first time somebody adds a release note.
 *
 * Runs after `nuxt generate`, as part of `pnpm generate`.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const DIST = join(ROOT, '.output/public')
const SITE = 'https://robotframework-browser.org'

/** Every directory holding an index.html is a page. */
function pages(dir = DIST, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Build output and payload plumbing are not pages.
      if (entry.name === '_nuxt' || entry.name === '__nuxt_island' || entry.name.startsWith('_')) continue
      pages(path, found)
    }
    else if (entry.name === 'index.html') {
      found.push(path)
    }
  }
  return found
}

/**
 * `/keywords/<latest>` is the same document as `/keywords` and says so with a
 * canonical link, so listing both would offer two URLs for one page. Every
 * *older* version is a genuinely different document and belongs in the map —
 * excluding them all was the first version of this, and it would have hidden
 * eleven pages from search.
 */
const LATEST = readFileSync(join(ROOT, 'content/libdoc/LATEST'), 'utf8').trim()
const canonicalDuplicate = (url: string) => url === `/keywords/${LATEST}`

/**
 * /styleguide stays reachable — CONTRIBUTING.md links it, and it is the only
 * accurate reference for the MDC components because it renders each one beside
 * its own source. But it documents the site to whoever is editing it, which is
 * not what someone searching for Browser is looking for. Unlisted in the
 * navigation for the same reason.
 */
const internal = (url: string) => url === '/styleguide'

const urls = pages()
  .map(file => `/${relative(DIST, file).replace(/index\.html$/, '')}`.replace(/\/$/, '') || '/')
  .filter(url => !canonicalDuplicate(url) && !internal(url))
  .sort()

/*
 * One date for the whole build. Per-file mtimes would change on every rebuild
 * whether or not the page did, which teaches a crawler to ignore the field.
 */
const today = statSync(join(DIST, 'index.html')).mtime.toISOString().slice(0, 10)

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(url => `  <url><loc>${SITE}${url === '/' ? '/' : url}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  '',
].join('\n')

writeFileSync(join(DIST, 'sitemap.xml'), xml)
console.log(`sitemap.xml → ${urls.length} pages`)
