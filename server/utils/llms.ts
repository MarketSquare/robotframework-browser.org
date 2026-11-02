/**
 * The site as Markdown, for language models: the shared half of `/llms.txt`,
 * `/llms-full.txt` (server/plugins/llms.ts) and the per-page `/raw/<path>.md`
 * (server/routes/raw/[...slug].md.get.ts).
 *
 * Nuxt Content ships its own version of all three, switched off in
 * nuxt.config.ts (`content.llms: false`) for three reasons it cannot be talked
 * out of:
 *
 * - it prints `%%browser%%` literally — the tokens stay in the parsed content
 *   on purpose (app/utils/version-tokens.ts) and are only resolved on render;
 * - it lists pages in database order, not in the order the docs are read;
 * - it serves every page collection, the styleguide's `gallery` demos included.
 */
import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'
import type { MinimarkNode } from 'minimark'
import { stringify } from 'minimark/stringify'

import { RawBlocks, absoluteUrl, simplify } from './llms-components'

import { DOC_SECTIONS } from '../../app/utils/doc-sections'
import { resolveTokens } from '../../app/utils/version-tokens'

export const SITE = 'https://robotframework-browser.org'

/** The collections a reader can reach; `gallery` only feeds /styleguide. */
export const LLM_COLLECTIONS = ['pages', 'docs', 'why', 'releases'] as const
type LlmCollection = (typeof LLM_COLLECTIONS)[number]

export interface LlmPage {
  collection: LlmCollection
  /** Content path, which is also the raw path: `/docs/start/installation`. */
  path: string
  /** Where the page is rendered — not always `path`: `/why/cypress` is `/why/vs-cypress`. */
  url: string
  title: string
  description: string
  /** Docs chapter id, for grouping. */
  section?: string
}

/** `/raw/<path>.md`, with the landing page as `/raw/index.md`. */
export function rawPath(path: string): string {
  return `/raw${path === '/' ? '/index' : path}.md`
}

/** The rendered URL of a content document. */
function pageUrl(collection: LlmCollection, doc: { path: string; slug?: unknown }): string {
  return collection === 'why' ? `/why/${doc.slug}` : doc.path
}

/** A one-line summary per collection, from whichever field that collection has. */
function summary(collection: LlmCollection, doc: Record<string, unknown>): string {
  if (collection === 'why') return String(doc.tagline ?? '')
  if (collection === 'releases') return [doc.date, doc.headline].filter(Boolean).join('. ').replace(/`/g, '')
  return String(doc.description ?? '')
}

/** Compares `21.0.0` and `20.10.1` as versions, newest first. */
function byVersionDesc(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pb[i] ?? 0) - (pa[i] ?? 0)
    if (d) return d
  }
  return 0
}

/**
 * Every page, in reading order: landing page, the docs chapter by chapter, the
 * comparisons, the community page, then the release notes newest first.
 */
export async function llmPages(event: H3Event): Promise<LlmPage[]> {
  const [pages, docs, why, releases] = await Promise.all([
    queryCollection(event, 'pages').all(),
    queryCollection(event, 'docs').all(),
    queryCollection(event, 'why').all(),
    queryCollection(event, 'releases').all(),
  ])

  const entry = (collection: LlmCollection) => (doc: Record<string, unknown> & { path: string }): LlmPage => ({
    collection,
    path: doc.path,
    url: pageUrl(collection, doc),
    title: resolveTokens(String(doc.title ?? '')),
    description: resolveTokens(summary(collection, doc)),
    section: typeof doc.section === 'string' ? doc.section : undefined,
  })

  const chapter = (id: string) => DOC_SECTIONS.findIndex(s => s.id === id)

  return [
    ...pages.filter(p => p.path === '/').map(entry('pages')),
    ...[...docs]
      .sort((a, b) => chapter(a.section) - chapter(b.section) || a.order - b.order)
      .map(entry('docs')),
    ...[...why].sort((a, b) => a.order - b.order).map(entry('why')),
    ...pages.filter(p => p.path !== '/').map(entry('pages')),
    ...[...releases].sort((a, b) => byVersionDesc(a.version, b.version)).map(entry('releases')),
  ]
}

/** Looks a content path up in every collection a reader can reach. */
export async function findDocument(event: H3Event, path: string) {
  for (const collection of LLM_COLLECTIONS) {
    const doc = await queryCollection(event, collection).path(path).first()
    if (doc) return { collection, doc }
  }
  return null
}

type Doc = NonNullable<Awaited<ReturnType<typeof findDocument>>>

/** The facts a release note keeps in its frontmatter, which the body does not repeat. */
function releaseFacts(doc: Record<string, unknown>): MinimarkNode[] {
  const facts = [
    ['Released', doc.date],
    ['Playwright', doc.playwright],
    ['Supports', doc.supports],
  ].filter(([, v]) => v)
  return facts.length
    ? [['ul', {}, ...facts.map(([k, v]) => ['li', {}, ['strong', {}, String(k)], `: ${v}`] as MinimarkNode)]]
    : []
}

/**
 * One document as Markdown: title, its one-line summary, where it lives on the
 * site, then the body with every version token resolved.
 *
 * The body is minimark (`[tag, props, ...children]`). Its MDC components are
 * rewritten into plain Markdown first (server/utils/llms-components.ts), so
 * what comes out has no component tags in it.
 */
export async function documentMarkdown({ collection, doc }: Doc): Promise<string> {
  const resolved = resolveTokens(doc) as typeof doc & Record<string, unknown>
  const url = `${SITE}${pageUrl(collection, resolved)}`
  const raw = new RawBlocks()
  const body = await simplify(resolved.body.value as MinimarkNode[], {
    raw,
    pageUrl: url,
    example: async path => (await useStorage('assets:examples').getItem<string>(path)) ?? null,
  })

  const head: MinimarkNode[] = []
  if ((body[0] as unknown[] | undefined)?.[0] !== 'h1') head.push(['h1', {}, String(resolved.title)])
  const description = summary(collection, resolved)
  if (description) head.push(['blockquote', {}, description])
  head.push(['p', {}, 'Source: ', ['a', { href: url }, url]])
  if (collection === 'releases') head.push(...releaseFacts(resolved))

  const value = [...head, ...body].map(node => absoluteLinks(node, url))
  const markdown = stringify({ type: 'minimark', value }, { format: 'markdown/html' })
  return raw.splice(markdown).replace(/\n{3,}/g, '\n\n')
}

/** `absoluteUrl` (llms-components.ts) over every link and media source in a node. */
function absoluteLinks(node: MinimarkNode, url: string): MinimarkNode {
  if (typeof node === 'string') return node
  const [tag, props, ...children] = node
  const fixed: Record<string, unknown> = { ...props }
  for (const key of ['href', 'src', 'to', 'poster']) {
    const v = fixed[key]
    if (typeof v === 'string') fixed[key] = absoluteUrl(v, url)
  }
  return [tag, fixed, ...children.map(c => absoluteLinks(c, url))] as MinimarkNode
}
