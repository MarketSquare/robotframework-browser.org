import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The device table is only useful if it matches the reader's own `Get Device`.
 *
 * `app/generated/devices.json` is built from `playwright-core` at the version
 * the documented release bundles, and committed. Nothing at build time reaches
 * the network to check it, so a release that moves Playwright without a
 * `pnpm devices` would ship a table describing the previous one — with no
 * symptom, because every number in it is still well-formed.
 *
 * These assertions are that symptom.
 */
const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

interface Viewport { width: number, height: number }
interface Device {
  userAgent: string
  viewport: Viewport
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  defaultBrowserType: string
  screen?: Viewport
}

const versions = JSON.parse(read('app/generated/versions.json')) as Record<string, string>
const manifest = JSON.parse(read('app/generated/devices.json')) as {
  playwright: string
  devices: Record<string, Device>
}
const entries = Object.entries(manifest.devices)

describe('the device manifest', () => {
  it('was built from the Playwright the documented release bundles', () => {
    expect(manifest.playwright).toBe(versions.playwrightBundled)
  })

  it('holds the descriptors Playwright actually ships', () => {
    /* A floor, not the exact count: Playwright adds handsets every release. */
    expect(entries.length).toBeGreaterThan(150)
    expect(manifest.devices['iPhone 13']).toBeDefined()
    expect(manifest.devices['Pixel 7']).toBeDefined()
    expect(manifest.devices['Desktop Chrome']).toBeDefined()
  })

  it('is imported only by the server component', () => {
    /*
     * 84 KB. Importing it into a client component put the build 67 KB past the
     * ceiling in check-bundle.mjs. The island renders it to HTML instead, and
     * DeviceTable.vue reads what it needs back out of `data-` attributes.
     */
    expect(read('app/components/DeviceRows.server.vue')).toContain("generated/devices.json")
    expect(read('app/components/content/DeviceTable.vue')).not.toContain('generated/devices')
  })

  it('carries a resolved user agent, not the source placeholder', () => {
    /*
     * The descriptor source in Playwright's repository writes the browser
     * version as `%s`, filled in at runtime. Reading that file instead of the
     * package would put the placeholder — or another release's Chromium — in
     * the one column people copy out of the table.
     */
    for (const [name, d] of entries) {
      expect(d.userAgent, name).not.toContain('%s')
      expect(d.userAgent, name).toMatch(/^Mozilla\/5\.0 /)
    }
  })

  it('describes every device completely', () => {
    for (const [name, d] of entries) {
      expect(d.viewport.width, name).toBeGreaterThan(0)
      expect(d.viewport.height, name).toBeGreaterThan(0)
      expect(d.deviceScaleFactor, name).toBeGreaterThan(0)
      expect(typeof d.isMobile, name).toBe('boolean')
      expect(typeof d.hasTouch, name).toBe('boolean')
      expect(['chromium', 'firefox', 'webkit'], name).toContain(d.defaultBrowserType)
    }
  })

  it('carries no properties beyond the seven the table documents', () => {
    /*
     * The generator copies field by field precisely so a future Playwright
     * cannot slip an extra property into a committed file and the client
     * bundle unnoticed. This is that intent, asserted.
     */
    const allowed = new Set([
      'userAgent', 'viewport', 'deviceScaleFactor',
      'isMobile', 'hasTouch', 'defaultBrowserType', 'screen',
    ])
    for (const [name, d] of entries) {
      for (const key of Object.keys(d)) expect(allowed, `${name}.${key}`).toContain(key)
    }
  })

  it('keeps landscape variants as their own descriptors', () => {
    /*
     * The table shows them as separate rows rather than a rotation toggle,
     * because on the foldables landscape is not the portrait viewport with its
     * axes swapped — the browser chrome is a different height across. If that
     * ever stopped being true the rows could be collapsed; until then, folding
     * them would print numbers Playwright does not report.
     */
    const swapped = entries.filter(([name, d]) => {
      const portrait = manifest.devices[name.replace(/ landscape$/, '')]
      return name.endsWith(' landscape') && portrait
        && portrait.viewport.width === d.viewport.height
        && portrait.viewport.height === d.viewport.width
    })
    const all = entries.filter(([name]) => name.endsWith(' landscape'))
    expect(all.length).toBeGreaterThan(0)
    expect(swapped.length).toBeLessThan(all.length)
  })
})
