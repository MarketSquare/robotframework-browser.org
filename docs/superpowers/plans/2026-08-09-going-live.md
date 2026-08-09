# Going live

**Date:** 2026-08-09
**Status:** Plan for review — nothing executed
**Goal:** Move this site into `MarketSquare/robotframework-browser.org`, make it build and deploy itself, and make a library release update it automatically.

---

## What we found before planning

Four facts that change the shape of the work.

**1. The domain is already in the target repo.** `master` of
`MarketSquare/robotframework-browser.org` contains `CNAME:
robotframework-browser.org`, and that repo serves the live site today. The
design spec (§14) assumed a *new* repo, with a `github.io` preview and a CNAME
move at the end. That is not the situation: we are replacing a branch inside the
repo that already owns the domain.

**The consequence is important.** GitHub Pages has one source per repository, so
the moment the Pages source is switched from `master` to GitHub Actions, the new
site is live on the real domain. There is no intermediate state where both exist.
Every review has to happen on the surge preview *before* that switch, and the
switch itself is the point of no return (recoverable by switching back, but the
domain is live in between).

**2. The deploy workflow has never run and would fail today.** `pnpm generate`
runs `pnpm versions`, which reads `nodejs_pin.toml`, `package.json` and
`docker/Dockerfile.latest_release` from a sibling checkout of the library. In CI
there is no sibling checkout, so the build dies:

```
ENOENT: /private/tmp/robotframework-browser/docker/Dockerfile.latest_release
```

Verified by running it in a clean directory. This has to be fixed before the
repo is connected, or the first push fails visibly.

**3. The old site's history should not be destroyed.** `master` is the current
production site. It becomes an archive branch, not a deletion.

**4. The reference pattern is a good fit.** `imbus/testbench-ai-service` fires
`repository_dispatch` on release; `imbus/testbench-ecosystem-documentation`
receives it, rebuilds, publishes a surge preview and opens a PR whose body
carries the preview URL and a review checklist. That is exactly the shape we
want, with one difference: our receiver has to *regenerate* content from the
library rather than copy a `docs/` folder.

---

## Phase 1 — Make the build self-sufficient

Nothing here touches the remote. It is the prerequisite for everything else.

| # | Task | Why |
|---|---|---|
| 1.1 | Make `build-versions.ts` fall back to the committed `app/generated/versions.json` when the library checkout is absent, and only regenerate when it is present | CI has no sibling checkout; today the build fails |
| 1.2 | Same treatment for `build-releases.ts` and `build-contributors.ts` — they already write committed output, but they must not be on the default build path | A build must never need the network or a second repo |
| 1.3 | Split the scripts: `pnpm generate` (build only, offline) and `pnpm refresh` (regenerate everything from the library) | One command for CI, one for a maintainer or the release bot |
| 1.4 | Add `public/CNAME` with `robotframework-browser.org` | With Actions deployment the artifact carries the domain; without it the custom domain can be dropped on deploy |
| 1.5 | Add `public/robots.txt` and a generated `sitemap.xml` for all 118 routes | Missing; found by the Lighthouse pass |
| 1.6 | A test that fails if `pnpm generate` would touch the network or the sibling repo | This is exactly the failure that hid until now |

**Done when:** `pnpm install && pnpm generate` succeeds in a clean clone with no
sibling checkout and no network.

---

## Phase 2 — Connect the repository

| # | Task | Notes | Status |
|---|---|---|---|
| 2.1 | `git remote add origin` and push `main` | New branch; touches nothing that is live | **done** — `main` at `ef4812e` |
| 2.2 | Branch `legacy-site` off `master` | Keeps the old site and its history addressable | **done** — both at `7d82a58`; `master` kept, not renamed |
| 2.3 | Set the default branch to `main` | Affects PRs and clones, not the live site | open |
| 2.4 | Add repository secrets: `SURGE_TOKEN`, `SURGE_LOGIN` | For PR previews | open |
| 2.5 | Protect `main`: require the test workflow to pass | The release bot opens PRs against it | open |

The first push proved Phase 1: `Deploy` ran on `main` and went green — `test`
(full `pnpm verify`) and `build` succeeded, the two Pages steps and the `deploy`
job skipped on `vars.PAGES_LIVE`, and the live domain still served the old site.
Each of the four clean-clone blockers found in Phase 1 would have failed that
run.

**The live site is untouched through all of Phase 2.** It is still served from
`legacy-site` because the Pages source has not changed.

---

## Phase 3 — Build and deployment

| # | Task | Status |
|---|---|---|
| 3.1 | Fix `deploy.yml`: pin pnpm, cache correctly, run `pnpm verify` (tests + build + bundle check) rather than `pnpm test` alone | **done**, proven green in CI |
| 3.2 | Add `pr-preview.yml` — surge preview per pull request, commented on the PR | **done** |
| 3.3 | Add `pr-preview-teardown.yml` — tear the preview down when the PR closes | **done** |
| 3.4 | Run the whole thing once on a throwaway PR and confirm the preview URL works | needs 2.4 |

