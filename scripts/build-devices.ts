/**
 * Playwright's device descriptors, for the table on /docs/mobile/device-list.
 *
 * The list a reader needs is the one their `Get Device` returns, which is the
 * one inside the Playwright that ships with the release we document — not
 * whatever Playwright's main branch holds today. So the version comes from
 * `app/generated/versions.json` (`playwrightBundled`) and the descriptors come
 * out of that exact package.
 *
 * Two things make this less obvious than "download the JSON":
 *
 * 1. `packages/isomorphic/deviceDescriptorsSource.json` in the repository is
 *    the *source*, and its user agents carry a `%s` that Playwright fills with
 *    the Chromium version it bundles. Reading the raw file would print a
 *    placeholder; reading a pinned commit's file would print some other
 *    release's Chromium. Measured against 1.62.1, a main-branch copy had 98 of
 *    207 user agents wrong — same device names, same viewports, different
 *    browser version. That is precisely the field somebody copies into a
 *    `New Context`.
 *
 *    So this loads the published package and reads the resolved `devices`
 *    object, which is what the library hands to Playwright at runtime.
 *
 * 2. The `screen` property is absent on most descriptors and present on 115 of
 *    them. It is kept as-is; a missing `screen` means the viewport is the
 *    screen, and inventing one would be a claim Playwright does not make.
 *
 * Needs the network, so — like `build-versions.ts` — it is NOT part of
 * `pnpm generate`. `app/generated/devices.json` is committed and refreshed by
 * `pnpm refresh`. `test/devices.spec.ts` asserts the committed file names the
 * same Playwright as `versions.json`, so a release that moves Playwright
 * without regenerating this fails the build instead of shipping a stale table.
 *
 * Usage: pnpm devices
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = process.cwd()

interface Viewport { width: number, height: number }

/** One descriptor, exactly the shape Playwright exposes. */
interface Device {
  userAgent: string
  viewport: Viewport
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: string
  screen?: Viewport
}

/** The Playwright the documented release bundles. */
const versions = JSON.parse(
  readFileSync(join(ROOT, 'app/generated/versions.json'), 'utf8'),
) as { playwrightBundled?: string }

const playwright = versions.playwrightBundled
if (!playwright) {
  throw new Error(
    'No playwrightBundled in app/generated/versions.json — run `pnpm versions` first.',
  )
}

/**
 * Unpack `playwright-core` into a scratch directory and read its `devices`.
 *
 * `npm pack` rather than an install: nothing is added to this project's
 * dependency tree, and the version is pinned exactly rather than resolved
 * through a range. The directory goes away either way.
 */
function descriptorsFor(version: string): Record<string, Device> {
  const dir = mkdtempSync(join(tmpdir(), 'rfb-devices-'))
  try {
    const spec = `playwright-core@${version}`
    const tarball = execFileSync('npm', ['pack', spec, '--silent'], {
      cwd: dir,
      encoding: 'utf8',
    }).trim()
    execFileSync('tar', ['xzf', tarball], { cwd: dir })

    /* `npm pack` always unpacks to `package/`. */
    const pkg = resolve(dir, 'package')
    const devices = createRequire(join(pkg, 'index.js'))(pkg).devices as
      | Record<string, Device>
      | undefined

    if (!devices || Object.keys(devices).length === 0) {
      throw new Error(`${spec} exposes no devices`)
    }
    return devices
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const source = descriptorsFor(playwright)

/*
 * Copied field by field rather than passed through.
 *
 * Playwright's runtime objects carry more than the documented properties,
 * and whatever it adds in a future release would otherwise land in a committed
 * file and in the client bundle without anyone choosing it.
 */
const devices: Record<string, Device> = {}
for (const name of Object.keys(source).sort((a, b) => a.localeCompare(b))) {
  const d = source[name]!
  devices[name] = {
    userAgent: d.userAgent,
    viewport: { width: d.viewport.width, height: d.viewport.height },
    deviceScaleFactor: d.deviceScaleFactor,
    isMobile: d.isMobile,
    hasTouch: d.hasTouch,
    defaultBrowserType: d.defaultBrowserType,
    ...(d.screen ? { screen: { width: d.screen.width, height: d.screen.height } } : {}),
  }
}

/*
 * One file, read only by `DeviceRows.server.vue`.
 *
 * It is not small — 84 KB, three quarters of it user agent strings — and that
 * is precisely why nothing imports it outside a server component. Bundling it
 * put 69 KB into every page's JavaScript and pushed the build 67 KB past the
 * ceiling in `check-bundle.mjs`; a version with the agents split out and
 * fetched on demand was still 34 KB over, because the ceiling had 2 KB of
 * headroom to begin with.
 *
 * So none of it reaches the client. The island renders the table as HTML and
 * the values the filters need ride along as `data-` attributes, which is the
 * same arrangement the keyword reference uses for its 651 KB.
 */
const out = join(ROOT, 'app/generated/devices.json')
writeFileSync(out, `${JSON.stringify({ playwright, devices }, null, 2)}\n`)

console.log(
  `${out}: ${Object.keys(devices).length} devices from playwright-core@${playwright}`
  + ` (${Math.round(readFileSync(out).length / 1024)} KB, server-only)`,
)
