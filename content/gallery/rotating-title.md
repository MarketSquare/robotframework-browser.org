---
title: Rotating title
description: A headline that cycles through alternatives, decoding each one out of the last. Starts on a random line, pauses on hover, and does nothing at all under prefers-reduced-motion.
order: 8
---

:::rotating-title
---
every: 3000
titles:
  - "Browser automation that doesn't flake."
  - "Browser automation that doesn't suck."
  - "Browser automation\nbroken where you want it."
  - "Browser automation that sees shadow DOM."
---
:::

Shown here at three seconds; the landing page holds each headline for five.
Only the characters that differ from the previous headline scramble — which is
why "Browser automation" sits still.

The third headline shows a **deliberate line break**: `\n` in the string breaks
the line there rather than wherever the column runs out. It works the same way
in `::page-hero`'s `#title` and in `::page-section{title="…"}`, and it is
rendered with `white-space: pre-line` rather than a `<br>`, so the headline
stays one string — which is what lets the scramble measure and diff it.
