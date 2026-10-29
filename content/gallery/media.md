---
title: Figures and videos
description: An image or a short screen recording, each with a caption.
order: 8
---

::doc-video{src="/videos/recorder/quick-start.mp4" poster="/videos/recorder/quick-start.jpg" alt="A recording session on robotframework-browser.org: the pointer opens Keywords, searches for Get Text and opens it, while the recorder toolbar lists each step."}
`::doc-video` plays silently in a loop while it is on screen, with controls to
pause and scrub; under reduced motion it waits for a click. `alt` describes the
recording, the body is the caption.
::

::doc-video{src="/videos/recorder/loop-pause.mp4" poster="/videos/recorder/loop-pause.jpg" alt="A user name is recorded, the recording is paused, a password typed meanwhile is not recorded, and after Resume the click on login is." :controls="false"}
With `:controls="false"` a short loop reads like an animated image. Under reduced
motion it still gets controls, since it does not play by itself then.
::

::doc-figure{src="/images/color-toggle.png" alt="The colour theme toggle in the site header"}
`::doc-figure` is the still counterpart.
::