**`pull_request`, not the reference repo's `pull_request_target`.** That trigger
runs with the base repository's secrets, and the pattern normally copied with it
checks out the pull request's code — handing a fork's code our surge token. The
cost is that fork PRs get no preview; a maintainer who wants one pushes the
branch here instead. The preview step skips with a warning rather than failing
when `SURGE_TOKEN` is absent, so PRs are not blocked on a secret being present.

**Done when:** a PR gets a working preview link automatically, and `main` builds
green — while the live domain is still on `legacy-site`.

---

## Phase 4 — The release pipeline

Two workflows, mirroring the reference repos.

**Decided: the site polls; the library pushes nothing.**

A fine-grained PAT in the library repo was the alternative. It is instant and
event-driven, and it was rejected because it needs org approval for a
MarketSquare repository, is tied to one person's account, and fails silently —
releases would simply stop reaching the site until somebody noticed a stale
version number.

Polling needs no credential at all: the automatic `GITHUB_TOKEN` is
repo-scoped, cannot expire, and involves nobody outside this repository. The
cost is up to an hour of latency and a scheduled job that usually finds nothing.

**Here, and nowhere else:**

`library-release.yml` — on `schedule` (hourly) and `workflow_dispatch`:

0. Ask the GitHub API for the library's latest release. Compare with
   `content/libdoc/LATEST`. Stop here if they match — which is what happens on
   almost every run. Also stop if a PR for that version is already open.

1. Check out this repo and the library at the release tag
2. `pip install robotframework-browser==<version>` in a venv, `libdoc --format json` → `content/libdoc/Browser-<version>.json`, update `LATEST`
3. Import the new release note → `content/releases/<version>.md`
4. Refresh contributors and vendor any new avatars
5. Regenerate `app/generated/versions.json` (Browser, Playwright, bundled Node, Docker base image)
6. **Validate, and fail loudly:** the release note exists; `LATEST` equals the released version; the Libdoc JSON parses and its `version` matches; every `%%token%%` in content resolves; every avatar referenced exists on disk; `pnpm verify` passes
7. Build and publish a surge preview
8. Open a PR against `main` with the preview URL, the keyword-API diff against the previous version, and a review checklist

Step 8's diff is the piece worth building carefully — added, removed and
signature-changed keywords, derived from the two Libdoc JSON files. It is the
thing a reader actually needs and no generic tool produces it.

**Done when:** a real release opens a PR here with a working preview, and a
deliberately broken payload fails the validation step rather than merging.

---

## Phase 5 — Maintainer documentation

`CONTRIBUTING.md` in this repo, covering:

- **Editing content locally.** `pnpm dev`, then Nuxt Studio's editor at the
  floating button — it writes to files on disk. There is no hosted Studio, and
  the production build has no editing surface at all; that is deliberate.
- **Editing in VS Code.** Where content lives (`content/`), what the MDC
  components are (point at `/styleguide`, which demonstrates every one with its
  source), and the `%%browser%%` version tokens.
- **The generated files.** Which are committed, which script regenerates each,
  and when a human needs to run one.
- **Publishing.** PR → preview → merge → live.
- **What the release bot does**, so nobody hand-edits what it will overwrite.

---

## Phase 6 — Library documentation dedup

A subagent is auditing the library's introduction against the site now: which
sections to trim, which to replace with a stub, and the exact replacement text.

The constraint you set stands: **the selector section keeps a complete listing of
the strategies**, so an IDE user can still see what exists without a browser.
Only the long explanatory essays move.

Output is a PR against the library. It must not merge before the site is live,
or the stubs link to pages that do not exist yet.

---

## Phase 7 — Cutover

1. Final review on the surge preview
2. Switch the Pages source to GitHub Actions
3. Verify `robotframework-browser.org` serves the new site over HTTPS, and that
   the certificate is still valid for the custom domain
4. Check the old site's most-linked URLs — decide redirects or accept 404s
5. Merge the library dedup PR
6. Announce

**Rollback:** switch the Pages source back to `legacy-site`. Worth rehearsing
before step 2 rather than during it.

---

## Deferred, by your call

- Pagefind search
- Plausible and `/privacy`
- The Libdoc banner pointing at the new site
- Open Graph images

---

## Open questions

1. **Redirects.** Does the old site have URLs worth preserving? If people link
   to `robotframework-browser.org/Browser.html`, a 404 at cutover is a real cost.
2. **Who holds the PAT** for the release dispatch, and is a fine-grained token on
   the MarketSquare org acceptable?
3. **`legacy-site` or delete?** I propose keeping it indefinitely; it costs
   nothing.
4. **Does the release PR auto-merge** when validation passes, or always wait for
   a human? I would start with a human.
