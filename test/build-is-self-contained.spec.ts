import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * A build must work from a clean clone, with no sibling repository and no
 * network.
 *
 * It did not. `pnpm generate` ran `pnpm versions`, which reads
 * `nodejs_pin.toml`, `package.json` and `docker/Dockerfile.latest_release`
 * from a checkout of the library next door — so the deploy workflow would have
 * failed the first time it ran, in CI, on the push that connected the repo.
 * Nothing caught it because the sibling checkout is always there on the machine
 * this was written on.
 *
 * The scripts that reach outside are `pnpm refresh` now, run by a maintainer or
 * by the release workflow, and what they produce is committed.
 */
const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

/** Scripts that read the library checkout or the network. */
const NEEDS_OUTSIDE = ['versions', 'releases', 'contributors']

describe('the build is self-contained', () => {
  it.each(['build', 'generate'])('`pnpm %s` runs nothing that needs the library', script => {
    const body = pkg.scripts[script]!
    for (const outside of NEEDS_OUTSIDE) {
      expect(body, `${script} runs pnpm ${outside}`).not.toMatch(new RegExp(`\\bpnpm ${outside}\\b`))
    }
  })

  it('offers one command that does refresh everything', () => {
    // So the split does not simply lose the ability to update.
    const refresh = pkg.scripts.refresh ?? ''
    for (const outside of NEEDS_OUTSIDE) expect(refresh).toContain(`pnpm ${outside}`)
  })

  // An extracted archive is not a repository; there is nothing to ask git.
  const inGitRepo = existsSync(join(ROOT, '.git'))

  it.skipIf(!inGitRepo)('commits everything the build reads', () => {
    /*
     * Tracked by git, not merely present on disk. The first version of this
     * test checked the filesystem and passed while app/generated/versions.json
     * was gitignored — a fresh clone could not even run `pnpm install`,
     * because nuxt.config.ts reads that file while loading the config.
     */
    const tracked = (path: string) => {
      const out = execFileSync('git', ['ls-files', '--', path], { cwd: ROOT, encoding: 'utf8' })
      return out.trim().length > 0
    }

    for (const path of [
      'app/generated/versions.json',
      'content/libdoc/LATEST',
      'content/contributors.json',
      'public/CNAME',
      'public/robots.txt',
    ]) {
      expect(tracked(path), `${path} is not committed`).toBe(true)
    }
    expect(tracked('content/releases'), 'release notes are not committed').toBe(true)
    expect(tracked('public/avatars'), 'avatars are not committed').toBe(true)
  })

  it.skipIf(!inGitRepo)('vendors every asset it renders', () => {
    /*
     * The Robot Framework mark, the OCR-A and IBM Plex faces, the robotcode
     * grammars and the plate theme all originate in other repositories. They
     * are copies here on purpose: a build must not depend on
     * robotframework/visual-identity or on the library checkout being present.
     *
     * The mark is inlined as geometry in RobotMark.vue rather than kept as a
     * file, so it is checked separately below.
     */
    const tracked = (path: string) =>
      execFileSync('git', ['ls-files', '--', path], { cwd: ROOT, encoding: 'utf8' }).trim().length > 0

    for (const path of ['syntaxes', 'themes', 'public/fonts', 'public/logo']) {
      expect(tracked(path), `${path} is not vendored`).toBe(true)
    }
    for (const font of ['ocr-a.woff', 'plex-sans-400.woff2', 'plex-sans-600.woff2', 'plex-mono-400.woff2']) {
      expect(tracked(`public/fonts/${font}`), `${font} is not vendored`).toBe(true)
    }
    // Geometry, not a fetch or a build-time copy.
    expect(read('app/components/RobotMark.vue')).toContain('<path d="m 0,0 c 0,7.6')
  })

  it('carries the custom domain in the published output', () => {
    // Pages deployed from an artifact drops the domain without this.
    expect(read('public/CNAME').trim()).toBe('robotframework-browser.org')
  })

  it('tells crawlers where the sitemap is', () => {
    const robots = read('public/robots.txt')
    expect(robots).toContain('Sitemap: https://robotframework-browser.org/sitemap.xml')
    expect(robots).not.toMatch(/^\s*Disallow:\s*\/\s*$/m)
  })
})

describe('the sitemap', () => {
  const built = existsSync(join(ROOT, '.output/public/sitemap.xml'))

  it.skipIf(!built)('lists every page once, and no payloads', () => {
    const xml = read('.output/public/sitemap.xml')
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!)
    expect(locs.length).toBeGreaterThan(30)
    expect(new Set(locs).size, 'duplicate URLs').toBe(locs.length)
    for (const loc of locs) {
      expect(loc).not.toContain('_payload')
      expect(loc).not.toContain('/_nuxt')
    }
  })

  it.skipIf(!built)('omits the current version, which duplicates /keywords', () => {
    /*
     * And keeps the older ones, which are different documents. Excluding all
     * of them was the first attempt and would have hidden eleven pages.
     */
    const latest = read('content/libdoc/LATEST').trim()
    const xml = read('.output/public/sitemap.xml')
    expect(xml).not.toContain(`/keywords/${latest}<`)
    expect(xml).toContain('/keywords/19.12.4<')
  })
})
