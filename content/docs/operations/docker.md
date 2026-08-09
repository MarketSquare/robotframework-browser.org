---
title: Running in Docker
description: The published Browser image, the four docker run flags that matter, and why running as root breaks Chromium.
order: 3
section: operations
---

Browser needs a browser, and a browser needs a long list of system libraries that
differ between distributions. On a laptop `rfbrowser init` handles it. On a CI
runner, a colleague's machine, or a distribution nobody tested, it is the part
that goes wrong.

The published image removes that problem: Python, Node, Robot Framework, Browser
and the browser binaries that ship in Playwright's base image, in versions
known to work together.

## Pull it

The same image is published to two registries. Pick whichever your infrastructure
already authenticates against — the same recipe, built from one
Dockerfile in the same release job.

```bash
docker pull marketsquare/robotframework-browser:%%browser%%
docker pull ghcr.io/marketsquare/robotframework-browser/rfbrowser-stable:%%browser%%
```

::doc-table
---
head:
  - Tag
  - Points at
rows:
  - - "`%%browser%%`"
    - That exact release. **Use this in CI.**
  - - "`%%browserMinor%%`"
    - Latest patch of that minor. Picks up fixes, not features.
  - - "`%%browserMajor%%`"
    - Latest release of that major.
  - - "`latest`"
    - Whatever released most recently. Fine for a local experiment; a moving
      target in a pipeline.
---
::

Both `linux/amd64` and `linux/arm64/v8` are built, so it runs natively on an
Apple Silicon machine as well as on an x86 runner.

## Run your suite

```bash
docker run --rm \
  -v "$(pwd)/tests:/test" \
  --ipc=host \
  --user pwuser \
  --security-opt seccomp=seccomp_profile.json \
  marketsquare/robotframework-browser:%%browser%% \
  bash -c "robot --outputdir /test/output /test"
```

Your suite is mounted in rather than copied, and the output directory is inside
that same mount — which is what gets `log.html` back onto your machine after the
container exits. A container writing its report to its own filesystem and then
being removed is the classic first mistake.

The container writes as `pwuser`, not as your user, so the mounted directory has
to be writable by that account. If it is not, the run dies trying to create
`output/`. Create it up front and open it up — this project's own CI does
`mkdir output && chmod -R 777 output` — or skip the mount and `docker cp` the
results out afterwards.

## The flags, and why each one is there

None of these are ceremony. Each fixes a specific, confusing failure.

### `--user pwuser`

**Insurance, not a requirement.** The image already ends on `USER pwuser`, so it
runs as that user by default and this flag changes nothing — keep it only if
your platform is liable to force root. What matters is not overriding it with
`--user root`: everything is installed for `pwuser`, from the virtualenv at
`/home/pwuser/.venv` to the caches and file permissions, and running as root
causes failures that look like browser crashes.

::doc-note{kind="warning"}
Running as root, or as any user other than `pwuser`, is unsupported and causes
problems that look like Browser bugs. If a derived image needs root for a build
step, switch back with `USER pwuser` before the image is used.
::

### `--ipc=host`

`--ipc=host` is what this project recommends for Chromium, and it is what its
own container tests use. The reason comes from
[Playwright's Docker guide](https://playwright.dev/docs/docker) rather than from
Browser: Chromium allocates shared memory through `/dev/shm`, Docker's default is 64 MB,
which a real page will exhaust — and Chromium's response to running out is to
crash a renderer, mid-test, non-deterministically. It presents as flakiness, and
you will look for it in your test before you look for it in your container
runtime.

`--ipc=host` gives the container the host's IPC namespace and the problem
disappears. If your platform will not allow it, `--shm-size=2gb` is the
second-best answer.

### `--security-opt seccomp=seccomp_profile.json`

Chromium's sandbox needs syscalls that Docker's default seccomp profile
blocks. Playwright publishes a profile that permits exactly those:

```bash
wget https://raw.githubusercontent.com/microsoft/playwright/master/utils/docker/seccomp_profile.json
```

The alternative you will find on the internet is `--cap-add=SYS_ADMIN` or
`--no-sandbox`. Both work by turning the sandbox off. The seccomp profile keeps
it on, which for a container that loads arbitrary web pages is the difference
that matters.

::doc-note
The profile is Playwright's, not ours, and Playwright's
[Docker documentation](https://playwright.dev/docs/docker) is the place to check
if it stops matching a newer Chromium.
::

### `--rm`

Housekeeping. Test containers are disposable, and without it a CI runner
accumulates them until the disk fills.

## Headless and headful

The image is built on Microsoft's Playwright image, which includes the
dependencies for **headful** runs as well as headless. `New Browser` is headless
by default and that is what you want in CI — note that `Open Browser` defaults
the other way.

Headful needs a display, and the image already carries Xvfb: prefix the command
with `xvfb-run`, which is exactly what this project's own headful container
tests do. A VNC sidecar is only needed if you want to *watch* the run.

## What is actually in the image

Worth knowing, because it explains the constraints in
[Building your own image](/docs/operations/docker-images):

::doc-table
---
head:
  - Layer
  - What it provides
rows:
  - - "`%%playwrightDockerImage%%`"
    - Ubuntu Noble, Node.js, the browser binaries and every system library they
      need. The Playwright in the base image is whatever the Dockerfile's `FROM` line
pins, currently %%playwrightDocker%%, and that can lag the Playwright the
release is built
      against.
  - - Python 3.14 in a virtualenv
    - "`/home/pwuser/.venv`, already on `PATH`. `pip` inside the container
      installs into it."
  - - Robot Framework and Browser
    - Browser is installed from PyPI at an exact pin. Robot Framework is not
      pinned — the image gets whatever was current when it was built.
  - - "`init --skip-browsers`"
    - Browser's Node dependencies, **without** downloading browser binaries — the
      base image already has them.
---
::

That last row is the non-obvious one. The browsers in this image come from the
Playwright base image, not from `rfbrowser init`. It is why the image is far
smaller than an install that also downloads its own browser binaries, and it is
why the
Playwright version cannot drift from what Browser expects.

## Checking what you got

```bash
docker run --rm marketsquare/robotframework-browser:%%browser%% rfbrowser --version
```

Prints the Browser library version, the Robot Framework version and the
Playwright version in one go. When something behaves differently in the container
than on your machine, run it in both places first — the answer is usually in the
diff.

## Next

- Adding your own dependencies, and pinning safely:
  [Building your own image](/docs/operations/docker-images).
- If you run suites in parallel, read
  [The Node process](/docs/operations/node-process) first: each Robot Framework
  process starts its own Node process, inside a container as much as outside it.
