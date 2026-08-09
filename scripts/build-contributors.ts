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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
 * Avatars are vendored, not hot-linked.
 *
 * They used to be <img src="https://avatars.githubusercontent.com/…">, which
 * meant every visitor fetched 206 images from GitHub at page load: over a
 * megabyte of third-party requests, and the landing page's Lighthouse
 * performance score sat at 62. It also quietly made GitHub a runtime
 * dependency of a static site, and told them who was reading it.
 *
 * One size, at 96px: the compact wall renders 40px and the full wall 56px, so
 * this covers both at better than 1.7x. Downloaded once and committed, the
 * same arrangement as the Libdoc JSON — a build never needs the network.
 */
const AVATAR_SIZE = 96
const AVATARS = join(process.cwd(), 'public/avatars')

/** GitHub serves JPEG or PNG; keep whatever arrives rather than re-encoding. */
function extensionFor(type: string | null): string {
  if (type?.includes('png')) return 'png'
  if (type?.includes('gif')) return 'gif'
  return 'jpg'
}

async function vendorAvatar(login: string, url: string): Promise<string | null> {
  const existing = ['jpg', 'png', 'gif']
    .map(ext => `${login}.${ext}`)
    .find(name => existsSync(join(AVATARS, name)))
  if (existing) return `/avatars/${existing}`

  const src = `${url}${url.includes('?') ? '&' : '?'}s=${AVATAR_SIZE}`
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(src)
      if (!res.ok) continue
      const ext = extensionFor(res.headers.get('content-type'))
      const name = `${login}.${ext}`
      writeFileSync(join(AVATARS, name), Buffer.from(await res.arrayBuffer()))
      return `/avatars/${name}`
    }
    catch {
      /* retry once, then give up on this one */
    }
  }
  return null
}

mkdirSync(AVATARS, { recursive: true })

/* Eight at a time: polite to GitHub, and 206 serial requests is a long wait. */
const downloaded = new Map<string, string>()
const queue = [...raw.contributors]
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let c = queue.pop(); c; c = queue.pop()) {
      const path = await vendorAvatar(c.login, c.avatar_url)
      if (path) downloaded.set(c.login, path)
    }
  }),
)

const withoutAvatar = raw.contributors.filter(c => !downloaded.has(c.login))
if (withoutAvatar.length > raw.contributors.length / 10) {
  throw new Error(`${withoutAvatar.length} avatars failed to download; refusing to ship a wall of gaps`)
}

const people = raw.contributors.map(c => ({
  login: c.login,
  name: c.name,
  avatar: downloaded.get(c.login) ?? '',
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
console.log(`  avatars vendored to public/avatars (${downloaded.size} files)`)
if (withoutAvatar.length) console.log(`  no avatar for: ${withoutAvatar.map(m => m.login).join(', ')}`)
console.log(Object.entries(counts).map(([k, v]) => `  ${k}: ${v}`).join('\n'))
