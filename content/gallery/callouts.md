---
title: Callouts and tables
description: Three kinds of aside, and a table authored in frontmatter.
order: 7
---

::doc-note
Worth knowing, but not urgent.
::

::doc-note{kind="warning"}
This will bite you. Used for footguns and data loss.
::

::doc-note{kind="aside"}
Context or a dissenting view — not instruction.
::

::doc-table
---
head: [Component, Body is, Use for]
rows:
  - ['`::code-tabs`', 'Fenced blocks', 'Several files as tabs']
  - ['`::terminal-block`', 'Frontmatter', 'Shell sessions']
  - ['`::split-panes`', 'Two named slots', 'Anything side by side']
---
::
