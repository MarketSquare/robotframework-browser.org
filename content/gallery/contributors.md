---
title: Contributors
description: The core team and the full contributor wall, both generated from the library's all-contributors data.
order: 11
---

::core-team
::

These two are data components rather than layout: they read
`content/contributors.json`, which `scripts/build-contributors.ts` generates
from the library's `.all-contributorsrc`. There is nothing to pass them.

`::contributor-wall` renders every contributor with a filter by kind of
contribution; `::contributor-wall{compact}` renders faces only, which is what
the foot of the landing page uses. Neither is shown here — 206 avatars would
make this page about them rather than about the component.

Both are islands, so the data never reaches the browser.
