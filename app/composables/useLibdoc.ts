import libdoc from '~/generated/libdoc.json'

/**
 * The keyword reference's data access. Spec §7.2, §7.4.
 *
 * The index and group structure are imported at build time — 36 KB, needed by
 * every page for the rail and search. Individual keyword and type payloads are
 * loaded per page, so the 0.83 MB spec is never shipped whole.
 *
 * Latest is prerendered. Older versions are fetched from /libdoc/<version>/
 * on demand and rendered by the same components (D5), which is why this reads
 * from disk during prerender but over HTTP in the browser.
 */
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

export const LATEST_VERSION = libdoc.version
export const LIBRARY_NAME = libdoc.libraryName

export interface TypeEntry {
  name: string
  slug: string
  anchor: string
  kind: 'Enum' | 'TypedDict' | 'Standard' | 'Custom'
  usedByCount: number
}

export interface IntroSection {
  title: string
  slug: string
  level: number
}

export function useKeywordIndex() {
  return {
    index: libdoc.index as IndexEntry[],
    groups: libdoc.groups as GroupEntry[],
    types: libdoc.types as TypeEntry[],
    introSections: libdoc.introSections as IntroSection[],
    version: LATEST_VERSION,
  }
}

/**
 * Reads a generated payload. During prerender this comes off disk: the files
 * live in public/ and are not yet being served, so an HTTP fetch would fail.
 */
async function loadPayload<T>(path: string): Promise<T> {
  if (import.meta.server) {
    const { readFile } = await import('node:fs/promises')
    const { join } = await import('node:path')
    return JSON.parse(await readFile(join(process.cwd(), 'public', path), 'utf8')) as T
  }
  return $fetch<T>(`/${path}`)
}

export function useKeyword(slug: string, version = LATEST_VERSION) {
  return useAsyncData(`kw-${version}-${slug}`, () =>
    loadPayload<ResolvedKeyword>(`libdoc/${version}/keywords/${slug}.json`),
  )
}

export function useKeywordType(slug: string, version = LATEST_VERSION) {
  return useAsyncData(`type-${version}-${slug}`, () =>
    loadPayload<ResolvedType>(`libdoc/${version}/types/${slug}.json`),
  )
}

export interface ResolvedArg {
  name: string
  repr: string
  typeName: string | null
  typeHref: string | null
  defaultValue: string | null
  required: boolean
  variadic: 'positional' | 'named' | null
  namedOnly: boolean
}

export interface ResolvedKeyword {
  name: string
  slug: string
  shortdoc: string
  shortdocHtml: string
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
  kind: 'Enum' | 'TypedDict' | 'Standard' | 'Custom'
  doc: string
  accepts: string[]
  members: { name: string; value: string }[]
  items: { key: string; type: string; required: boolean }[]
  usedBy: { name: string; slug: string }[]
}
