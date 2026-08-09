---
title: Page hero
description: The top of a landing page — logo, headline, lede, and whatever you put under it.
order: 10
---

:::page-hero{logo="/logo/browser.svg"}
#title
A headline in the display face.

#default
The default slot is the lede. Anything can follow it — buttons, figures, or
a [link](/why) — and it all sits in the column beside the logo.

::btn-row
:btn{to="/docs/start/getting-started" primary}[Primary]
:btn{to="/why"}[Secondary]
::
:::

Two named slots: `#title` for the headline and the default slot for everything
else. On a narrow screen the logo moves above the text rather than shrinking
into the corner.
