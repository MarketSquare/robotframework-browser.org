/**
 * Deliberate line breaks in a heading.
 *
 * A headline sometimes reads better broken where the author wants it rather
 * than where the column happens to run out. Two ways to say so, because the
 * two places titles come from accept different things:
 *
 *   YAML block scalar    - |
 *                          Browser automation
 *                          that doesn't flake.
 *
 *   Escape in a string   title="Speed, reliability\nand visibility."
 *
 * The escape is what makes this work in an MDC attribute, where a real
 * newline cannot be typed.
 *
 * Rendering is CSS, not markup: the element carries `white-space: pre-line`,
 * so the break is a property of the text rather than a `<br>` spliced into it.
 * That keeps the string a string — which matters for the rotating headline,
 * where it is measured, diffed and scrambled character by character.
 */
export function withLineBreaks(text: string): string {
  return text.replace(/\\n/g, '\n')
}

/** The longest single line, for anything that budgets by width. */
export function longestLine(text: string): number {
  return Math.max(...withLineBreaks(text).split('\n').map(l => l.length))
}
