# Release Process

This document describes how to release new versions of ngx-vest-forms. All releases are now **manual only** and require explicit triggering via GitHub Actions.

## Release Types

### 1. Production Release (Stable)

Production releases are created from `master` and maintenance branches (`release/v1.x`, `release/v2.x`) and publish stable versions to npm.

**How to trigger:**

1. Go to [Actions > Release (Production)](../../actions/workflows/cd.yml)
2. Click "Run workflow"
3. Select the branch to release from:
   - `master` - Stable `@latest` channel. `master` now carries v3, so a run here publishes **`3.0.0` to `@latest`**. Only do this when you declare v3 GA (see below).
   - `release/v1.x` - Maintenance releases for v1.x
   - `release/v2.x` - Maintenance releases for v2.x

### Branch lifecycle & the v2 → v3 transition

The v3 work was merged into `master` (PR #186), and new v3 work targets
`master` directly. `release/v3` no longer gets its own commits: it is only the
branch the `@beta` channel publishes from.

- **`release/v2.x` holds the v2 line.** It contains every v2 tag through
  `v2.7.0`. A `fix:` commit there cuts a `2.7.x` patch on the `release-v2`
  dist-tag with no effect on v3.
- **`master` is v3 and is the `@latest` channel.** It has unreleased
  `BREAKING CHANGE` commits since `v2.7.0`, so a Release (Production) run on
  `master` publishes stable `3.0.0` to `@latest`. Running it _is_ declaring v3
  GA, so don't run it to get a beta.
- **`release/v3` is the beta channel.** To publish a beta, fast-forward it to
  `master` and dispatch the prerelease workflow on it (next section).

Sequence:

1. **Beta phase:** fast-forward `release/v3` to `master` and publish
   `3.0.0-beta.N` on `@beta`. Repeat for each new beta.
2. **v2 maintenance (in parallel):** cut `2.7.x` from `release/v2.x` as
   needed.
3. **v3 GA:** once the beta has soaked (issue #236), run Release
   (Production) on `master`; semantic-release publishes `3.0.0` on `@latest`.
4. **Post-GA:** replace the `release/v3` prerelease entry in `.releaserc`
   with a `release/v3.x` maintenance channel (issue #129).

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

Publishing is manual only. Merging or pushing to `release/v3` publishes
nothing, because the workflow has no `push` trigger.

1. Fast-forward `release/v3` to `master` (it must never have commits of its
   own):

   ```bash
   git fetch origin master release/v3
   git merge-base --is-ancestor origin/release/v3 origin/master  # must succeed
   git push origin origin/master:refs/heads/release/v3
   ```

2. Dispatch **Release (Prerelease/Beta)** with **Use workflow from** set to
   `release/v3`, `branch_type = stable`, `stable_branch = release/v3` and
   `dry_run = true`. Check the computed version in the log
   (`3.0.0-beta.N` on channel `beta`). From the command line:

   ```bash
   gh workflow run prerelease.yml --ref release/v3 \
     -f branch_type=stable -f stable_branch=release/v3 -f dry_run=true
   ```

   The **Use workflow from** branch matters: semantic-release picks the
   channel from the branch the run was dispatched on (`GITHUB_REF`), not from
   `stable_branch`. Dispatched from `master`, it would compute a stable
   `3.0.0` for `@latest`. The workflow stops when the two differ.

3. Dispatch it again the same way with `dry_run = false`. semantic-release publishes the
   package on the npm `@beta` dist-tag and creates a GitHub prerelease with the
   generated notes (`.releaserc` →
   `{ "name": "release/v3", "prerelease": "beta", "channel": "beta" }`).

semantic-release numbers prereleases from 1, so the first v3 beta is
`3.0.0-beta.1`, then `beta.2`, and so on. `npm install ngx-vest-forms@beta`
resolves to the latest one.

#### Prerelease Branches

| Branch Pattern | npm Tag     | Version Example   | Use Case                                          |
| -------------- | ----------- | ----------------- | ------------------------------------------------- |
| `release/v3`   | beta        | 3.0.0-beta.1      | v3 beta line, fast-forwarded to `master` per beta |
| `next`         | next        | 2.1.0-next.1      | Next major version features                       |
| `alpha`        | alpha       | 2.1.0-alpha.1     | Early alpha testing                               |
| `rc`           | rc          | 2.1.0-rc.1        | Release candidate                                 |
| `release/v2.x` | release-v2  | 2.5.1             | v2 maintenance releases after v3 becomes current  |
| `feat/*`       | feat-{name} | 2.1.0-feat-name.1 | Feature branch testing                            |
| `fix/*`        | fix-{name}  | 2.1.0-fix-name.1  | Fix branch testing                                |

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
