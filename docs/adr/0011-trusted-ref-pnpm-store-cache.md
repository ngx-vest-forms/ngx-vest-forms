# Cache the pnpm store on every job, save it only from trusted refs

## Status

Accepted (supersedes [ADR-0009](0009-narrow-dependency-cache-embargo.md))

## Date

2026-10-16

## Context

ADR-0009 kept pull request jobs off the package-manager cache entirely, so every
PR ran a cold install. pnpm's own guidance is narrower. Its CI docs ask that only
trusted jobs write a store or metadata cache that trusted jobs later restore, and
`pnpm/setup` implements that with `cache: true` plus a `save-cache` input meant to
be true only on trusted refs.

GitHub's cache scoping already keeps a PR's writes away from trusted jobs. A
`pull_request` run saves into its own `refs/pull/<n>/merge` scope, which only
re-runs of that PR can read. A run on `master`, a release branch, `beta` or `rc`
reads its own branch's caches and the default branch's, never a PR's.

## Decision

Every workflow enables `pnpm/setup`'s `cache: true`:

- `ci.yml` saves the store only on `push` (`save-cache: ${{ github.event_name == 'push' }}`).
  Pull requests restore the cache that the base branch's post-merge run saved.
  For that, `ci.yml` now also runs on `push` to `master`, `release/**`, `beta` and
  `rc`.
- `cd.yml`'s `verify` job and the nightly `e2e-cross-browser.yml` save as well.
  Both are trusted events (`workflow_dispatch` and `schedule`).
- `cd.yml`'s `release` job and `pr-title.yml` only restore (`save-cache: false`).

`pnpm/setup` also saves pnpm's lockfile verification log on every run, regardless
of `save-cache`. On a PR that write stays in the PR's scope. Its checks are
documented in the action's README.

## Consequences

- PR installs start from a warm store and skip re-verifying an unchanged lockfile
  against `minimumReleaseAge` and `trustPolicy`. pnpm re-verifies whenever the
  lockfile changes or the policy gets stricter.
- If a workflow ever gains `pull_request_target`, or another trigger that runs in
  the base branch's scope, it must not save the cache.
- The Dependency Cache Embargo term from ADR-0001 is retired.

## Sources

- https://pnpm.io/continuous-integration
- https://github.com/pnpm/setup#cache-the-pnpm-store
- https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching#restrictions-for-accessing-a-cache
