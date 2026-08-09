import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

interface Person {
  login: string
  name: string
  avatar: string
  profile: string
  ways: string[]
  contributions: string[]
}

const data = JSON.parse(read('content/contributors.json')) as {
  total: number
  core: Person[]
  alumni: Person[]
  people: Person[]
}

const WAYS = ['report', 'support', 'docs', 'testing', 'code']

describe('the contributor data', () => {
  it('has everyone the all-contributors bot lists', () => {
    expect(data.people.length).toBe(data.total)
    expect(data.total).toBeGreaterThanOrEqual(206)
  })

  it('names the current core team', () => {
    expect(data.core.map(p => p.login)).toEqual(['aaltat', 'Snooz82'])
  })

  it('names the alumni', () => {
    expect(data.alumni.map(p => p.login)).toEqual(['mkorpela', 'yanne', 'xylix'])
  })

  it('lists core and alumni in the wall as well, not instead of it', () => {
    // Being on the core team is in addition to what you contributed, not a
    // replacement for it — nobody should vanish from the wall by being promoted.
    const logins = new Set(data.people.map(p => p.login))
    for (const p of [...data.core, ...data.alumni]) {
      expect(logins.has(p.login), `${p.login} missing from the wall`).toBe(true)
    }
  })

  it('maps every contribution onto a way the page offers', () => {
    for (const p of data.people) {
      for (const w of p.ways) {
        expect(WAYS, `${p.login} has unknown way "${w}"`).toContain(w)
      }
    }
  })

  it('gives everyone at least one way, so nobody is invisible under every filter', () => {
    const orphans = data.people.filter(p => p.ways.length === 0)
    expect(orphans.map(p => `${p.login} (${p.contributions.join(', ')})`)).toEqual([])
  })

  it('vendors every avatar rather than hot-linking GitHub', () => {
    /*
     * They used to be <img src="https://avatars.githubusercontent.com/…">, so
     * every visitor fetched 206 images from GitHub — over a megabyte of
     * third-party requests, and a runtime dependency on GitHub for a site that
     * is otherwise entirely static.
     */
    for (const p of data.people) {
      expect(p.avatar, `${p.login} is not vendored`).toMatch(/^\/avatars\//)
    }
  })

  it('has a file on disk for each of them', () => {
    for (const p of data.people) {
      expect(existsSync(join(ROOT, 'public', p.avatar)), `missing ${p.avatar}`).toBe(true)
    }
  })

  it('has no duplicate logins', () => {
    const seen = new Set<string>()
    const dupes = data.people.filter(p => (seen.has(p.login) ? true : (seen.add(p.login), false)))
    expect(dupes.map(p => p.login)).toEqual([])
  })
})

describe('the wall stays off the client', () => {
  /*
   * Regression guard. Both bodies started in components/content/, where Nuxt
   * Content registers components globally so MDC can resolve them by name —
   * and a globally registered component is in the client bundle whether or not
   * it is named `.server.vue`. That put 39 KB of contributor data into a chunk
   * loaded by every page, and pushed reachable JS over its ceiling.
   *
   * The fix is a thin wrapper in content/ and the body in components/. If a
   * later edit inlines the body back into the wrapper, this fails.
   */
  it.each([
    ['ContributorWall', 'ContributorWallBody'],
    ['CoreTeam', 'CoreTeamBody'],
  ])('%s is a wrapper around the %s island', (wrapper, body) => {
    const src = read(`app/components/content/${wrapper}.vue`)
    // The tag, not the whole element — a wrapper may forward props.
    expect(src).toContain(`<${body}`)
    expect(src, 'the wrapper must not import the data itself').not.toContain('contributors.json')
  })

  it.each(['ContributorWallBody', 'CoreTeamBody'])('%s is a server component', name => {
    const src = read(`app/components/${name}.server.vue`)
    expect(src).toContain('contributors.json')
  })
})

describe('the filter works without JavaScript', () => {
  const src = read('app/components/ContributorWallBody.server.vue')

  it('is a radio group, not a click handler', () => {
    expect(src).toContain('type="radio"')
    expect(src).not.toMatch(/@click|v-on:/)
  })

  it('hides what a filter excludes, rather than showing what it includes', () => {
    // So the failure mode of an unsupported selector is everyone visible
    // rather than an empty page.
    for (const w of WAYS) {
      expect(src).toContain(`#way-${w}:checked ~ .wall li:not(.w-${w})`)
    }
  })

  it('keeps the hidden radios focusable', () => {
    // display:none would take the whole filter out of the tab order.
    expect(src).not.toMatch(/\.pick\s*\{[^}]*display:\s*none/)
    expect(src).toMatch(/\.pick\s*\{[^}]*clip-path/)
  })
})
