/**
 * Collects the version numbers the site quotes, from the places that own them.
 *
 * Every one of these used to be typed into prose and code fences by hand,
 * which meant a release left the site quietly wrong in a dozen places — a
 * `docker pull` line for a tag that exists, describing a version nobody runs.
 * Content refers to them as `%{browser}` and friends, and the Nuxt Content
 * `beforeParse` hook substitutes them at build time.
 *
 * Sources, in order of authority:
 *   browser           content/libdoc/LATEST — the version whose Libdoc we render
 *   playwright        the newest release note: "tested with Playwright X"
 *   playwrightDocker  the library's Dockerfile FROM line, which lags the above
 *                     whenever a Browser release does not rebuild the image
 *
 * Needs the library checked out alongside, so it is NOT part of `pnpm
 * generate` — a build must work from a clean clone with no second repository
 * and no network. `app/generated/versions.json` is committed; this script
 * rewrites it, and `pnpm refresh` is when that happens.
 *
 * test/versions.spec.ts asserts the committed file matches
 * content/libdoc/LATEST, so a stale manifest fails the build rather than
 * shipping wrong version numbers.
 *
 * Usage: pnpm versions [path-to-library-checkout]
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()
const libraryRoot = process.argv[2] ?? resolve(ROOT, '../robotframework-browser')

/** The release we document. */
const browser = readFileSync(join(ROOT, 'content/libdoc/LATEST'), 'utf8').trim()

/** `20.3.0` → `20.3`, the Docker tag that follows the minor. */
const browserMinor = browser.split('.').slice(0, 2).join('.')

/**
 * The Playwright the newest release was tested against, read out of the note
 * the importer already parsed rather than guessed at here.
 */
function playwrightFromNotes(): string {
  const dir = join(ROOT, 'content/releases')
  const note = join(dir, `${browser}.md`)
  const files = readdirSync(dir)
  const src = readFileSync(files.includes(`${browser}.md`) ? note : join(dir, files[0]!), 'utf8')
  const found = /^playwright: "([^"]+)"/m.exec(src)?.[1]
  if (!found) throw new Error(`No playwright version in the release note for ${browser}`)
  return found
}

/**
 * The base image, e.g. `mcr.microsoft.com/playwright:v1.62.0-noble`.
 *
 * Deliberately separate from the version above: the published image is only
 * rebuilt when the Dockerfile changes, so a patch release can be tested
 * against a Playwright the image does not carry. Quoting one for the other
 * would be wrong in exactly the situation a reader is trying to debug.
 */
function dockerBase(): { image: string; playwright: string } {
  const path = join(libraryRoot, 'docker/Dockerfile.latest_release')
  const from = /^FROM\s+(\S+)/m.exec(readFileSync(path, 'utf8'))?.[1]
  if (!from) throw new Error(`No FROM line in ${path}`)
  const version = /:v(\d+\.\d+\.\d+)/.exec(from)?.[1]
  if (!version) throw new Error(`Cannot read a Playwright version from "${from}"`)
  return { image: from, playwright: version }
}

/**
 * The NodeJS shipped inside the BrowserBatteries wheel — the runtime that ends
 * up on a user's machine, which is not the same as whatever Node built the
 * library. `nodejs_pin.toml` says so itself, in those words.
 */
function bundledNode(): string {
  const path = join(libraryRoot, 'nodejs_pin.toml')
  const found = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(path, 'utf8'))?.[1]
  if (!found) throw new Error(`No version in ${path}`)
  return found
}

/** The Playwright the library depends on, from its own package.json. */
function bundledPlaywright(): string {
  const path = join(libraryRoot, 'package.json')
  const dep = JSON.parse(readFileSync(path, 'utf8')).dependencies?.playwright as string | undefined
  const found = dep && /(\d+\.\d+\.\d+)/.exec(dep)?.[1]
  if (!found) throw new Error(`No playwright dependency in ${path}`)
  return found
}

/**
 * Refuse to run against the wrong checkout.
 *
 * Every version below `browser` is read out of `libraryRoot` — the Dockerfile,
 * the Node pin, the Playwright dependency. If that checkout is on a branch or a
 * tag other than the release whose Libdoc this site renders, the manifest ends
 * up describing a version nobody can install, and nothing downstream notices:
 * the numbers are all well-formed, the build is green, the tests pass. It has
 * already happened once, from a `version-drift-docker` branch, and the only
 * visible symptom was a Playwright patch number one off.
 *
 * The library states its own version, so the mismatch is cheap to detect.
 */
function assertCheckoutMatches(): void {
  const path = join(libraryRoot, 'Browser/version.py')
  const found = /__version__\s*=\s*"([^"]+)"/.exec(readFileSync(path, 'utf8'))?.[1]
  if (!found) throw new Error(`No __version__ in ${path}`)
  if (found !== browser) {
    throw new Error(
      `Library checkout is ${found}, but content/libdoc/LATEST is ${browser}.\n`
      + `Check out v${browser} in ${libraryRoot} before regenerating versions.json —\n`
      + `every version in it is read from that checkout.`,
    )
  }
}

assertCheckoutMatches()

const docker = dockerBase()

/*
 * Every version with a keyword reference on this site. Small enough for the
 * client — it is a list of strings — where the indexes themselves are not.
 *
 * Read from content/libdoc, which is committed, and not from the
 * app/generated/index payloads build-libdoc.ts renders one-for-one out of it:
 * those are gitignored, so on a clean clone — a CI checkout, most of all —
 * this crashed with ENOENT unless `pnpm libdoc` happened to have run first.
 */
const documented = readdirSync(join(ROOT, 'content/libdoc'))
  .filter(f => /^Browser-.+\.json$/.test(f))
  .map(f => f.slice('Browser-'.length, -'.json'.length))
  .sort((a, b) => {
    const x = a.split('.').map(Number)
    const y = b.split('.').map(Number)
    for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0)
    return 0
  })

const versions = {
  browser,
  documented,
  browserMinor,
  browserMajor: browser.split('.')[0]!,
  playwright: playwrightFromNotes(),
  node: bundledNode(),
  playwrightBundled: bundledPlaywright(),
  playwrightDockerImage: docker.image,
  playwrightDocker: docker.playwright,
}

mkdirSync(join(ROOT, 'app/generated'), { recursive: true })
writeFileSync(
  join(ROOT, 'app/generated/versions.json'),
  `${JSON.stringify(versions, null, 2)}\n`,
)

console.log('versions →  app/generated/versions.json')
for (const [k, v] of Object.entries(versions)) {
  console.log(`  ${k.padEnd(22)} ${Array.isArray(v) ? `${v.length} versions` : v}`)
}
