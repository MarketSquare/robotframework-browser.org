---
title: Comparison
description: Two real files side by side, read from examples/ at build time, with an expandable divider and structural notes underneath.
order: 9
---

::comparison{left="comparison/cypress/test.robot" right="comparison/cypress/test.cy.js"}
---
notes:
  - Each pane keeps its own language and its own horizontal scroll.
  - The line count is stated as a measurement; the notes are prose, so they are set in body type rather than the display face.
---
::

The filenames and languages come from the paths — a tab cannot disagree with
the file it shows. `notes` is optional; the line count is added for you.
