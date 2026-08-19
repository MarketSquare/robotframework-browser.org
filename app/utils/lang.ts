/**
 * Language identifiers and labels. Deliberately free of any grammar or
 * highlighter import.
 *
 * Editor.vue needs LANG_LABEL on the client. When this lived alongside the
 * `import rfGrammar from '...tmLanguage.json'` statements, that one import
 * pulled 256 KB of TextMate JSON into every client bundle. Keeping the
 * client-facing half in its own module is what keeps the grammars server-only.
 */
import type { BundledLanguage } from 'shiki'

/** Full suites, with *** Settings *** / *** Test Cases ***. */
export const ROBOT = 'robot'

/** Bare keyword sequences — the shape of Libdoc-extracted examples. */
export const ROBOT_REPL = 'robot-repl'

export type Lang = typeof ROBOT | typeof ROBOT_REPL | BundledLanguage

export const THEME = 'rfb-plate'

/** Shown in the Editor status strip. Never exposes our plumbing names. */
export const LANG_LABEL: Record<string, string> = {
  [ROBOT]: 'Robot Framework',
  [ROBOT_REPL]: 'Robot Framework',
  python: 'Python',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  bash: 'Bash',
  json: 'JSON',
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  html: 'HTML',
}
