# Release Process

This document describes how to release new versions of ngx-vest-forms. All releases are now **manual only** and require explicit triggering via GitHub Actions.

## Release Types

### 1. Production Release (Stable)

Production releases are created from `master` and maintenance branches (`release/v1.x`, `release/v2.x`) and publish stable versions to npm.

**How to trigger:**

1. Go to [Actions > Release (Production)](../../actions/workflows/cd.yml)
2. Click "Run workflow"
3. Select the branch to release from:
   - `master` - Stable `@latest` channel (currently v2 line until v3 GA merge)
   - `release/v1.x` - Maintenance releases for v1.x
   - `release/v2.x` - Maintenance releases for v2.x

Use maintenance branches for supported release lines. For example, prefer `release/v2.x` over a fixed branch name like `release/2.0.0`. `release/v3` is the active v3 development/beta line until GA; a future `release/v3.x` branch is only needed after v3 becomes stable on `master`.

### Branch lifecycle & the v2 → v3 transition

The v3 line is developed on `release/v3` and published as a `@beta`
prerelease **before** it becomes the stable `@latest`. The topology that
makes this safe (verified):

- **`release/v2.x` fully captures the v2 line.** It contains every v2 tag
  through the latest `v2.7.0`, so v2 maintenance is independent of v3. A
  `fix:` commit on `release/v2.x` cuts a `2.7.x` patch on the `release-v2`
  dist-tag with no effect on v3. Forward-port such fixes into `release/v3`
  (and later `master`) via cherry-pick.
- **`master` is the stable `@latest` channel.** It currently sits at the v2
  line plus infra/chore commits. Merging `release/v3` → `master` and pushing
  makes semantic-release publish a **stable `3.0.0` to `@latest`** (the v3
  commits carry `BREAKING CHANGE`). That merge therefore _is_ the "declare v3
  GA" action — it is **not** done to cut betas.
- **`master` is already an ancestor of `release/v3`** (zero divergent
  commits), so the eventual merge is effectively a fast-forward whenever it
  happens — there is no benefit to merging early and every reason to wait.

Sequence:

1. **Beta phase:** ship `3.0.0-beta.N` from `release/v3` on `@beta` (this
   config change). Do **not** merge `release/v3` → `master` during this phase
   — that would skip beta and publish v3 as stable `@latest`.
2. **v2 maintenance (in parallel):** cut `2.7.x` from `release/v2.x` as
   needed; forward-port fixes into `release/v3`.
3. **v3 GA:** once the beta is validated, merge `release/v3` → `master`;
   semantic-release publishes stable `3.0.0` on `@latest`.
