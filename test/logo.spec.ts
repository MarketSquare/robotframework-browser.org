import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const svg = readFileSync(join(process.cwd(), 'public/logo/browser.svg'), 'utf8')

describe('browser.svg', () => {
  it('carries the new brand red, not the old one', () => {
    expect(svg).not.toContain('#e2574c')
    expect(svg).not.toContain('#d65348')
    expect(svg.toLowerCase()).toContain('#d63a2e')
    expect(svg.toLowerCase()).toContain('#b82e24')
  })

  it('carries no editor metadata', () => {
    expect(svg).not.toContain('sodipodi')
    expect(svg).not.toContain('inkscape')
    expect(svg).not.toContain('<metadata')
  })

  it('references no live font', () => {
    // A font-family reference silently falls back wherever OCR-A is absent.
    expect(svg).not.toContain('font-family')
    expect(svg).not.toContain('OCRA')
  })

  it('keeps the keyline light so the two cards stay separated', () => {
    // Verified by rendering: this white is a keyline that works by
    // contrasting with the black outline just inside it. Darkening it for a
    // light ground merges the two cards into one blob. It must not be themed.
    expect(svg).toMatch(/fill:\s*#fff\b/)
    expect(svg).toMatch(/stroke:\s*#fff\b/)
    expect(svg).not.toContain('currentColor')
  })

  it('is parseable and keeps its viewBox', () => {
    expect(svg.trimStart().startsWith('<svg')).toBe(true)
    expect(svg).toContain('viewBox="0 0 1664.2393 1219.0665"')
    const opens = (svg.match(/<(?!\/)(?!\?)[a-zA-Z]/g) ?? []).length
    const closes = (svg.match(/<\/[a-zA-Z]|\/>/g) ?? []).length
    expect(closes).toBe(opens)
  })

  it('is smaller than the source it was derived from', () => {
    const source = readFileSync(
      join(process.cwd(), '../robotframework-browser/browser_lib_logo.svg'),
      'utf8',
    )
    expect(svg.length).toBeLessThan(source.length)
  })
})
