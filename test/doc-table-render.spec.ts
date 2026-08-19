import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import { inlineMarkdown } from '../app/utils/inline-md'

/**
 * The tables have to survive the *server* renderer, and once they did not.
 *
 * `v-html` on a dynamic `<component :is>` is dropped by Vue's SSR compiler.
 * The element is emitted, its content is not. Nothing warns: the template is
 * valid, the client renderer honours it, and every unit test in this repo that
 * touched DocTable read its source instead of rendering it.
 *
 * This site is prerendered, so what shipped was `<td></td>` in every cell of
 * every table on every page — the headers interpolated normally, so the tables
 * read as deliberately blank rather than broken. It went to production and was
 * found by eye.
 *
 * The fix is `:innerHTML`, which is an ordinary prop and behaves the same in
 * both renderers. These tests pin the behaviour rather than the spelling: one
 * demonstrates the bug against a fixture, the other renders the real component.
 *
 * See test/card-link.spec.ts for the same shape of bug — `<component :is>`
 * doing something subtly different from what it reads as, with no error.
 */

/**
 * Nuxt auto-imports these into every component. The template resolves them
 * through the instance proxy (`_ctx.x`) and `<script setup>` resolves them as
 * plain identifiers, so a bare SSR render needs them in both places.
 *
 * `inlineMarkdown` is the real one — a stub that renders less than the real
 * function would pass this suite while the page still lost its bold and its
 * code spans. `resolveTokenString` is faked, because the real one pulls in the
 * generated libdoc and versions JSON and this test has no business needing a
 * build to run.
 */
const resolveTokenString = (s: string) => s.replaceAll('%%browser%%', '99.9.9')

Object.assign(globalThis, { inlineMarkdown, resolveTokenString })

const DocTable = (await import('../app/components/content/DocTable.vue')).default

function render(component: unknown, props: Record<string, unknown>): Promise<string> {
  const app = createSSRApp(component as never, props)
  app.config.globalProperties.inlineMarkdown = inlineMarkdown
  app.config.globalProperties.resolveTokenString = resolveTokenString
  return renderToString(app)
}

describe('v-html and <component :is> in SSR', () => {
  it('demonstrates the bug: the cell renders empty', async () => {
    const Broken = {
      template: `<tr><component :is="'td'" v-html="html" /></tr>`,
      data: () => ({ html: '<code>x</code>' }),
    }
    expect(await render(Broken, {})).toBe('<tr><td></td></tr>')
  })

  it('shows :innerHTML surviving the same render', async () => {
    const Fixed = {
      template: `<tr><component :is="'td'" :innerHTML="html" /></tr>`,
      data: () => ({ html: '<code>x</code>' }),
    }
    expect(await render(Fixed, {})).toBe('<tr><td><code>x</code></td></tr>')
  })
})

describe('DocTable server-renders its cells', () => {
  const head = ['Option', 'Behaviour']
  const rows = [['`--inspect`', 'Debugging **on**.']]

  it('puts the cell text in the cell', async () => {
    const html = await render(DocTable, { head, rows })
    expect(html).toContain('Debugging <strong>on</strong>.')
    expect(html).toContain('<code>--inspect</code>')
  })

  it('never emits an empty cell for a cell that has text', async () => {
    /*
     * The assertion the bug would have failed. Written against the shape of
     * the output rather than a string, so it catches the next renderer quirk
     * that empties a cell by some other route.
     */
    const html = await render(DocTable, { head, rows })
    // Comments survive SSR, and DocTable's own comment mentions `<td></td>`.
    const markup = html.replaceAll(/<!--[\s\S]*?-->/g, '')
    const cells = [...markup.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(m => m[1]!)
    const body = cells.slice(head.length) // drop the header row
    expect(body.length, 'no body cells rendered at all').toBe(rows[0]!.length)
    for (const cell of body) expect(cell.trim()).not.toBe('')
  })

  it('makes the first column a row header when its heading is empty', async () => {
    /*
     * The reason the cell is a dynamic component in the first place, and so
     * the reason the bug was possible. If this ever stops holding, the simpler
     * plain-<td> template becomes available.
     */
    const html = await render(DocTable, { head: ['', 'A'], rows: [['subject', 'value']] })
    expect(html).toContain('<th scope="row"')
    expect(html).toMatch(/<th scope="row"[^>]*>subject<\/th>/)
  })

  it('resolves a version token inside a cell', async () => {
    const html = await render(DocTable, { head: ['V'], rows: [['Browser %%browser%%']] })
    expect(html).toContain('Browser 99.9.9')
  })
})
