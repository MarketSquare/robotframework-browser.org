/**
 * MDC components → plain Markdown, for the LLM exports (server/utils/llms.ts).
 *
 * Stringified as they are, components come out as HTML tags whose content is
 * often in their props — a `doc-table` is a tag with its rows as a JSON string
 * in an attribute, a `terminal-block` its whole session, a `device-table`
 * nothing at all because it reads its data itself. A model reads Markdown
 * best, so each component is rewritten into what it shows a person: a table,
 * a fenced block, a quote, a list. Anything not listed here is unwrapped, so
 * its prose survives and no tag is left behind.
 *
 * What Markdown can express but minimark cannot hold verbatim (a GFM table, a
 * code fence built from props) is returned as a placeholder paragraph and
 * spliced in after stringifying; see `RawBlocks`.
 */
import type { MinimarkNode } from 'minimark'

import DEVICES from '../../app/generated/devices.json'
import { resolveTokenString } from '../../app/utils/version-tokens'

type Element = [string, Record<string, unknown>, ...MinimarkNode[]]
type Props = Record<string, unknown>

/** Markdown kept out of minimark until after `stringify`. */
export class RawBlocks {
  private blocks: string[] = []

  /** A paragraph holding only a token, which stringify leaves alone. */
  add(markdown: string): MinimarkNode {
    this.blocks.push(markdown.trim())
    return ['p', {}, `LLMRAWBLOCK${this.blocks.length - 1}END`]
  }

  splice(markdown: string): string {
    return markdown.replace(/LLMRAWBLOCK(\d+)END/g, (_, i: string) => this.blocks[Number(i)]!)
  }
}

/** Reads a prop given inline (`kind="note"`) or as YAML block props (`:rows` holds JSON). */
function prop<T>(props: Props, name: string): T | undefined {
  if (props[name] !== undefined) return props[name] as T
  const bound = props[`:${name}`]
  if (typeof bound !== 'string') return undefined
  try {
    return JSON.parse(bound) as T
  }
  catch {
    return bound as T
  }
}

/** The text of a node and everything inside it. */
function text(node: MinimarkNode): string {
  if (typeof node === 'string') return node
  return node.slice(2).map(n => text(n as MinimarkNode)).join('').trim()
}

const cell = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

