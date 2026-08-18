import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Version numbers belong to the library, not to our prose.
 *
 * Every `docker pull` line, install transcript and "compared against" note
 * used to carry a hand-typed version, so a release left the site quietly wrong
 * in a dozen places at once. They are `%%browser%%` and friends now,
 * substituted at build time from the library itself.
 */
const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

const versions = JSON.parse(read('app/generated/versions.json')) as Record<string, string>
const LATEST = read('content/libdoc/LATEST').trim()

/** Content files, excluding the ones that legitimately quote old versions. */
function contentFiles(dir = join(ROOT, 'content')): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const path = join(dir, e.name)
    if (e.isDirectory()) {
      // Release notes are historical records; a note for 20.1.0 says 20.1.0.
      return e.name === 'releases' || e.name === 'libdoc' ? [] : contentFiles(path)
    }
    return e.name.endsWith('.md') ? [path] : []
  })
}

/**
 * `:since{version="20.4.0"}` — the release a behaviour arrived in.
 *
 * See the exemption test below for why this one number is written by hand. Both
 * colon forms are matched so that `::since{}` is stripped too: it is the wrong
 * form and the test below says so by name, which beats failing the hardcoded
 * release check with a message about a token.
 */
const SINCE = /(:{1,2})since\{[^}]*version="([^"]*)"[^}]*\}/g

const withoutSince = (src: string) => src.replaceAll(SINCE, '')

describe('the version manifest', () => {
  it('documents the version whose Libdoc we render', () => {
    expect(versions.browser).toBe(LATEST)
  })

  it('derives the Docker tag families from it', () => {
    expect(versions.browserMinor).toBe(LATEST.split('.').slice(0, 2).join('.'))
    expect(versions.browserMajor).toBe(LATEST.split('.')[0])
  })

  it('has the two documents that make a version a version', () => {
    /*
     * The release workflow bumps LATEST, generates the Libdoc and imports the
     * release note as three separate steps against three separate sources.
     * Any one of them failing leaves a site that builds perfectly and serves a
     * keyword reference for a version with no notes, or a version picker whose
     * newest entry 404s. This is the assertion that turns that into a red
     * build, and it is the reason the workflow can open a PR unattended.
     */
    expect(existsSync(join(ROOT, `content/libdoc/Browser-${LATEST}.json`)), 'libdoc').toBe(true)
    expect(existsSync(join(ROOT, `content/releases/${LATEST}.md`)), 'release note').toBe(true)

    const spec = JSON.parse(read(`content/libdoc/Browser-${LATEST}.json`)) as { version: string }
    // A file can be named for one version and describe another; libdoc's own
    // field is the one that decides what the keyword pages actually say.
    expect(spec.version, 'the Libdoc describes a different version').toBe(LATEST)
  })

  it('keeps the tested Playwright separate from the image one', () => {
    /*
     * They are allowed to differ, and did at the time of writing: 20.3.0 was
     * tested against 1.62.1 while the published image was still built on
     * 1.62.0. Quoting one for the other misleads exactly the reader who is
     * debugging a container.
     */
    expect(versions.playwright).toMatch(/^\d+\.\d+\.\d+$/)
    expect(versions.playwrightDocker).toMatch(/^\d+\.\d+\.\d+$/)
    expect(versions.playwrightDockerImage).toContain(versions.playwrightDocker)
  })
})