4. **Post-GA:** add a `release/v3.x` maintenance channel to `.releaserc`
   (issue #129) and treat `release/v2.x` as the prior-major maintenance line.

The workflow will:

- Run all tests, lints, and builds
- Analyze commits using [Conventional Commits](https://www.conventionalcommits.org/)
- Generate version bump (major/minor/patch) automatically
- Publish to npm with provenance attestation
- Create GitHub release with generated release notes (no CHANGELOG.md file is committed to the repo)

### 2. Prerelease / Beta Release

Prereleases are used for testing new features before stable release. They can be created from various branches.

**How to trigger:**

1. Go to [Actions > Release (Prerelease/Beta)](../../actions/workflows/prerelease.yml)
2. Click "Run workflow"
3. Choose branch type:
   - **Stable**: Select from predefined branches (next, alpha, rc, release/v1.x, release/v2.x, release/v3)
   - **Custom**: Enter a custom branch name (e.g., `feat/awesome-feature`, `fix/critical-bug`)

The workflow will:

- Run all tests, lints, and builds
- Publish as a prerelease version (e.g., `2.1.0-beta.1`)
- Add appropriate dist-tag in npm
- Create GitHub prerelease

#### v3 beta line (`release/v3`)

The v3 line is developed on the long-lived `release/v3` branch and published
as a beta prerelease. Publishing is **manual only**, like every other release
here: a maintainer dispatches the **Release (Prerelease/Beta)** workflow with
`stable_branch = release/v3` (merging or pushing to `release/v3` does **not**
publish — there is no `push` trigger). Each dispatched run makes
semantic-release publish the next `3.0.0-beta.N` package on the npm `@beta`
dist-tag, derived from the commits on `release/v3` since the last beta
(`.releaserc` → `{ "name": "release/v3", "prerelease": "beta", "channel": "beta" }`).
Use the workflow's `dry_run` input to compute the next version/channel
without publishing.

`3.0.0-beta.0` is **not** Phase 1 only: by the time the channel is cut, the
Phase 1 internal refactors and cleanup (#118–#123, #130, #131) **and** the
Phase 2 feature work (#125–#128: `validationFocus`, `AbortSignal`
plumbing, docs, private-field style) have all merged into `release/v3`. So the
first beta carries the full Vest 5→6 migration + deprecation removals +
internal refactors + Phase 2 features in one coherent prerelease. Subsequent
dispatched runs roll forward as `3.0.0-beta.1`, `beta.2`, ….

`npm install ngx-vest-forms@beta` resolves to the latest `3.0.0-beta.N`.
Once v3 is stabilised, the final `3.0.0` ships from `master` and a
`release/v3.x` maintenance channel is added (see issue #129).

#### Prerelease Branches

| Branch Pattern | npm Tag     | Version Example   | Use Case                                              |
| -------------- | ----------- | ----------------- | ----------------------------------------------------- |
| `release/v3`   | beta        | 3.0.0-beta.1      | v3 beta line (Vest 6 migration + cleanup + Phase 1/2) |
| `next`         | next        | 2.1.0-next.1      | Next major version features                           |
| `alpha`        | alpha       | 2.1.0-alpha.1     | Early alpha testing                                   |
| `rc`           | rc          | 2.1.0-rc.1        | Release candidate                                     |
| `release/v2.x` | release-v2  | 2.5.1             | v2 maintenance releases after v3 becomes current      |
| `feat/*`       | feat-{name} | 2.1.0-feat-name.1 | Feature branch testing                                |
| `fix/*`        | fix-{name}  | 2.1.0-fix-name.1  | Fix branch testing                                    |

## Semantic Versioning

This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

Version bumps are determined automatically based on commit messages:

- **BREAKING CHANGE**: Major version (2.0.0 → 3.0.0)
- **feat**: Minor version (2.0.0 → 2.1.0)
- **fix**: Patch version (2.0.0 → 2.0.1)
- **docs, style, refactor, test, chore**: No version bump

## Commit Message Format

Follow the Conventional Commits specification:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```text
feat(core): add support for async validation

fix(control-wrapper): resolve aria-describedby issue

BREAKING CHANGE: remove deprecated APIs
```

## Prerequisites

Before releasing:

1. **Ensure CI passes**: All tests must pass on the source branch
2. **Merge PRs**: All intended changes should be merged
3. **Clean working directory**: No uncommitted changes
4. **Valid semantic commits**: Use conventional commit messages

## What Happens During Release

1. **Validation**: Runs linting, tests, and builds
2. **Version Calculation**: Analyzes commits since last release
3. **Release notes**: Generates release notes from the commits (published on the GitHub release; no CHANGELOG.md is written)
4. **Package Update**: Updates version in package.json
5. **npm Publish**: Publishes to npm with provenance
6. **Git Tag**: Creates annotated git tag
7. **GitHub Release**: Creates release with notes

## Troubleshooting

### No version bump

If semantic-release skips releasing:

- Check commit messages follow Conventional Commits format
- Ensure there are releasable commits since last release
- Verify branch is configured in `.releaserc`

### Publish fails

If npm publish fails:

- Check npm permissions in the repository settings
- Verify OIDC Trusted Publisher is configured
- Check npm registry status

### Wrong version generated

- Review commit history for BREAKING CHANGE markers
- Check if commits were squashed or merged incorrectly
- Verify `.releaserc` branch configuration

## Emergency Hotfix

For critical production issues:

1. Create hotfix branch from affected release tag
2. Apply fix with proper commit message
3. Trigger production release workflow
4. Backport fix to main branches if needed

## Resources

- [semantic-release documentation](https://semantic-release.gitbook.io/)
- [Conventional Commits specification](https://www.conventionalcommits.org/)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
