import libdoc from '~/generated/libdoc.json'

/**
 * The keyword reference's data access. Spec §7.2, §7.4.
 *
 * The index and group structure for the current release are imported at build
 * time — every page needs them for the rail and the search filter, and they are
 * the only part of the reference that reaches the client.
 *
 * The rendered bodies are not here and must not be. Every version's page is
 * prerendered, and KeywordPanels.server.vue reaches the full payload through a
 * server-only glob, so the documentation arrives as HTML rather than as data.
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

export interface KeywordIndex {
  index: IndexEntry[]
  groups: GroupEntry[]
  types: TypeEntry[]
  introSections: IntroSection[]
  version: string
}

/** The current release. Imported directly, because every page needs it. */
export function useKeywordIndex(): KeywordIndex {
  return {
    index: libdoc.index as IndexEntry[],
    groups: libdoc.groups as GroupEntry[],
    types: libdoc.types as TypeEntry[],
    introSections: libdoc.introSections as IntroSection[],
    version: LATEST_VERSION,
  }
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
  /** Sanitized HTML; empty when the spec keeps it in the keyword's doc. */
  doc: string
}
