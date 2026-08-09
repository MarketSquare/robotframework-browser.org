/**
 * The versions this site documents, and the ones it does not.
 *
 * Two facts decide the list, and both are awkward enough to be worth stating
 * where everything can see them:
 *
 * - Release notes were reStructuredText until 19.12.0 and Markdown after it.
 *   The site renders the Markdown ones; the rest are linked to the archive
 *   rather than converted.
 * - Four releases were published, noted, and then yanked. They have notes but
 *   no installable artefact, so they are left out entirely — offering
 *   documentation for something nobody can install is a trap.
 */

/** Where older keyword documentation and older notes actually live. */
export const ARCHIVE = {
  /** Libdoc HTML for every release ever made, in the old design. */
  libdoc: (version: string) =>
    `https://marketsquare.github.io/robotframework-browser/versions/Browser-${version}.html`,
  /** The reStructuredText notes, and every note including the ones we render. */
  releaseNotes:
    'https://github.com/MarketSquare/robotframework-browser/tree/main/docs/releasenotes',
  /** All published releases, whatever their age. */
  releases: 'https://github.com/MarketSquare/robotframework-browser/releases',
} as const

/** Newest first. `20.10.0` must sort above `20.9.0`, so compare numerically. */
export function compareVersions(a: string, b: string): number {
  const x = a.split('.').map(Number)
  const y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (y[i] ?? 0) - (x[i] ?? 0)
  }
  return 0
}

export function sortVersions(versions: string[]): string[] {
  return [...versions].sort(compareVersions)
}
