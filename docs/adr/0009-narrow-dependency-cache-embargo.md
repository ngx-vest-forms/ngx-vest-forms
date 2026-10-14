# Narrow the Dependency Cache Embargo to untrusted events

## Status

Accepted (amends [ADR-0001](0001-pnpm-first-workspace-hardening.md))

## Date

2026-10-14

## Context

ADR-0001 established a **Dependency Cache Embargo**: "workflows disable
package-manager dependency caches to reduce cache-poisoning risk." The threat is
GitHub Actions cache poisoning. `actions/cache` is a repo-wide, trusted-artifact
channel: if an untrusted job — a `pull_request` run, whose code comes from a fork
or an unreviewed branch — can write a cache entry that a trusted job later
restores, the untrusted job gains code execution inside the trusted pipeline. The
release workflows (`cd.yml`, `prerelease.yml`) hold the npm OIDC publish token, so
a poisoned cache there means a malicious publish. pnpm's CI docs state the same
rule: "Only cache pnpm's store and cache directories in locations writable by
trusted jobs. Do not let untrusted CI jobs write to a store or metadata cache that
trusted jobs later restore."

The embargo as written is broader than the threat: it also disables caching on
jobs that only trusted actors can start. `cd.yml` and `prerelease.yml` run
exclusively on `workflow_dispatch`, and only users with write access can trigger
`workflow_dispatch` — anyone who can start them could already publish directly,
so caching there adds no new trust.

## Decision

Narrow the embargo rather than remove it:

1. **`pull_request` jobs stay fully cache-free.** `ci.yml` never reads or writes
   package-manager caches. Every PR gets a cold install and a full supply-chain
   verification of the lockfile (`minimumReleaseAge`, `trustPolicy`,
   `verifyStoreIntegrity`) — the embargo's core value.
2. **Trusted events may cache.** `cd.yml` and `prerelease.yml` cache the pnpm store
   (`pnpm store path`) and the metadata cache (`pnpm cache path`) with the
   SHA-pinned `actions/cache`, keyed on `runner.os` + the lockfile hash. The cache
   step is conditioned on `github.event_name == 'workflow_dispatch'` so the guard
   survives future trigger edits.
3. The metadata cache is the sensitive half: it holds the lockfile verification
   log that lets a job skip re-checking an unchanged lockfile against the
   supply-chain policies — the dominant cost of an install once the store is warm,
   per pnpm's CI docs. That is why the whole cache, restores included, stays off
   untrusted events. The store itself is content-addressed and integrity-checked on
   link (`verifyStoreIntegrity` defaults to `true`), so store content is less
   exposed, but the embargo does not distinguish.
4. ADR-0001's term now reads: _Dependency Cache Embargo — untrusted events
   (`pull_request`) never read or write package-manager caches; trusted events
   (`workflow_dispatch`, `push` to protected branches) may cache the pnpm store and
   metadata cache._

## Rationale

- The poisoning vector is _untrusted write → trusted restore_. Scoping caches to
  trusted events removes the vector without giving up the speedup where it is safe.
- pnpm's CI docs recommend caching the store and the metadata cache, and state
  caching is optional ("feel free to not cache the pnpm store in your job") — the
  blanket embargo was always a stricter-than-docs choice, not a docs requirement.
- The release workflows are the only trusted-event jobs today, so the speedup is
  real but modest; PR CI, the frequent path, is unchanged by design.

## Consequences

- Release runs restore a warm store and skip re-verifying an unchanged lockfile;
  PR runs stay exactly as cold as before.
- The cache is one store for this repo's dependency tree plus its registry
  metadata, well inside GitHub's 10 GB per-repo cache limit alongside the
  existing Playwright browser cache.
- The Playwright browser cache was never embargoed: it is not a package-manager
  cache and is not restored into `node_modules`.
- If a `push` trigger is ever added to a workflow, its cache step must be
  conditioned on the trusted ref (`refs/heads/master`, `refs/heads/release/**`),
  never on `pull_request`.
- The lockfile records `packageManagerDependencies`, so the lockfile-hash cache
  key already rotates when the pnpm pin changes.

## Revisit when

- PR CI time becomes a pain point. The next safe step is _restore-only_ caching on
  `ci.yml` (never save), which first requires re-verifying GitHub's cross-branch
  cache scoping: a `pull_request` job may restore a cache written by a trusted
  event, but must never create one that a trusted job restores. A
  `push`-to-`master` job that writes the cache is the other half of that pattern.
- pnpm changes the store layout across a major (the store path already carries the
  store version, e.g. `store/v11`).

## Sources

- https://pnpm.io/continuous-integration — GitHub Actions section: caching is
  optional; "Only cache pnpm's store and cache directories in locations writable by
  trusted jobs"; the metadata cache holds the lockfile verification log
- https://pnpm.io/settings/store — `verifyStoreIntegrity` (default `true`)
- [ADR-0001](0001-pnpm-first-workspace-hardening.md) — Dependency Cache Embargo
