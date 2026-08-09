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

describe('the version manifest', () => {
  it('documents the version whose Libdoc we render', () => {
    expect(versions.browser).toBe(LATEST)
  })

  it('derives the Docker tag families from it', () => {
    expect(versions.browserMinor).toBe(LATEST.split('.').slice(0, 2).join('.'))
    expect(versions.browserMajor).toBe(LATEST.split('.')[0])
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
    const src = readFileSync(file, 'utf8')
    // The current version, typed out, is the mistake this guards against.
    expect(src, `${name} hardcodes ${LATEST}; use %%browser%%`).not.toContain(LATEST)
  })

  it('substitutes every token it is given', () => {
    // A token the manifest does not know is a build error, not silent text.
    const known = new Set(Object.keys(versions))
    for (const file of files) {
      for (const [, name] of readFileSync(file, 'utf8').matchAll(/%%(\w+)%%/g)) {
        expect(known.has(name!), `${file}: unknown token %%${name}%%`).toBe(true)
      }
    }
  })

  it('uses a delimiter that cannot collide with Robot Framework syntax', () => {
    /*
     * `%{NAME}` is how Robot Framework reads an environment variable, and this
     * site documents several. Using it as a template delimiter would have
     * turned a page about %{PATH} into a build failure.
     */
    expect(read('nuxt.config.ts')).toContain('%%(\\w+)%%')
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
