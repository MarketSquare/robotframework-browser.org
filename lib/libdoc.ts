/**
 * Libdoc JSON -> the site's own keyword reference. Spec §7.
 *
 * BUILD ONLY. Lives outside app/ so it can never be pulled into a client
 * bundle. Pages consume the JSON this emits, never this module.
 *
 * Verified against a real generated file (RF 7.4.2, Browser 20.2.0,
 * specversion 3, 151 keywords, 81 typedocs, 0.83 MB).
 */
import { basename } from 'node:path'
import sanitizeHtml from 'sanitize-html'

/** The shape libdoc actually emits. */
export interface LibdocType {
  name: string
  typedoc: string | null
  nested: LibdocType[]
  union: boolean
}

export interface LibdocArg {
  name: string
  type: LibdocType | null
  defaultValue: string | null
  kind: 'POSITIONAL_OR_NAMED' | 'NAMED_ONLY' | 'VAR_POSITIONAL' | 'VAR_NAMED' | 'NAMED_ONLY_MARKER'
  required: boolean
  repr: string
}

export interface LibdocKeyword {
  name: string
  args: LibdocArg[]
  returnType: LibdocType | null
  doc: string
  shortdoc: string
  tags: string[]
  source: string | null
  lineno: number
}

export interface LibdocTypedoc {
  type: 'Enum' | 'TypedDict' | 'Standard' | 'Custom'
  name: string
  doc: string
  usages: string[]
  accepts: string[]
  members?: { name: string; value: string }[]
  items?: { key: string; type: string; required: boolean }[]
}

export interface LibdocSpec {
  specversion: number
  name: string
  version: string
  doc: string
  docFormat: string
  keywords: LibdocKeyword[]
  typedocs: LibdocTypedoc[]
}

/** What the site renders. */
export interface ResolvedArg {
  name: string
  /** As libdoc printed it, e.g. `button: MouseButton = left`. */
  repr: string
  typeName: string | null
  /** Route to the type page, when the type has its own typedoc. */
  typeHref: string | null
  defaultValue: string | null
  required: boolean
  /** `*args`, `**kwargs` or a named-only marker are not ordinary arguments. */
  variadic: 'positional' | 'named' | null
  namedOnly: boolean
}

export interface ResolvedKeyword {
  name: string
  slug: string
  /** Plain text, for meta descriptions and search. */
  shortdoc: string
  /** The same sentence with Robot Framework's inline markup rendered. */
  shortdocHtml: string
  /** Sanitized, link-rewritten, syntax-highlighted HTML. */
  doc: string
  tags: string[]
  group: string
  groupSlug: string
  args: ResolvedArg[]
  returnTypeName: string | null
  returnTypeHref: string | null
  sourceUrl: string | null
  lineno: number
}

export interface ResolvedType {
  name: string
  slug: string
  /** Collision-proof in-page anchor. See typeAnchor. */
  anchor: string
  kind: LibdocTypedoc['type']
  doc: string
  accepts: string[]
  members: { name: string; value: string }[]
  items: { key: string; type: string; required: boolean }[]
  /** Keywords that take or return this type, as links. */
  usedBy: { name: string; slug: string }[]
}

export interface IndexEntry {
  name: string
  slug: string
  shortdoc: string
  shortdocHtml: string
  group: string
  groupSlug: string
  tags: string[]
  argCount: number
}

export interface GroupEntry {
  name: string
  slug: string
  module: string
  count: number
}

export interface TransformResult {
  version: string
  libraryName: string
  /** The library-level documentation: selectors, assertions, waiting. */
  intro: string
  introSections: { title: string; slug: string; level: number }[]
  keywords: ResolvedKeyword[]
  types: ResolvedType[]
  index: IndexEntry[]
  groups: GroupEntry[]
  warnings: string[]
}

export const SPEC_VERSION = 3

