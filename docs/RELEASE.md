# Release Process

This document describes how to release new versions of ngx-vest-forms. All releases are now **manual only** and require explicit triggering via GitHub Actions.

## Release Types

### 1. Production Release (Stable)

Production releases are created from the `master` or `release/v1.x` branches and publish stable versions to npm.

**How to trigger:**
1. Go to [Actions > Release (Production)](../../actions/workflows/cd.yml)
2. Click "Run workflow"
3. Select the branch to release from:
   - `master` - Latest stable version (v2.x)
   - `release/v1.x` - Maintenance releases for v1.x

The workflow will:
- Run all tests, lints, and builds
- Analyze commits using [Conventional Commits](https://www.conventionalcommits.org/)
- Generate version bump (major/minor/patch) automatically
- Publish to npm with provenance attestation
- Create GitHub release with changelog
- Update CHANGELOG.md

### 2. Prerelease / Beta Release

Prereleases are used for testing new features before stable release. They can be created from various branches.

**How to trigger:**
1. Go to [Actions > Release (Prerelease/Beta)](../../actions/workflows/prerelease.yml)
2. Click "Run workflow"
3. Choose branch type:
   - **Stable**: Select from predefined branches (next, alpha, beta, rc, release/v1.x)
   - **Custom**: Enter a custom branch name (e.g., `feat/awesome-feature`, `fix/critical-bug`)

The workflow will:
- Run all tests, lints, and builds
- Publish as a prerelease version (e.g., `2.1.0-beta.1`)
- Add appropriate dist-tag in npm
- Create GitHub prerelease

#### Prerelease Branches

| Branch Pattern | npm Tag | Version Example | Use Case |
|---------------|---------|-----------------|----------|
| `next` | next | 2.1.0-next.1 | Next major version features |
| `beta` | beta | 2.1.0-beta.1 | Beta testing before stable |
| `alpha` | alpha | 2.1.0-alpha.1 | Early alpha testing |
| `rc` | rc | 2.1.0-rc.1 | Release candidate |
| `feat/*` | feat-{name} | 2.1.0-feat-name.1 | Feature branch testing |
| `fix/*` | fix-{name} | 2.1.0-fix-name.1 | Fix branch testing |

## Semantic Versioning

This project uses [Semantic Versioning](https://semver.org/) and [Conventional Commits](https://www.conventionalcommits.org/).

Version bumps are determined automatically based on commit messages:

- **BREAKING CHANGE**: Major version (2.0.0 → 3.0.0)
- **feat**: Minor version (2.0.0 → 2.1.0)
- **fix**: Patch version (2.0.0 → 2.0.1)
- **docs, style, refactor, test, chore**: No version bump

## Commit Message Format

Follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
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
3. **Changelog**: Generates/updates CHANGELOG.md
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
