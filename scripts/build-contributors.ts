/**
 * Turns the library's `.all-contributorsrc` into `content/contributors.json`.
 *
 * That file is the all-contributors bot's own database — the README table is
 * generated *from* it. Reading it rather than scraping the rendered HTML means
 * the day the bot adds someone, re-running this script is the whole update, and
 * nothing here has to understand the README's markup.
 *
 * Usage:
 *   pnpm build:contributors [path-to-library-checkout]
 *
 * The output is committed, so a build never needs the library checked out
 * alongside — the same arrangement as the Libdoc JSON.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** One entry as the bot stores it. */
interface Raw {
  login: string
  name: string
  avatar_url: string
  profile: string
  contributions: string[]
}

/**
 * The bot's contribution keys, mapped onto the ways of contributing the
 * community page is organised around. Several keys land on one way: a bug
 * report and a feature idea are both "telling us what you found".
 */
const WAYS: Record<string, string> = {
  bug: 'report',
  ideas: 'report',
  code: 'code',
  review: 'code',
  doc: 'docs',
  example: 'docs',
  userTesting: 'testing',
  test: 'testing',
  question: 'support',
  financial: 'support',
  fundingFinding: 'support',
}

/** Current core team, then people who held it before. Order is shown as given. */
const CORE = ['aaltat', 'Snooz82']
const ALUMNI = ['mkorpela', 'yanne', 'xylix']

const libraryRoot = process.argv[2] ?? resolve(process.cwd(), '../robotframework-browser')
const source = join(libraryRoot, '.all-contributorsrc')

const raw = JSON.parse(readFileSync(source, 'utf8')) as { contributors: Raw[] }

/*
 * `s=` asks GitHub for a resized avatar. Without it the URLs serve a
 * full-resolution image that we then scale down in CSS — 206 of those is a
 * slow page for no visible gain. 160 is twice the rendered size, for high-DPI
 * screens.
 */
const avatar = (url: string) => `${url}${url.includes('?') ? '&' : '?'}s=160`

const people = raw.contributors.map(c => ({
  login: c.login,
  name: c.name,
  avatar: avatar(c.avatar_url),
  profile: c.profile,
  /* De-duplicated: `bug` and `ideas` both map to `report`. */
  ways: [...new Set(c.contributions.map(k => WAYS[k]).filter(Boolean))].sort(),
  /* Kept so a future page can be more granular without regenerating. */
  contributions: c.contributions,
}))

const byLogin = new Map(people.map(p => [p.login, p]))

/** A named group must not silently lose a member to a rename or a typo. */
const missing = [...CORE, ...ALUMNI].filter(l => !byLogin.has(l))
if (missing.length) {
  throw new Error(
    `Not in .all-contributorsrc: ${missing.join(', ')}. `
    + 'Check the login spelling, or add them with the all-contributors bot first.',
  )
}

const out = {
  /** Where this came from, so the next person does not have to guess. */
  source: '.all-contributorsrc, maintained by the all-contributors bot',
  generated: new Date().toISOString().slice(0, 10),
  total: people.length,
  core: CORE.map(l => byLogin.get(l)),
  alumni: ALUMNI.map(l => byLogin.get(l)),
  /* Everyone, in the bot's order — which is roughly the order they arrived. */
  people,
}

const target = join(process.cwd(), 'content/contributors.json')
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`)

const counts = people.reduce<Record<string, number>>((acc, p) => {
  p.ways.forEach(w => (acc[w] = (acc[w] ?? 0) + 1))
  return acc
}, {})

console.log(`${people.length} contributors → content/contributors.json`)
console.log(Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`).join('\n'))
