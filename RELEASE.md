# Release Process

This document describes how to publish releases for the ngx-vest-forms library.

## Automated Releases

The project uses [semantic-release](https://semantic-release.gitbook.io/) to automatically publish releases based on conventional commit messages.

### Release Triggers

Releases are automatically triggered when:

1. **Automatic on Push**: Any push to the `master` branch or `release/**` branches will trigger the CD workflow
2. **Manual Trigger**: The CD workflow can be manually triggered from the GitHub Actions tab

### Manual Release

To manually trigger a release:

1. Go to the [GitHub Actions page](https://github.com/ngx-vest-forms/ngx-vest-forms/actions/workflows/cd.yml)
2. Click "Run workflow"
3. Select the branch to release from (defaults to `master`)
4. Click "Run workflow"

### Release Types

The version bump is determined by the conventional commit messages since the last release:

- **PATCH** (1.0.1): Bug fixes (`fix:` commits)
- **MINOR** (1.1.0): New features (`feat:` commits)  
- **MAJOR** (2.0.0): Breaking changes (`BREAKING CHANGE:` in commit body or `!` after type)

### Conventional Commit Examples

```bash
# Patch release
git commit -m "fix: resolve validation issue with nested forms"

# Minor release  
git commit -m "feat: add support for custom validation messages"

# Major release
git commit -m "feat!: remove deprecated validateOnInit option"
# or
git commit -m "feat: update to Angular 17

BREAKING CHANGE: Minimum Angular version is now 17"
```

## Release Workflow

The CD workflow (`cd.yml`) performs the following steps:

1. **Build & Test**: Runs all tests and builds the library
2. **Semantic Release**: 
   - Analyzes commits since last release
   - Determines next version number
   - Generates changelog
   - Creates GitHub release
   - Publishes to npm

## Supported Release Branches

Based on the `.releaserc` configuration:

- `master`: Stable releases (latest tag)
- `release/v1.x`: Version 1.x maintenance releases  
- `release/v2.x`: Version 2.x maintenance releases
- `beta`: Beta pre-releases
- `rc`: Release candidate pre-releases
- `alpha`: Alpha pre-releases

## Prerequisites

For releases to work, the repository needs:

- `NPM_TOKEN`: Secret for publishing to npm
- `GH_TOKEN`: GitHub token for creating releases

## Troubleshooting

If a release fails:

1. Check that all tests pass
2. Verify npm and GitHub tokens are valid
3. Ensure there are releasable commits (following conventional commit format)
4. Check the workflow logs for specific error messages