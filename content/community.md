---
title: Community
description: Browser is built by the people who use it. Where to find us, six ways to contribute — most of which are not code — and everyone who already has.
---

::::page-hero{logo="/logo/browser.svg"}
#title
Built by the people who use it.

#default
Browser library is built in the open by **206 people so far**, and supported by
companies who decided it was worth funding. Most of those people started the
same way: they found something, said something, and made it better. That is a
lower bar than it sounds, and you are already close enough to clear it.

:::btn-row
:btn{to="#ways" primary}[Ways to help]
:btn{to="#hall"}[The people]
:::
::::

::::page-section{label="Where we are" title="Come and say hello."}
Three places, and they are good at different things. None of them requires you
to have a bug, or to know what you are doing yet.

:::card-grid
::card{title="Slack — #browser" accent="red" to="https://robotframework.org/#community"}
The fast one. Half-formed questions welcome, and the people who wrote the
library read it. Join the Robot Framework workspace from the community section,
then find `#browser`.
::

::card{title="Forum" accent="teal" to="https://forum.robotframework.org/"}
The one that lasts. A forum thread is still findable in two years, which makes
it the better place for anything the next person will also wonder about.
::

::card{title="GitHub" accent="green" to="https://github.com/MarketSquare/robotframework-browser"}
Where the work happens — issues, pull requests, releases. Everything is decided
in the open, including the things we get wrong.
::
:::
::::

::::page-section{label="Ways to help" title="Contributing is not only pull requests." tone="panel" id="ways"}
Most of what keeps this library good is not code. It is people telling us what
broke, what confused them, and what they wish it did.

Below, roughly in order of how much setup they need — the first two cost nothing
but attention.

### 1. Tell us what you found

An issue is not a complaint, it is data. We cannot fix what nobody reports, and
we cannot prioritise what nobody asks for.

A good one takes ten minutes: what you ran, what you expected, what happened,
and your versions from `rfbrowser --version`. A short reproduction beats a long
description every time. Feature ideas are just as welcome — say what you are
trying to achieve rather than what API you want, and we can usually find
something better together.

:::btn-row
:btn{to="https://github.com/MarketSquare/robotframework-browser/issues/new/choose" primary}[Open an issue]
:::

### 2. Answer someone

You do not need to be an expert. If you solved something last month, you know
more about it than the person hitting it today.

Every answered question in Slack or the forum is a question the core team does
not have to answer — and, if you write it in the forum, one that answers itself
for everyone who searches later. This is the single highest-leverage thing a
happy user can do.

### 3. Improve the documentation

You are reading it. If a page is wrong, out of date, or explains the easy part
and skips the hard one, that is a bug, and it is one you are unusually well
placed to fix — you just hit it.

Docs changes need no development environment. The site's pages are Markdown in
the repository, and typo-sized fixes are perfectly welcome pull requests. So are
issues that just say "this paragraph made no sense to me".

### 4. Test main before it becomes a release

We do not ship release candidates, so there is nothing to wait for. Instead,
**every commit to main that passes CI builds an installable wheel**, and you can
have it within a minute of a fix landing.

Running it against your own suite for ten minutes is worth more than any amount
of testing we can do ourselves, because your suite does things ours never
thought of. It is also the only way a regression gets caught *before* it is in a
release rather than after.

Take the wheel from the latest green **Continuous integration** run on main —
Actions → the run → Artifacts → `rfbrowser-wheel` — then, in a throwaway
virtual environment rather than the one you work in:

```bash
pip install --force-reinstall robotframework_browser-*-py3-none-any.whl
rfbrowser clean-node
rfbrowser init
```

::doc-note{kind="warning"}
`clean-node` and `init` are not optional. The wheel carries a new Node side, and
skipping them leaves the previous one in place — so you end up testing a Python
half and a Node half that were never built together, and any failure tells you
nothing.
::

Tell us either way. "Ran our 400 tests against main, nothing broke" is genuinely
useful information, and it is the report we get least often.

::doc-note
Build artifacts need a GitHub account to download and are cleaned up after a
while, so take one from a recent run. This way of testing is new — if the steps
above do not work for you, that is worth an issue in itself.
::

### 5. Build a plugin, and publish it

Not everything belongs in the library. Browser has a plugin API and a JavaScript
extension mechanism precisely so that your idea does not have to wait for our
review — you can build it, publish it, and own it.

And then tell people it exists, which is the step everyone skips.
[robotframework-browser-extensions](https://github.com/MarketSquare/robotframework-browser-extensions)
collects the ones that work — accessibility checks with axe-core, visual
comparison, network throttling, request mocking, element highlighting. It is a
monorepo, not a registry: **if yours works, open a pull request and it goes in.**

That is also the strongest possible argument for bringing a feature into the
library itself. Something people are already installing has proven demand behind
it, and several features arrived exactly that way.

:::btn-row
:btn{to="/docs/extending/python-plugins" primary}[Extending Browser]
:btn{to="https://github.com/MarketSquare/robotframework-browser-extensions"}[Browse the extensions]
:::

### 6. Send a pull request

And yes — code. Bug fixes, keywords, tests, type hints.

Start by opening an issue or asking in Slack, unless the change is small. Not
gatekeeping: it is so nobody spends a weekend on something that turns out to
conflict with a change already in flight. The contribution guide covers the
development environment, the test suites and the conventions.

:::btn-row
:btn{to="https://github.com/MarketSquare/robotframework-browser/blob/main/CONTRIBUTING.md" primary}[Contribution guide]
:btn{to="https://github.com/MarketSquare/robotframework-browser/issues"}[Find an issue]
:::

::doc-note
Whichever of these you pick, you get added to the list below. The
[all-contributors](https://allcontributors.org/) bot tracks every kind of
contribution, not just commits — because a bug report that saved a release is
not worth less than the patch that fixed it.
::
::::

::::page-section{label="Who keeps it running" title="The core team."}
::core-team
::
::::

::::page-section{label="Hall of fame" title="Everyone who built this." tone="panel" id="hall" last}
206 people, and counting. Filter by what they did — most of them never wrote a
line of code for Browser, which is rather the point.

::contributor-wall
::

Missing from this list, or listed wrongly? Say so in an issue — being forgotten
is a bug too.

### Who pays for it

Open source is not the same as free to produce. Some of the work above was paid
for, and it is worth being specific about by whom:

- **[Robocorp](https://robocorp.com/)** funded the initial development. Browser
  exists in the first place because they backed it.
- The **[Robot Framework Foundation](https://robotframework.org/foundation/)**
  has funded development several times since, out of its members' fees.
- **[imbus](https://www.imbus.de/)** sponsors development time for one of the
  maintainers, so that maintenance is somebody's job rather than only their
  evenings.

None of that makes Browser a product with a vendor behind it — the roadmap is
still decided in the open, by the people doing the work. But if your company
depends on this library, [joining the Foundation](https://robotframework.org/foundation/)
is a way to contribute that costs nobody their spare time, and it is what keeps
the funded work funded.
::::
