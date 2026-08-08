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
  shortdoc: string
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

const ALLOWED_TAGS = [
  'p', 'a', 'code', 'pre', 'span', 'b', 'i', 'strong', 'em',
  'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'h3', 'h4', 'h5', 'br', 'hr',
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
 */
export function rewriteHref(href: string, ctx: RewriteContext): string | null {
  if (/^(https?:|mailto:)/.test(href)) return href

  if (href.startsWith('#')) {
    const target = decodeURIComponent(href.slice(1))

    if (target.startsWith('type-')) {
      const typeName = target.slice(5)
      return ctx.typeNames.has(typeName) ? `/keywords/types/${slug(typeName)}` : null
    }
    if (ctx.keywordNames.has(target)) return `/keywords/${slug(target)}`

    // A section of the library introduction.
    return `/keywords#${slug(target)}`
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
        typeHref: hasPage ? `/keywords/types/${slug(typedoc)}` : null,
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
      doc: await renderDoc(kw.doc, ctx, options.highlight),
      tags: [...new Set(kw.tags.map(normaliseTag))].sort(),
      group,
      groupSlug: slug(group),
      args,
      returnTypeName: kw.returnType?.name ?? null,
      returnTypeHref: returnHasPage ? `/keywords/types/${slug(returnTypedoc)}` : null,
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

  return {
    version: spec.version,
    libraryName: spec.name,
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