describe('content quotes versions by token, not by hand', () => {
  const files = contentFiles()

  it('finds content to check', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files.map(f => [f.slice(ROOT.length + 1), f]))('%s has no hardcoded release', (name, file) => {
    // `files` holds absolute paths; read() prepends the root.
    const src = withoutSince(readFileSync(file, 'utf8'))
    // The current version, typed out, is the mistake this guards against.
    expect(src, `${name} hardcodes ${LATEST}; use %%browser%%`).not.toContain(LATEST)
  })

  it('writes every :since{} inline, naming a full release', () => {
    /*
     * The one documented exception, and the reason it is narrow.
     *
     * "New in Browser 20.4.0" is a historical fact: it stays true forever and
     * a token would destroy it, because %%browser%% means *the release this
     * site documents* and reads 21.x a year from now. Everything else naming a
     * version — an install transcript, a `docker pull`, a "tested against" —
     * has to track the library instead, and is what the check above defends.
     *
     * So the exemption is the component, not the file: the check above still
     * runs over the rest of the file, and the current release typed out
     * anywhere else in it still fails.
     */
    const used = files.flatMap(f => [...readFileSync(f, 'utf8').matchAll(SINCE)].map(m => ({
      file: f.slice(ROOT.length + 1),
      colons: m[1]!,
      version: m[2]!,
    })))

    // Vacuity guard, as everywhere else in this suite: the exemption above
    // strips whatever this matches, so a regex that silently stops matching
    // would take this check down with it and stay green.
    expect(used.length, 'no :since{} found — has the component been renamed?').toBeGreaterThan(0)

    for (const { file, colons, version } of used) {
      // Since.vue renders a span, so it is an inline component. `::since{}`
      // renders it as a block and reads as a section heading it is not.
      expect(colons, `${file}: write :since{} inline, not ${colons}since{}`).toBe(':')
      expect(version, `${file}: :since{version="${version}"} is not a full release`).toMatch(
        /^\d+\.\d+\.\d+$/,
      )
    }
  })

  it('substitutes every token it is given', () => {
    /*
     * A token nothing knows is a build error, not silent text — and silent is
     * exactly how it fails: the literal `%%stars%%` renders into the page.
     *
     * The three sources have to match app/utils/version-tokens.ts, which is
     * what actually resolves them at render time: the library's own versions,
     * the project figures fetched by `pnpm project`, and the keyword count
     * taken from the reference index so it cannot drift from the reference.
     */
    const project = JSON.parse(read('content/project.json')) as Record<string, unknown>
    const known = new Set([...Object.keys(versions), ...Object.keys(project), 'keywords'])
    for (const file of files) {
      for (const [, name] of readFileSync(file, 'utf8').matchAll(/%%(\w+)%%/g)) {
        expect(known.has(name!), `${file}: unknown token %%${name}%%`).toBe(true)
      }
    }
  })

  it('resolves the project figures as strings, or they render as the raw token', () => {
    /*
     * `resolveTokenString` only substitutes when the table holds a string, and
     * project.json holds numbers. Without the coercion the landing page shipped
     * `Stars: %%stars%%` — built, tested and deployed without complaint.
     */
    const util = read('app/utils/version-tokens.ts')
    for (const key of ['stars', 'releases', 'contributors']) {
      expect(util, `${key} must be stringified into the token table`).toMatch(
        new RegExp(`${key}: String\\(`),
      )
    }
  })

  it('uses a delimiter that cannot collide with Robot Framework syntax', () => {
    /*
     * `%{NAME}` is how Robot Framework reads an environment variable, and this
     * site documents several. Using it as a template delimiter would have
     * turned a page about %{PATH} into a build failure.
     */
    expect(read('app/utils/version-tokens.ts')).toContain('%%(\\w+)%%')
  })

  it('resolves at render time, never by rewriting the source', () => {
    /*
     * A `content:file:beforeParse` hook used to substitute tokens in the
     * Markdown body. That made the parsed content and the file on disk
     * disagree, and Nuxt Studio seeds its editor from the parsed side: opening
     * a page in Studio -- without editing or saving -- wrote the resolved
     * version numbers back into the file and destroyed every token in it.
     */
    // The name appears in that file's own comment explaining why it is absent,
    // so match the hook declaration rather than the word.
    expect(read('nuxt.config.ts'), 'the source-mutating hook is back').not.toMatch(
      /['"]content:file:beforeParse['"]\s*\(/,
    )
  })
})

describe.skipIf(!existsSync(join(ROOT, '.output/public')))('the built site', () => {
  it('leaves no token unsubstituted', () => {
    const dist = join(ROOT, '.output/public')
    const pages: string[] = []
    const walk = (dir: string) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name))
        else if (e.name.endsWith('.html')) pages.push(join(dir, e.name))
      }
    }
    walk(dist)
    expect(pages.length).toBeGreaterThan(10)
    for (const page of pages) {
      expect(readFileSync(page, 'utf8'), page).not.toMatch(/%%\w+%%/)
    }
  })
})