export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Anchor for a data type.
 *
 * The separator is a DOUBLE hyphen, and that is load-bearing. With a single
 * one, the type `Secret` and the keyword `Type Secret` both produce
 * `type-secret`: a duplicate id, an unreachable anchor, and a filter that
 * cannot tell a keyword from a type. `slug()` collapses every run of
 * non-alphanumerics to a single hyphen, so it can never emit `--`, which
 * makes this prefix collision-proof by construction rather than by luck.
 */
export function typeAnchor(name: string): string {
  return `type--${slug(name)}`
}

/**
 * Tags are cross-cutting labels, not a hierarchy, and upstream is not perfectly
 * consistent: `Download` carries `Page Content` while 82 other keywords carry
 * `PageContent`. Normalising defensively here means one stray space upstream
 * cannot fork a tag filter into two.
 */
export function normaliseTag(tag: string): string {
  return tag.replace(/\s+/g, '')
}

/** Title-cases a module filename for a group that has no explicit mapping. */
export function moduleToName(module: string): string {
  return basename(module, '.py')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * `shortdoc` is the only field libdoc leaves as raw text: `doc` is rendered to
 * HTML, but the one-line summary keeps Robot Framework's own inline markup.
 * Left alone it renders as literal ``selector`` on all 151 keyword pages and
 * again on the index.
 *
 * Robot Framework's inline syntax is ``code``, *bold* and _italic_.
 */
export function renderInline(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return (
    escaped
      .replace(/``([^`]+)``/g, '<code>$1</code>')
      /*
       * The `(?!\*)` / `(?<!\*)` guards matter: without them `*** Test Cases ***`
       * — which appears in plenty of summaries — parses as bold-asterisk-bold.
       */
      .replace(/(^|\s)\*(?!\*)([^*]+?)(?<!\*)\*(?=\s|$|[.,;:!?])/g, '$1<b>$2</b>')
      .replace(/(^|\s)_(?!_)([^_]+?)(?<!_)_(?=\s|$|[.,;:!?])/g, '$1<i>$2</i>')
  )
}

const ALLOWED_TAGS = [
  'p', 'a', 'code', 'pre', 'span', 'b', 'i', 'strong', 'em',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'h2', 'h3', 'h4', 'h5', 'br', 'hr',
]

export interface RewriteContext {
  keywordNames: Set<string>
  typeNames: Set<string>
}

/**
 * Libdoc's HTML links are all fragments into its own single-page output.
 * 618 of them across 129 distinct targets:
 *   `#Add%20Cookie`  -> another keyword
 *   `#type-Proxy`    -> a type
 *   `#Assertions`    -> a section of the library introduction
 * Everything else is either absolute or, in four upstream cases, a broken
 * relative href (`create`, `install`, `Secret`).
 *
 * The reference is one scrolling page, so these stay fragments — which also
 * means an upstream link and ours resolve to the same shape. Anchors keep
 * deep links working: /keywords#click is as pasteable as a route was.
 */
export function rewriteHref(href: string, ctx: RewriteContext): string | null {
  if (/^(https?:|mailto:)/.test(href)) return href

  if (href.startsWith('#')) {
    const target = decodeURIComponent(href.slice(1))

    if (target.startsWith('type-')) {
      const typeName = target.slice(5)
      return ctx.typeNames.has(typeName) ? `#${typeAnchor(typeName)}` : null
    }
    if (ctx.keywordNames.has(target)) return `#${slug(target)}`

    // A section of the library introduction.
    return `#${slug(target)}`
  }

  // Relative and scheme-odd hrefs (chrome://version, and upstream's broken
  // `create` / `install` / `Secret`). Unlinking is better than a 404.
  return null
}

export interface TransformOptions {
  /** Re-highlights `<pre>` blocks. Injected so this module stays Shiki-free. */
  highlight: (code: string) => Promise<string>
  /** Group display names, keyed by module filename. */
  groups: { module: string; name: string }[]
  /** For source links, e.g. the library repo at a tag. */
  sourceBase?: string
}

/** Decodes the entities sanitize-html leaves behind, for `<pre>` content. */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

export async function transform(
  spec: LibdocSpec,
  options: TransformOptions,
): Promise<TransformResult> {
  if (spec.specversion !== SPEC_VERSION) {
    throw new Error(
      `Libdoc specversion ${spec.specversion} is not ${SPEC_VERSION}. The shape ` +
        `this transform relies on may have changed — re-read the generated JSON ` +
        `before bumping this.`,
    )
  }

  const warnings: string[] = []

  const keywordNames = new Set(spec.keywords.map(k => k.name))
  const typeNames = new Set(spec.typedocs.map(t => t.name))
  const ctx: RewriteContext = { keywordNames, typeNames }

  const groupName = new Map(options.groups.map(g => [g.module, g.name]))
  const groupOrder = new Map(options.groups.map((g, i) => [g.module, i]))

  /** Which keywords mention each type, for the reverse index. */
  const typeUsage = new Map<string, { name: string; slug: string }[]>()

  const keywords: ResolvedKeyword[] = []

  for (const kw of spec.keywords) {
    const module = kw.source ? basename(kw.source) : 'unknown.py'
    let group = groupName.get(module)
    if (!group) {
      group = moduleToName(module)
      warnings.push(
        `module "${module}" has no entry in content/keyword-groups.json; ` +
          `falling back to "${group}"`,
      )
      groupName.set(module, group)
    }

    const args: ResolvedArg[] = []
    let namedOnly = false

    for (const arg of kw.args) {
      // The bare `*` separator: everything after it is named-only. It is a
      // marker, not an argument, and must not become a table row.
      if (arg.kind === 'NAMED_ONLY_MARKER') {
        namedOnly = true
        continue
      }
      if (arg.kind === 'NAMED_ONLY') namedOnly = true

      const typeName = arg.type?.name ?? null
      const typedoc = arg.type?.typedoc ?? null
      const hasPage = typedoc !== null && typeNames.has(typedoc)

      if (hasPage) {
        const list = typeUsage.get(typedoc) ?? []
        if (!list.some(e => e.name === kw.name)) list.push({ name: kw.name, slug: slug(kw.name) })
        typeUsage.set(typedoc, list)
      }

      args.push({
        name: arg.name,
        repr: arg.repr,
        typeName,
        typeHref: hasPage ? `#${typeAnchor(typedoc)}` : null,
        defaultValue: arg.defaultValue,
        required: arg.required,
        variadic:
          arg.kind === 'VAR_POSITIONAL' ? 'positional' : arg.kind === 'VAR_NAMED' ? 'named' : null,
        namedOnly: arg.kind === 'NAMED_ONLY',
      })
    }

    const returnTypedoc = kw.returnType?.typedoc ?? null
    const returnHasPage = returnTypedoc !== null && typeNames.has(returnTypedoc)

    keywords.push({
      name: kw.name,
      slug: slug(kw.name),
      shortdoc: kw.shortdoc,
      shortdocHtml: renderInline(kw.shortdoc),
      doc: await renderDoc(kw.doc, ctx, options.highlight),
      tags: [...new Set(kw.tags.map(normaliseTag))].sort(),
      group,
      groupSlug: slug(group),
      args,
      returnTypeName: kw.returnType?.name ?? null,
      returnTypeHref: returnHasPage ? `#${typeAnchor(returnTypedoc)}` : null,
      sourceUrl:
        options.sourceBase && kw.source
          ? `${options.sourceBase}/Browser/keywords/${basename(kw.source)}#L${kw.lineno}`
          : null,
      lineno: kw.lineno,
    })
    void namedOnly
  }

  const types: ResolvedType[] = await Promise.all(
    spec.typedocs.map(async t => ({
      name: t.name,
      slug: slug(t.name),
      anchor: typeAnchor(t.name),
      kind: t.type,
      doc: await renderDoc(t.doc ?? '', ctx, options.highlight),
      accepts: t.accepts ?? [],
      members: t.members ?? [],
      items: t.items ?? [],
      usedBy: (typeUsage.get(t.name) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    })),
  )

  const index: IndexEntry[] = keywords.map(k => ({
    name: k.name,
    slug: k.slug,
    shortdoc: k.shortdoc,
    shortdocHtml: k.shortdocHtml,
    group: k.group,
    groupSlug: k.groupSlug,
    tags: k.tags,
    argCount: k.args.length,
  }))

  const byGroup = new Map<string, GroupEntry>()
  for (const kw of spec.keywords) {
    const module = kw.source ? basename(kw.source) : 'unknown.py'
    const name = groupName.get(module)!
    const entry = byGroup.get(name) ?? { name, slug: slug(name), module, count: 0 }
    entry.count++
    byGroup.set(name, entry)
  }

  const groups = [...byGroup.values()].sort(
    (a, b) => (groupOrder.get(a.module) ?? 999) - (groupOrder.get(b.module) ?? 999),
  )

  /*
   * The library introduction explains selectors, assertions and waiting, and
   * 618 links in the keyword docs point into it. Libdoc's HTML gives its <h3>
   * headings no ids, so those links resolved nowhere — the ids are added here.
   *
   * Titles repeat (the introduction has two "Examples" sections), so slugs are
   * de-duplicated with a numeric suffix, which is what every Markdown renderer
   * does and what the incoming links already assume: the first wins.
   */
  const renderedIntro = await renderDoc(spec.doc ?? '', ctx, options.highlight)
  const introSections: { title: string; slug: string; level: number }[] = []
  const usedSlugs = new Map<string, number>()

  const intro = renderedIntro.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/g, (_all, tag, attrs, inner) => {
    const title = String(inner).replace(/<[^>]+>/g, '').trim()
    const base = slug(title)
    const n = (usedSlugs.get(base) ?? 0) + 1
    usedSlugs.set(base, n)
    const id = n === 1 ? base : `${base}-${n}`
    introSections.push({ title, slug: id, level: tag === 'h2' ? 2 : 3 })
    return `<${tag} id="${id}"${attrs}>${inner}</${tag}>`
  })

  return {
    version: spec.version,
    libraryName: spec.name,
    intro,
    introSections,
    keywords,
    types,
    index,
    groups,
    warnings,
  }
}

/**
 * `docFormat` is HTML: libdoc has already rendered the docstring. So this
 * sanitizes and rewrites rather than parsing markup — then re-highlights the
 * `<pre>` blocks, which are bare keyword sequences and therefore need the
 * repl grammar rather than the full-suite one.
 */
export async function renderDoc(
  html: string,
  ctx: RewriteContext,
  highlight: (code: string) => Promise<string>,
): Promise<string> {
  if (!html) return ''

  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    // rel and target must be allowed or the sanitizer strips them straight
    // back off the external links transformTags has just added.
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      td: ['colspan'],
      th: ['colspan'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ? rewriteHref(attribs.href, ctx) : null
        if (!href) return { tagName: 'span', attribs: {} }
        const external = /^https?:/.test(href)
        return {
          tagName: 'a',
          attribs: external
            ? { href, rel: 'noopener noreferrer', target: '_blank' }
            : { href },
        }
      },
    },
  })

  // Re-highlight code blocks through our own theme.
  const blocks = [...clean.matchAll(/<pre>([\s\S]*?)<\/pre>/g)]
  let out = clean
  for (const [full, body] of blocks) {
    const code = decodeEntities(body!.replace(/<[^>]+>/g, ''))
    const highlighted = await highlight(code)
    out = out.replace(full, `<pre class="doc-code">${highlighted}</pre>`)
  }
  return out
}
