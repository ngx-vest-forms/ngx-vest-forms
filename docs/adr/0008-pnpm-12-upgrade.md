# Upgrade to pnpm 12 with hardened workspace settings

## Status

Accepted

## Date

2026-10-14

## Context

The workspace was pinned to pnpm 11.4.0 through `packageManager` + Corepack (see
[ADR-0001](0001-pnpm-first-workspace-hardening.md)). pnpm 12 is a stable Rust
rewrite that keeps pnpm 11's commands, flags, settings, and lockfile format
(`lockfileVersion` stays `'9.0'`), so the upgrade is a pin bump plus a one-time
lockfile regeneration rather than a migration. The newest published 12.x is
12.13.0 (published 2026-10-13); it still rides the `next-12` dist-tag while
`latest`/`latest-12` points at 12.11.2. We pin 12.13.0: it is the newest published
build, and the pin is exact, so the channel tag does not affect reproducibility.

## Decision

1. **Pin `packageManager` to `pnpm@12.13.0+sha512.<hex>`** (Corepack hash format:
   hex of the npm `dist.integrity`). Corepack keeps activating the pin locally.
2. **Regenerate `pnpm-lock.yaml` with 12.13.0.** The one-time diff records
   `packageManagerDependencies` (the pnpm binary's per-platform packages) under the
   root importer; there is no `lockfileVersion` bump. CI must run the same major —
   pnpm fails in CI on a lockfile written by a newer major — which the pin
   guarantees.
3. **Migrate the deprecated `auditConfig.ignoreGhsas` to the `audit:` section**
   (`audit.level: high`, `audit.ignore: [GHSA-vfj7-8cjw-p6xm]`,
   `audit.ignorePrune: true`). The CI audit step drops `--audit-level=high` because
   the level now comes from config. The deferred braces advisory keeps its comment
   and review date.
4. **Add `blockExoticSubdeps: true`** — recommended by
   https://pnpm.io/supply-chain-security; already the default, so this is
   documentation-as-policy with zero behavior change.
5. **Add `sfw pnpm audit signatures` to CI** — verifies the ECDSA registry
   signatures of installed packages against the keys published at
   `/-/npm/v1/keys`. Verified locally: 1346/1346 packages have verified signatures.
6. **Replace `actions/setup-node` + `corepack enable` with SHA-pinned
   `pnpm/setup` v3.1.1** (`runtime: node@24`, `install: false`) in all three
   workflows. The action reads the same `packageManager` pin, downloads pnpm's
   native binary verified against npm's signature, and installs Node.js itself,
   removing the per-invocation Corepack JS-shim cost that pnpm's CI docs call out.
   `install: false` keeps the install under the Socket firewall. In the release
   workflows the old `registry-url` is preserved as job-level `NPM_CONFIG_REGISTRY`.
7. **Keep the Dependency Cache Embargo (ADR-0001).** pnpm's CI docs state that
   store caching is optional and warn that stores must only be written by trusted
   jobs — the same rationale as the embargo for PR-triggered runs. `pnpm/setup`'s
   `cache` input stays off (its default).
8. **No `.npmrc`.** pnpm reads only auth and registry settings from `.npmrc`; all
   policy lives in `pnpm-workspace.yaml`. If a project `.npmrc` is ever added for
   registry auth, it must be gitignored first.
9. **Add `virtualStoreType: global`** — the one repository setting
   https://pnpm.io/git-worktrees recommends for AI agents working in git worktrees:
   each worktree's `node_modules` is only symlinks into one shared
   content-addressable store, so a new agent worktree installs in seconds (this
   worktree's `node_modules` is 1.2 MB of symlinks). Caveats: experimental; only
   for agents sharing one trust boundary (the store is shared writable state); not
   useful in CI (cold store), where it is merely harmless.

## Rationale

- None of the pnpm 12 breaking changes touch this repo: `--resolution-only` is
  unused, workflows use bare `--frozen-lockfile` (still valid), the lockfile has no
  git/tarball dependencies, every `pnpm-workspace.yaml` key is recognized by v12
  (unknown keys are now a hard error), and `engineStrict` is not enabled.
- The existing hardening (`minimumReleaseAge: 1440` + strict,
  `trustPolicy: no-downgrade`, `strictDepBuilds`, `allowBuilds`) already matches the
  supply-chain docs; the gaps were the deprecated audit spelling and the missing
  explicit `blockExoticSubdeps`.
- The TypeScript page's recommendations are already satisfied: no tsconfig sets
  `preserveSymlinks`, and `moduleResolution: bundler` suits pnpm's symlinked
  layout.
- `pnpm audit signatures` and `pnpm/setup` both add signature verification,
  consistent with the repo's posture.

## Consequences

- CI installs run the pnpm 12.13.0 native binary directly (faster than the Corepack
  JS shim, signature-verified). Local development still uses `corepack enable`
  (README instructions unchanged).
- ADR-0001's "Corepack-Pinned Package Manager" term now means: pinned in
  `package.json`, activated through Corepack locally and through `pnpm/setup` in
  CI. "Soft Package Manager Enforcement" and "SHA-Pinned Workflow Actions" are
  intact (`pnpm/setup` is SHA-pinned).
- With `virtualStoreType: global`, every contributor's `node_modules` becomes
  symlinks into the shared store; tools that do not follow symlinks may misbehave.
  The full CI matrix passes locally with it enabled (see below).
- Verified on pnpm 12.13.0 with these settings: `pnpm install` and
  `pnpm install --frozen-lockfile` clean (lockfile passes supply-chain policies),
  `pnpm audit` (1 ignored: 1 high, as configured), `pnpm audit signatures`
  (1346/1346 verified), lint + lint-templates (3 projects), spec typecheck, library
  production build, unit tests (2 projects), browser tests (7 passed), e2e chromium
  (246 passed, 2 skipped), examples production build.

## Revisit when

- npm promotes 12.13.0 to `latest`/`latest-12`, or a 12.x with a security fix
  lands — bump the pin (and regenerate the lockfile if its
  `packageManagerDependencies` block changes).
- The braces ignore (GHSA-vfj7-8cjw-p6xm) is removed once braces >= 3.0.4 is
  published (review date 2026-11-13).
- Store caching is reconsidered: scope it to trusted events only (push to
  `master`/`release/**`, `workflow_dispatch`), cache the metadata cache too
  (`pnpm cache path`), and amend ADR-0001. `storeIndexFormat: files` (v12.13.0)
  only matters for a store on a network filesystem shared by CI jobs.
- Considered but not adopted: `engineStrict` (v12 makes it follow dependency edges;
  may fail installs on mis-declared transitive engines — test before enabling),
  `verifyDepsBeforeRun` (CI always installs first; the local default `install` is
  friendlier), `lockfile.includeResolutionSettings` (lockfile churn plus a v12.10
  floor for marginal gain), `updateNotifier: false` (cosmetic).

## Sources

- https://pnpm.io/blog/whats-different-in-pnpm-12
- https://pnpm.io/blog/releases/12.0
- https://pnpm.io/blog/releases/12.13.0
- https://pnpm.io/git-worktrees
- https://pnpm.io/typescript
- https://pnpm.io/supply-chain-security
- https://pnpm.io/continuous-integration
- https://pnpm.io/settings
