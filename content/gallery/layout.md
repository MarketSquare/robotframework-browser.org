---
title: Layout
description: Sections, grids and cards. These nest — a grid inside a section, cards inside a grid.
order: 1
---

::::page-section{label="Eyebrow label" title="A section heading"}
A section owns its own padding and bottom rule, so a page is just a stack of
them. `tone="panel"` tints it, for alternating bands.

:::card-grid{min="14rem"}
::card{title="Plain card"}
No accent. Body is Markdown, so links and `code` work.
::

::card{title="Green accent" accent="green"}
The accent is painted rather than bordered, so it follows the bevel.
::

::card{title="Red accent" accent="red"}
Use red for something actionable, green for something structural.
::
:::
::::
