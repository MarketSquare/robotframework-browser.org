/**
 * The two project figures that live on someone else's server: the star count
 * on GitHub, and how many releases are on PyPI.
 *
 * Written to `content/project.json` and committed, exactly like
 * `contributors.json`. The build itself stays offline — CI installs, builds and
 * prerenders with no network, and a rate-limited API call is not something a
 * deploy should be able to fail on. Refreshed on demand with `pnpm project`,
 * or with everything else via `pnpm refresh`.
 *
 * Both numbers therefore age. That is the trade, and it is the reason the file
 * records when it was fetched.
 *
 * Usage: pnpm project
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO = 'MarketSquare/robotframework-browser'
const PACKAGE = 'robotframework-browser'
const TARGET = join(process.cwd(), 'content/project.json')

/**
 * Fail loudly: a silent fallback would freeze a stale number into the page.
 *
 * `GITHUB_TOKEN` is used when there is one. Unauthenticated calls are limited
 * to 60 an hour *per IP*, and an Actions runner shares its IP with every other
 * job on it — so in CI the anonymous call is the one that fails.
 */
async function json(url: string): Promise<Record<string, unknown>> {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...(token && url.includes('api.github.com') ? { authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`)
  return (await res.json()) as Record<string, unknown>
}

const repo = await json(`https://api.github.com/repos/${REPO}`)
const stars = repo.stargazers_count
if (typeof stars !== 'number') throw new Error('no stargazers_count in the GitHub response')

const pypi = await json(`https://pypi.org/pypi/${PACKAGE}/json`)
const releases = Object.keys((pypi.releases ?? {}) as object).length
if (!releases) throw new Error('no releases in the PyPI response')

/*
 * Keep the previous numbers if the new ones look wrong. Stars can fall, but not
 * to a third; a collapse means the API answered about something else.
 */
try {
  const old = JSON.parse(readFileSync(TARGET, 'utf8')) as { stars: number; releases: number }
  if (stars < old.stars / 2) throw new Error(`stars fell from ${old.stars} to ${stars} — refusing`)
  if (releases < old.releases) throw new Error(`releases fell from ${old.releases} to ${releases} — refusing`)
}
catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

/*
 * The contributor count rides along, because it is the same kind of fact and
 * the page needs it in the same row. It is not fetched — the all-contributors
 * bot maintains it, and `pnpm contributors` has already written it here.
 */
const contributors = (
  JSON.parse(readFileSync(join(process.cwd(), 'content/contributors.json'), 'utf8')) as {
    total: number
  }
).total

const out = {
  stars,
  releases,
  contributors,
  fetched: new Date().toISOString().slice(0, 10),
  sources: { stars: `https://github.com/${REPO}`, releases: `https://pypi.org/project/${PACKAGE}/` },
}

writeFileSync(TARGET, `${JSON.stringify(out, null, 2)}\n`)
console.log(
  `project → content/project.json  (${stars} stars, ${releases} releases, ${contributors} contributors)`,
)
