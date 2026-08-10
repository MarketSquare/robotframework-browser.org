---
title: Building your own image
description: Extending the published image with your dependencies, the version lock between Browser and Playwright, and using it as a CI job container.
order: 4
section: operations
---

The published image runs a plain Robot Framework suite. As soon as your suite
imports another library, needs a driver, or wants a specific Python version, you
need an image of your own.

The good news is that it is a handful of lines — the published image already
runs as `pwuser`, so the `USER` line below is only insurance. The thing to be careful
about is the version lock described further down — it is the one way to build an
image that looks fine and fails at runtime.

## Add your dependencies

```dockerfile [Dockerfile]
FROM marketsquare/robotframework-browser:%%browser%%

USER pwuser
COPY --chown=pwuser requirements.txt /home/pwuser/
RUN pip install --no-cache-dir -r /home/pwuser/requirements.txt
```

`pip` resolves to the virtualenv at `/home/pwuser/.venv`, which is already on
`PATH`, so there is no activation step.

Pin the base image to an exact release, not `latest`. A pipeline that rebuilds
weekly against `latest` will one day upgrade Browser under you, and the failure
will arrive on a day when nothing in your repository changed.

::doc-note{kind="warning"}
If a step needs root — installing a system package, say — switch back
afterwards:

```dockerfile
USER root
RUN apt-get update && apt-get install -y --no-install-recommends your-package \
    && rm -rf /var/lib/apt/lists/*
USER pwuser
```

Keep `pwuser` as the final `USER`. The image's dependencies and caches are set
up for that user, and running as root or any other user causes problems. See
[Running in Docker](/docs/operations/docker).
::

## Bake your suite in, or mount it?

Both are legitimate and they answer different questions.

::doc-table
---
head:
  - ""
  - Mount at run time
  - "`COPY` into the image"
rows:
  - - How
    - "`-v $(pwd)/tests:/test`"
    - "`COPY tests /home/pwuser/tests`"
  - - Edit-run cycle
    - Instant — no rebuild
    - Rebuild per change
  - - What the image is
    - A runtime
    - A versioned artifact of *this* suite
  - - Best for
    - Local development, and CI that checks the repo out anyway
    - Shipping a suite to somewhere that does not have your repository
---
::

Mounting is the right default. Reach for `COPY` when the image itself has to be
the deliverable — a smoke test handed to an ops team, for instance.

## The version lock

This is the part that bites.

Browser is built against **one specific Playwright version**, and the browser
binaries in the base image are the ones that Playwright version ships. Three
things must agree:

1. the Browser library,
2. the Playwright npm package Browser installs,
3. the browser binaries baked into the image.

The published image gets this right by construction: it starts from
`%%playwrightDockerImage%%`, and the Browser release it installs is built
against Playwright %%playwrightBundled%%. Those two can differ by a patch — the
`FROM` line is bumped by hand — so if you are chasing a binary-level mismatch,
compare them rather than assuming they agree.

**Upgrading Browser inside a derived image breaks that.** This looks harmless and
is not:

```dockerfile
FROM marketsquare/robotframework-browser:%%browser%%
RUN pip install --upgrade robotframework-browser   # don't
```

You now have a newer Browser expecting a newer Playwright, driving the browser
binaries of the older one. What happens next depends on how far apart they are —
which is worse than failing outright, because it can work for months and then
not.

To move to a newer Browser, **change the base image tag**. That is the entire
upgrade procedure, and it is the reason the tag exists.

If you genuinely must install a different Browser version in the same image, you
own the whole chain: reinstall the Node side and let it fetch matching binaries
(`rfbrowser clean-node && rfbrowser init`, which downloads a second, matching browser set — into the library's
`node_modules` when `PLAYWRIGHT_BROWSERS_PATH` is unset, otherwise wherever it
points, which in this base image is Playwright's own directory — while the base
image's binaries stay on disk, so you pay for both), or install browsers separately and
point `PLAYWRIGHT_BROWSERS_PATH` at them. Both give up what the image was for.

::doc-note
Verify with `rfbrowser --version`: it prints the Browser library, Robot Framework
and Playwright npm versions. It does **not** report the browser binaries, so it
cannot detect a base-image mismatch on its own, and it always exits 0 — running
it as a build step records the versions in the log rather than catching
anything.
::

## As a CI job container

Most CI systems can run a job *inside* an image, which removes the `docker run`
line entirely — your steps execute in the container, and the checkout is already
there.

```yaml [.github/workflows/tests.yml]
jobs:
  robot:
    runs-on: ubuntu-latest
    container:
      image: marketsquare/robotframework-browser:%%browser%%
      options: --ipc=host --user pwuser
    steps:
      - uses: actions/checkout@v7
      - run: robot --outputdir output tests/
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: robot-results
          path: output/
```

Two details are load-bearing. `--ipc=host` and `--user pwuser` still apply — a job
container gets no flags you do not give it. And `if: always()` on the upload:
without it the results are discarded on exactly the runs where you needed them.

## Building the official image yourself

The Dockerfiles live in
[`docker/`](https://github.com/MarketSquare/robotframework-browser/tree/main/docker)
in the library repository, and the same directory's README documents the local
build and the pull-request image. Reach for it if you need to reproduce the
official image with a change — a different Python version, a different base — or
if you are contributing to Browser itself.

```bash
cd docker
docker build --no-cache -t my-rfbrowser --file Dockerfile.latest_release .
```

For anything short of that, extending the published image is less work and stays
correct through upgrades.
