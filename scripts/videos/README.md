# Documentation videos

The screen recordings in `public/videos/` are made by the Robot Framework suites in this
folder, so they can be recorded again when the library or the site changes.

```bash
pip install robotframework-browser   # a version with Record Keyword
rfbrowser init chromium
robot --outputdir /tmp/videos scripts/videos/          # writes raw/*.webm and raw/*.resource
sh scripts/videos/render.sh                            # raw/*.webm -> public/videos/recorder/*.mp4 + .jpg
```

- `video.resource` drives the page at a human pace: the mouse glides, text is typed with a
  delay, every click pauses.
- `video-helpers.cjs` is a Browser library JavaScript extension. Playwright's screen recording
  shows no mouse pointer, so it injects one, with a ripple on each click; it also parks the
  recorder toolbar in the bottom right corner and keeps a handle on its shadow root, so the
  scripts can click its buttons.
- The browser runs headless with `recorder_allows_headless`, the switch the library's own
  acceptance tests use.
- `raw/*.resource` are the keywords recorded during the videos; the documentation quotes them.

What each suite makes:

| Suite | Output |
|-------|--------|
| `01`, `02`, `04`, `05` | Walkthrough videos with controls, on robotframework-browser.org |
| `03` | A short silent loop on `pages/create-account.html`, the example of the Keyword Arguments page; `09` shoots its argument dialog and replace offer on the same page |
| `06`, `08` | Short silent loops on the login page of car.keyword-driven.de (HTTP; the HTTPS certificate has expired). `render.sh` crops them to the form and the toolbar beside it and drops the first 1.2 s, so a loop does not flash white |
| `09-screenshots.robot` | Stills of the toolbar in `public/images/recorder/`, at twice the pixel density, without the drawn pointer and with the recording dot fully lit |

A loop ends by closing its page, which ends the session cleanly with the toolbar still in
view. Closing the context instead makes `Record Keyword` fail ("No browser context is open").

`raw/` is not committed.
