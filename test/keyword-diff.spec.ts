import { describe, expect, it } from 'vitest'

import { diff } from '../scripts/keyword-diff.ts'

/**
 * The keyword-API diff that goes in the release bot's pull request.
 *
 * Its whole job is to make a generated PR reviewable, so the cases that matter
 * are the ones a reviewer must not miss: a keyword that disappeared, an
 * argument that was dropped. Those are marked, not merely listed.
 *
 * Built from synthetic specs rather than two committed versions, so the
 * assertions do not change meaning when a new release lands.
 */

const arg = (name: string, repr = name) => ({ name, repr })

const spec = (version: string, keywords: object[], typedocs: string[] = []) => ({
  version,
  keywords: keywords as never,
  typedocs: typedocs.map(name => ({ name })),
})

const click = {
  name: 'Click',
  args: [arg('selector', 'selector: str')],
  returnType: null,
  shortdoc: 'Clicks.',
  tags: [],
}

describe('the keyword API diff', () => {
  it('reports nothing when nothing changed', () => {
    const out = diff(spec('1.0.0', [click]), spec('1.0.1', [click]))
    expect(out).toContain('No keyword signatures changed.')
    expect(out).toContain('1.0.0 → 1.0.1')
    expect(out).toContain('1 keywords (unchanged)')
  })

  it('lists a new keyword with what it does', () => {
    const added = { ...click, name: 'Hover', shortdoc: 'Hovers over the element.' }
    const out = diff(spec('1.0.0', [click]), spec('1.1.0', [click, added]))
    expect(out).toContain('New keywords (1)')
    expect(out).toContain('**Hover** — Hovers over the element.')
    expect(out).toContain('(+1)')
  })

  it('marks a removed keyword, because it breaks a suite', () => {
    const out = diff(spec('1.0.0', [click]), spec('2.0.0', []))
    expect(out).toContain('⚠️ Removed keywords (1)')
    expect(out).toContain('**Click**')
  })

  it('separates an added argument from a removed one', () => {
    /*
     * A new optional argument is routine; a dropped one is a break. Both are
     * "the signature changed", so the diff has to tell them apart or the
     * distinction is lost in a list.
     */
    const after = {
      ...click,
      args: [arg('selector', 'selector: str'), arg('force', 'force: bool = False')],
    }
    const gained = diff(spec('1.0.0', [click]), spec('1.1.0', [after]))
    expect(gained).toContain('added: `force: bool = False`')
    expect(gained).not.toContain('removed:')

    const lost = diff(spec('1.1.0', [after]), spec('2.0.0', [click]))
    expect(lost).toContain('**removed: `force`**')
  })

  it('catches an argument that kept its name but changed its default', () => {
    // The silent one: same name, same position, different behaviour.
    const before = { ...click, args: [arg('timeout', 'timeout: float = 10')] }
    const after = { ...click, args: [arg('timeout', 'timeout: float = 30')] }
    const out = diff(spec('1.0.0', [before]), spec('1.1.0', [after]))
    expect(out).toContain('changed: `timeout: float = 10 → timeout: float = 30`')
  })

  it('reports a changed return type', () => {
    const before = { ...click, returnType: { name: 'str' } }
    const after = { ...click, returnType: { name: 'int' } }
    const out = diff(spec('1.0.0', [before]), spec('1.1.0', [after]))
    expect(out).toContain('**Click**: `str` → `int`')
  })

  it('does not mistake spec 4 writing None for a changed return type', () => {
    // Spec 3 wrote `returnType: null`; spec 4 writes a `None` node. The first
    // import across that boundary reported `None → None` for every such keyword.
    const before = { ...click, returnType: null }
    const after = { ...click, returnType: { name: 'None' } }
    const out = diff(spec('1.0.0', [before]), spec('1.1.0', [after]))
    expect(out).not.toContain('**Click**')
  })

  it('reports documented types appearing and disappearing', () => {
    /*
     * Not cosmetic: a type page vanishing is how we learned that generating
     * with too old a Robot Framework silently drops documentation.
     */
    const out = diff(spec('1.0.0', [click], ['MouseButton']), spec('1.1.0', [click], ['Secret']))
    expect(out).toContain('added: `Secret`')
    expect(out).toContain('removed: `MouseButton`')
  })
})
