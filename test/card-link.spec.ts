import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

/**
 * Regression guard for a bug that rendered without erroring.
 *
 * `<component :is="to ? 'NuxtLink' : 'article'">` looks correct and is not: a
 * *string* `is` is treated as a native element name. 'article' is a real tag so
 * the non-link case worked, while 'NuxtLink' was emitted as a literal
 * <NuxtLink> element — which a browser parses as an unknown inline element and
 * renders happily. The cards looked finished and simply were not clickable.
 */

const Broken = defineComponent({
  props: { to: { type: String, default: '' } },
  setup: props => () => h(props.to ? 'NuxtLink' : 'article', { to: props.to }, 'x'),
})

const Fixed = defineComponent({
  props: { to: { type: String, default: '' } },
  setup(props) {
    // Stands in for resolveComponent('NuxtLink'), which needs an app context.
    const Link = defineComponent({
      props: { to: String },
      setup: (p, { slots }) => () => h('a', { href: p.to }, slots.default?.()),
    })
    return () => h(props.to ? Link : 'article', { to: props.to }, () => 'x')
  },
})

describe('a card with a `to` becomes a real link', () => {
  it('demonstrates the bug: a string `is` emits an unknown element', () => {
    const html = mount(Broken, { props: { to: '/x' } }).html()
    expect(html).toContain('<nuxtlink')
    expect(html).not.toContain('<a ')
  })

  it('a resolved component emits an anchor with an href', () => {
    const html = mount(Fixed, { props: { to: '/x' } }).html()
    expect(html).toContain('<a href="/x"')
  })

  it('without `to` it is still an article, not a link', () => {
    expect(mount(Fixed).html()).toContain('<article')
  })
})

describe('Card.vue resolves the component rather than naming it', () => {
  const src = readFileSync(join(process.cwd(), 'app/components/content/Card.vue'), 'utf8')
  /* The template only — the comment above it quotes the broken form on purpose. */
  const template = src.slice(src.indexOf('<template>'), src.indexOf('</template>'))

  it('does not pass NuxtLink to `is` as a string', () => {
    expect(template).not.toMatch(/:is="[^"]*'NuxtLink'/)
  })

  it('uses resolveComponent', () => {
    expect(src).toContain("resolveComponent('NuxtLink')")
  })

  it('gives a linked card a visible affordance, not only a hover state', () => {
    // A whole clickable panel with no signal is a panel nobody clicks.
    expect(src).toMatch(/a\.card h3::after/)
  })
})

describe('the community cards point where they should', () => {
  const md = readFileSync(join(process.cwd(), 'content/community.md'), 'utf8')

  it.each([
    ['Slack', 'https://robotframework.org/#community'],
    ['Forum', 'https://forum.robotframework.org/'],
    ['GitHub', 'https://github.com/MarketSquare/robotframework-browser'],
  ])('%s links to %s', (_name, url) => {
    expect(md).toContain(`to="${url}"`)
  })
})
