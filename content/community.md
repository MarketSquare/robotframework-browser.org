---
title: Community
description: Browser is built by the people who use it. Where to find us, six ways to contribute — most of which are not code — and everyone who already has.
---

::::page-hero{logo="/logo/browser.svg"}
#title
Built by the people who use it.

#default
Browser library has no company behind it and no support contract. It has a
community — **206 people so far** — who found something, said something, and
made it better. That is a lower bar than it sounds, and you are already close
enough to clear it.

:::btn-row
:btn{to="#ways" primary}[Ways to help]
:btn{to="#hall"}[The people]
:::
::::

::::page-section{label="Where we are" title="Come and say hello."}
Two places, and they answer different questions. Neither of them requires you to
have a bug, or to know what you are doing yet.

:::card-grid
::card{title="Slack — #browser" accent="red" to="https://slack.robotframework.org/"}
The fast one. Half-formed questions welcome, and the people who wrote the
library read it. Join the Robot Framework workspace, then find `#browser`.
::

::card{title="Forum" accent="teal" to="https://forum.robotframework.org/c/libraries/browser"}
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

### 4. Test a release before it is one

Every release is preceded by a release candidate, announced in Slack and on the
forum. Installing it against your own suite for ten minutes is worth more than
any amount of testing we can do ourselves, because your suite does things ours
never thought of.

```bash
pip install --pre --upgrade robotframework-browser
```

Tell us either way. "Ran our 400 tests, nothing broke" is genuinely useful
information, and it is the report we get least often.

### 5. Build a plugin, and publish it

Not everything belongs in the library. Browser has a plugin API and a JavaScript
extension mechanism precisely so that your idea does not have to wait for our
review — you can build it, publish it, and own it.

If it turns out lots of people need it, that is the strongest possible argument
for bringing it into the library. Several features arrived that way.

:::btn-row
:btn{to="/docs/extending/python-plugins" primary}[Extending Browser]
:btn{to="https://github.com/MarketSquare"}[MarketSquare on GitHub]
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

**Supported by** [Robocorp](https://robocorp.com/) through the
[Robot Framework Foundation](https://robotframework.org/foundation/), whose
funding is why this library got built at all.

Missing from this list, or listed wrongly? Say so in an issue — being forgotten
is a bug too.
::::
