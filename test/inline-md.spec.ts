import { describe, expect, it } from 'vitest'

import { inlineMarkdown } from '../app/utils/inline-md'

describe('inlineMarkdown', () => {
  it('renders code, and escapes what is inside it', () => {
    expect(inlineMarkdown('set `a<b>c`')).toBe('set <code>a&lt;b&gt;c</code>')
  })

  it('renders bold — the case that shipped broken in a table cell', () => {
    expect(inlineMarkdown('**No**')).toBe('<strong>No</strong>')
  })

  it('renders italic without eating a stray asterisk', () => {
    expect(inlineMarkdown('the *machine* itself')).toBe('the <em>machine</em> itself')
    expect(inlineMarkdown('2 * 3 * 4')).toBe('2 * 3 * 4')
  })

  it('renders links', () => {
    expect(inlineMarkdown('see [the docs](/docs/x)')).toBe('see <a href="/docs/x">the docs</a>')
  })

  it('leaves emphasis inside a code span alone', () => {
    // The span is lifted out before emphasis runs, so its asterisks stay literal.
    expect(inlineMarkdown('`a ** b`')).toBe('<code>a ** b</code>')
  })

  it('escapes markup that was not asked for', () => {
    expect(inlineMarkdown('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('escapes a quote in a link target rather than closing the attribute', () => {
    expect(inlineMarkdown('[x](/a"onx=1)')).toBe('<a href="/a&quot;onx=1">x</a>')
  })

  it('passes plain text through untouched', () => {
    expect(inlineMarkdown('Stability matters more than realism.')).toBe(
      'Stability matters more than realism.',
    )
  })
})