function table(head: unknown[], rows: unknown[][]): string {
  return [
    `| ${head.map(cell).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n')
}

const fence = (lang: string, code: string, title = '') =>
  `\`\`\`${lang}${title ? ` [${title}]` : ''}\n${code.replace(/\n+$/, '')}\n\`\`\``

interface TerminalSession {
  shell: string
  steps: { command?: string; output?: string[]; status?: { ok: boolean; text: string }[] }[]
}

function terminal(sessions: TerminalSession[], title?: string): string {
  return sessions.map((s) => {
    const prompt = s.shell === 'powershell' ? 'PS> ' : '$ '
    const lines = s.steps.flatMap(step => [
      ...(step.command ? [`${prompt}${step.command}`] : []),
      ...(step.output ?? []),
      ...(step.status ?? []).map(st => `${st.ok ? '✓' : '✗'} ${st.text}`),
    ])
    return fence(s.shell === 'powershell' ? 'powershell' : 'bash', lines.join('\n'), sessions.length === 1 ? title : '')
  }).join('\n\n')
}

const EXT_LANG: Record<string, string> = { robot: 'robotframework', py: 'python', ts: 'typescript', js: 'javascript' }

interface Device {
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: string
}

function deviceTable(): string {
  const devices = (DEVICES as unknown as { devices: Record<string, Device> }).devices
  return table(
    ['Name', 'Viewport', 'DPR', 'Mobile', 'Touch', 'Engine'],
    Object.entries(devices).map(([name, d]) => [
      `\`${name}\``,
      `${d.viewport.width}×${d.viewport.height}`,
      d.deviceScaleFactor,
      d.isMobile ? 'yes' : 'no',
      d.hasTouch ? 'yes' : 'no',
      d.defaultBrowserType,
    ]),
  )
}

const NOTE_LABEL: Record<string, string> = { note: 'Note', warning: 'Watch out', aside: 'Aside' }

export interface SimplifyContext {
  raw: RawBlocks
  /** An example source by its path under examples/, for `::comparison`. */
  example: (path: string) => Promise<string | null>
}

/** Rewrites every component in `nodes`; see the file comment. */
export async function simplify(nodes: MinimarkNode[], ctx: SimplifyContext): Promise<MinimarkNode[]> {
  const out: MinimarkNode[] = []
  for (const node of nodes) out.push(...await simplifyNode(node, ctx))
  return out
}

async function simplifyNode(node: MinimarkNode, ctx: SimplifyContext): Promise<MinimarkNode[]> {
  if (typeof node === 'string') return [node]
  const [tag, props, ...children] = node as Element
  const inner = () => simplify(children, ctx)

  switch (tag) {
    case 'doc-note':
      return [['blockquote', {}, ['p', {}, ['strong', {}, `${NOTE_LABEL[prop<string>(props, 'kind') ?? 'note'] ?? 'Note'}:`]], ...await inner()]]

    case 'doc-table':
      return [ctx.raw.add(table(prop<unknown[]>(props, 'head') ?? [], prop<unknown[][]>(props, 'rows') ?? []))]

    case 'terminal-block':
      return [ctx.raw.add(terminal(prop<TerminalSession[]>(props, 'sessions') ?? [], prop<string>(props, 'title')))]

    case 'doc-figure':
      return [['p', {}, ['img', { src: prop(props, 'src'), alt: prop(props, 'alt') }]], ...await inner()]

    case 'doc-video':
      return [
        ['p', {}, ['strong', {}, ['a', { href: prop(props, 'src') }, 'Video']], `: ${prop<string>(props, 'alt') ?? ''}`],
        ...await inner(),
      ]

    case 'comparison': {
      const blocks: string[] = []
      for (const side of ['left', 'right']) {
        const path = prop<string>(props, side)
        if (!path) continue
        const code = await ctx.example(path)
        if (code !== null) blocks.push(fence(EXT_LANG[path.split('.').pop()!] ?? '', code, path.split('/').pop()))
      }
      const notes = prop<string[]>(props, 'notes') ?? []
      if (notes.length) blocks.push(notes.map(n => `- ${n}`).join('\n'))
      return [ctx.raw.add(blocks.join('\n\n'))]
    }

    case 'page-section': {
      const title = prop<string>(props, 'title')
      return [...(title ? [['h2', {}, title] as MinimarkNode] : []), ...await inner()]
    }

    case 'card': {
      const title = prop<string>(props, 'title')
      const to = prop<string>(props, 'to')
      const heading: MinimarkNode[] = title
        ? [['p', {}, ['strong', {}, to ? ['a', { href: to }, title] : title]]]
        : []
      return [...heading, ...await inner()]
    }

    case 'btn-row':
      return [['ul', {}, ...children.flatMap((c) => {
        if (typeof c === 'string' || c[0] !== 'btn') return []
        return [['li', {}, ['a', { href: prop(c[1] as Props, 'to') }, text(c)]] as MinimarkNode]
      })]]

    case 'btn':
      return [['p', {}, ['a', { href: prop(props, 'to') }, text(node)]]]

    case 'stat-row':
      return [['ul', {}, ...children.flatMap((c) => {
        if (typeof c === 'string' || c[0] !== 'stat') return []
        return [['li', {}, `${text(c)}: `, ['strong', {}, String(prop(c[1] as Props, 'value') ?? '')]] as MinimarkNode]
      })]]

    // Inline: `:ver{name="browser"}` is the version itself, `:since{version}` a badge.
    case 'ver':
      return [['code', {}, resolveTokenString(`%%${prop<string>(props, 'name')}%%`)]]

    case 'since':
      return [['em', {}, `(since Browser ${prop<string>(props, 'version')})`]]

    case 'device-table':
      return [ctx.raw.add(deviceTable())]

    // Decoration, or data that only means something as the interactive widget.
    case 'rotating-title':
    case 'contributor-wall':
    case 'core-team':
      return []

    default:
      // Components and slot templates: keep what is inside, drop the wrapper.
      if (tag.includes('-') || tag === 'template') return inner()
      return [[tag, props, ...await inner()] as MinimarkNode]
  }
}
