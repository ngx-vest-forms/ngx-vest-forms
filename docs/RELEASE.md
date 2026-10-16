# Release Process

Every release, stable or prerelease, runs through one workflow:
[Actions > Release](../../actions/workflows/cd.yml) (`cd.yml`). Merging or
pushing never publishes. The workflow publishes through npm Trusted Publishing
(OIDC), and the provenance of every published version names this file.

The workflow has two jobs:

- **Verify and build** lints, tests and builds with a read-only token, then
  uploads the built package.
- **Publish** waits for a maintainer to approve the `npm-publish` environment.
  It then runs semantic-release on the uploaded package. This job alone holds
  the OIDC token and write access.

**How to trigger:**

1. Go to [Actions > Release](../../actions/workflows/cd.yml), click "Run
   workflow" and set **Use workflow from** to the branch you release.
   semantic-release picks the channel from that branch.
2. `dry_run` is on by default: the run prints the computed version and
   channel and lists the package contents, without publishing. Dry runs also
   wait for approval, because semantic-release checks the npm OIDC exchange
   even in a dry run.
3. Check the log, then run again with `dry_run` unticked to publish.

From the command line:

```bash
gh workflow run cd.yml --ref <branch>                  # dry run
gh workflow run cd.yml --ref <branch> -f dry_run=false # publish
```

## Branches and channels

| Branch         | npm dist-tag | Version example | Use                                      |
| -------------- | ------------ | --------------- | ---------------------------------------- |
| `master`       | `latest`     | 3.0.0           | v3, the current line                     |
| `beta`         | `beta`       | 3.0.0-beta.1    | v3 prereleases, fast-forwarded to master |
| `rc`           | `rc`         | 3.0.0-rc.1      | v3 release candidates, same rule         |
| `release/v2.x` | `release-v2` | 2.7.1           | v2 maintenance                           |
| `release/v1.x` | `release-v1` | 1.2.1           | v1 maintenance                           |

`.releaserc` holds this mapping. The `npm-publish` environment only accepts
these branches.

A dispatch runs the `cd.yml` of the branch it targets. `release/v1.x` and
`release/v2.x` still carry the older workflow. It requires the branch as an
input and has no dry run, so a dispatch publishes once you approve it:

```bash
gh workflow run cd.yml --ref release/v2.x -f branch=release/v2.x
```

### v3 on master

`master` carries v3. It has unreleased `BREAKING CHANGE` commits since
`v2.7.0`, so a publish run on `master` releases **`3.0.0` to `@latest`**.
Running it _is_ declaring v3 GA, so don't run it to get a beta.

Sequence:

1. **Beta phase:** fast-forward `beta` to `master` and publish
   `3.0.0-beta.N` on `@beta`. Repeat for each new beta.
2. **Release candidate:** fast-forward `rc` to `master` and publish
   `3.0.0-rc.N` on `@rc`.
3. **v2 maintenance (in parallel):** a `fix:` commit on `release/v2.x` cuts a
   `2.7.x` patch on `release-v2`.
4. **v3 GA:** once the prereleases have soaked (issue #236), publish from
   `master`; semantic-release releases `3.0.0` on `@latest`.
5. **Post-GA:** add a `release/v3.x` maintenance branch to `.releaserc` before
   `master` moves on to v4 (issue #129).

### Soak and exit criteria

**Beta to release candidate.** Publish `3.0.0-rc.1` only when all of these
hold:

- At least **2 weeks** on `@beta` since the last beta that changed behavior
  (a `feat` or `fix` commit; docs-only betas don't reset the clock).
- **No open bugs** labelled `v3` that block users (crash, wrong validation
  result, data loss, or a broken documented API).
- The unit and e2e suites pass on the **latest Angular 22.x patch** and the
  **latest Vest 6.x**.
- At least **one real application** has migrated from v2 using only
  [the migration guide](./migration/MIGRATION-v2.x-to-v3.0.0.md), and any gaps
  it found are folded back into the guide.
- The pre-RC work is merged: the zoneless test cleanup (#251, #253 to #256),
  the Vest 6.3.4 runner alignment (#238) and the private Angular API contract
  tests from #215 (PR #258). The rest of #215 is v3.1 work.

**Release candidate to 3.0.0.** Publish `3.0.0` from `master` after at least
**1 week** on `@rc` with no `feat` or `fix` commits. A fix during that week
publishes a new `rc.N` and restarts the week.

Track progress on these in issue #236.

### Publish a beta or rc

`beta` and `rc` never get commits of their own. Update one by fast-forwarding
it to `master` with a direct push as an admin. A PR would add a merge commit and
make the branch diverge from `master`.

```bash
git fetch origin master beta
git merge-base --is-ancestor origin/beta origin/master  # must succeed
git push origin origin/master:refs/heads/beta
gh workflow run cd.yml --ref beta                       # dry run, then -f dry_run=false
```

Use `rc` in place of `beta` for a release candidate. If `rc` does not exist yet,
the push creates it. semantic-release numbers prereleases from 1, so the first
v3 beta is `3.0.0-beta.1`. `npm install ngx-vest-forms@beta` resolves to the
latest one.

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

- `ENONPMTOKEN No npm token specified`: semantic-release did not get an OIDC
  token. Check that `NPM_CONFIG_REGISTRY` in `cd.yml` is exactly
  `https://registry.npmjs.org/` (with the trailing slash; without it
  `@semantic-release/npm` skips the OIDC exchange), that the log shows
  "Verifying OIDC context", and that npm's Trusted Publisher names `cd.yml`
  and the `npm-publish` environment
- Check npm permissions in the repository settings
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
