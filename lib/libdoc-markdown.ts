/**
 * Libdoc JSON -> one Markdown document: the keyword reference for language
 * models, served at `/keywords.md` (server/routes/keywords.md.get.ts).
 *
 * The HTML reference is built for people — a rail, filters, one panel per
 * keyword. A model wants the opposite: everything in one plain file, each
 * keyword with its full signature in one place. The documentation itself is
 * libdoc's rendered HTML, the only copy there is, turned back into Markdown.
 */
import TurndownService from 'turndown'
import { tables } from 'turndown-plugin-gfm'

import type { LibdocArg, LibdocKeyword, LibdocSpec, LibdocTypedoc } from './libdoc.ts'

/** The library's import arguments; not in `LibdocSpec`, which the site never needed. */
interface InitSpec { inits?: { args: LibdocArg[]; doc: string }[] }

export interface KeywordMarkdownOptions {
  /** The HTML reference this document mirrors, for the "Source" line. */
  sourceUrl: string
}

function converter(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  })
  td.use(tables)

  /*
   * Libdoc's examples are a bare `<pre>`, not `<pre><code>`, with every
   * keyword name inside wrapped in a link to its anchor. Turndown would escape
   * them as prose; their text is the example, so that is what is kept.
   */
  td.addRule('libdoc-pre', {
    filter: 'pre',
    replacement: (_content, node) =>
      `\n\n\`\`\`robotframework\n${(node.textContent ?? '').replace(/^\n+|\s+$/g, '')}\n\`\`\`\n\n`,
  })

  /*
   * In-page links — `#Add%20Cookie`, `#type-DownloadInfo`, `#Assertions` —
   * point into the HTML reference and mean nothing in a file. What they name
   * is a keyword or a type, which reads best as code.
   */
  td.addRule('libdoc-anchor', {
    filter: node => node.nodeName === 'A' && (node.getAttribute('href') ?? '').startsWith('#'),
    replacement: content => (content.trim() ? `\`${content.replace(/`/g, '')}\`` : ''),
  })

  /* Every keyword ends in a "Comment >>" link to its forum thread: a prompt for people, noise here. */
  td.addRule('libdoc-forum', {
    filter: node => node.nodeName === 'P' && /^\s*Comment\s*>>/.test(node.textContent ?? ''),
    replacement: () => '',
  })

  /*
   * Libdoc writes header-less tables (`| *Value* | *Explanation* |` becomes
   * plain `<td>`s), and the GFM plugin keeps a table without `<th>` as HTML.
   * Their first row is the header in every case, so it is made one.
   */
  const turndown = td.turndown.bind(td)
  td.turndown = (html: string | TurndownService.Node) =>
    turndown(typeof html === 'string' ? headerRows(html) : html)

  return td
}

function headerRows(html: string): string {
  return html.replace(/<table\b[\s\S]*?<\/table>/g, (table) => {
    if (/<th\b/.test(table)) return table
    return table.replace(/<tr>([\s\S]*?)<\/tr>/, (_, row: string) =>
      `<tr>${row.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>')}</tr>`)
  })
}

/** One argument, as libdoc prints it, followed by its own documentation. */
function argLine(td: TurndownService, arg: LibdocArg): string {
  const doc = arg.doc ? td.turndown(arg.doc).replace(/\n+/g, ' ').trim() : ''
  const namedOnly = arg.kind === 'NAMED_ONLY' ? ' (named-only)' : ''
  return `- \`${arg.repr}\`${namedOnly}${doc ? ` — ${doc}` : ''}`
}

function keywordSection(td: TurndownService, kw: LibdocKeyword): string {
  const out = [`### ${kw.name}`]
  const args = kw.args.filter(a => a.kind !== 'NAMED_ONLY_MARKER')
  out.push(args.length ? `Arguments:\n\n${args.map(a => argLine(td, a)).join('\n')}` : 'Arguments: none')
  if (kw.returnType) {
    const doc = kw.returnDoc ? td.turndown(kw.returnDoc).replace(/\n+/g, ' ').trim() : ''
    out.push(`Returns: \`${typeName(kw.returnType)}\`${doc ? ` — ${doc}` : ''}`)
  }
  if (kw.tags.length) out.push(`Tags: ${kw.tags.join(', ')}`)
  out.push(demote(td.turndown(kw.doc), 3))
  return out.join('\n\n')
}

/** `list[str] | None`, from libdoc's nested type tree. */
function typeName(t: NonNullable<LibdocKeyword['returnType']>): string {
  if (t.union) return t.nested.map(typeName).join(' | ')
  return t.nested.length ? `${t.name}[${t.nested.map(typeName).join(', ')}]` : t.name
}

function typeSection(td: TurndownService, t: LibdocTypedoc): string {
  const out = [`### ${t.name}`, `Kind: ${t.type}`]
  if (t.doc) out.push(demote(td.turndown(t.doc), 3))
  if (t.members?.length) out.push(`Members:\n\n${t.members.map(m => `- \`${m.name}\``).join('\n')}`)
  if (t.items?.length) {
    out.push(`Keys:\n\n${t.items.map(i => `- \`${i.key}: ${i.type}\`${i.required ? ' (required)' : ''}`).join('\n')}`)
  }
  if (t.accepts.length) out.push(`Accepts: ${t.accepts.join(', ')}`)
  if (t.usages.length) out.push(`Used by: ${t.usages.join(', ')}`)
  return out.join('\n\n')
}

/**
 * Pushes every heading in `md` below `level`, so a keyword's own `## Example`
 * cannot outrank the keyword it belongs to. Fenced code is left alone — a
 * `# comment` in a Robot example is not a heading.
 */
export function demote(md: string, level: number): string {
  let fenced = false
  return md.split('\n').map((line) => {
    if (line.startsWith('```')) fenced = !fenced
    if (fenced) return line
    const m = /^(#{1,6}) /.exec(line)
    if (!m) return line
    const depth = Math.min(6, Math.max(m[1]!.length, level + 1))
    return `${'#'.repeat(depth)} ${line.slice(m[0].length)}`
  }).join('\n')
}

export function libdocToMarkdown(spec: LibdocSpec & InitSpec, opts: KeywordMarkdownOptions): string {
  const td = converter()
  const init = spec.inits?.[0]

  return [
    `# ${spec.name} ${spec.version} — keyword reference`,
    `> Every keyword of the Robot Framework ${spec.name} library ${spec.version}, with its arguments, `
    + 'return value and documentation, followed by every argument type. '
    + 'Keyword names are case-insensitive in Robot Framework, and spaces and underscores in them are ignored.',
    `Source: ${opts.sourceUrl}`,
    '## Contents',
    '- Library documentation\n- Importing\n- Keywords (alphabetical)\n- Types',
    '## Library documentation',
    demote(td.turndown(spec.doc), 2),
    '## Importing',
    init ? `\`Library    Browser\`, with these optional arguments:\n\n${init.args.map(a => argLine(td, a)).join('\n')}` : '`Library    Browser`',
    '## Keywords',
    ...spec.keywords.map(k => keywordSection(td, k)),
    '## Types',
    ...spec.typedocs.map(t => typeSection(td, t)),
  ].join('\n\n') + '\n'
}
