# Release Notes Guidelines

## Overview

This project uses **semantic-release** with **GitHub Releases** as the single source of truth for release history. We do NOT maintain a separate CHANGELOG.md file.

## How It Works

1. **Conventional Commits** → Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) format
2. **Semantic Release** → Automatically determines version and generates release notes
3. **GitHub Releases** → Published automatically with formatted release notes

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature (triggers minor version bump)
- **fix**: Bug fix (triggers patch version bump)
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without adding features or fixing bugs
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, tooling, dependencies

### Breaking Changes

Use `BREAKING CHANGE:` in the footer or `!` after type:

```bash
feat!: remove deprecated validationOptions API

BREAKING CHANGE: validationOptions input has been removed. Use validationConfig instead.
```

## Release Notes Style

### ✅ Good Commit Messages (appear in release notes)

```bash
feat(validation): add reactive validationConfig with computed signals
fix(forms): resolve race condition in dependent field validation
docs(readme): add browser compatibility requirements
```

### ❌ Avoid

- **Emojis in commits** - They clutter GitHub releases
- **Vague messages** - "fix stuff", "update code"
- **Multiple concerns** - Keep commits focused

## Viewing Release History

- **GitHub Releases**: https://github.com/ngx-vest-forms/ngx-vest-forms/releases
- **NPM**: https://www.npmjs.com/package/@ngx-vest-forms/ngx-vest-forms?activeTab=versions

## Manual Release Notes Enhancement

For major releases, you can enhance the auto-generated notes in GitHub UI:

1. Navigate to https://github.com/ngx-vest-forms/ngx-vest-forms/releases
2. Edit the release
3. Add sections like:
   - **Migration Guide** (for breaking changes)
   - **Highlights** (key features)
   - **Known Issues**
   - **Contributors**

## Release Checklist

- [ ] All tests passing (`npm run test:ci`)
- [ ] Build successful (`npm run build:ci`)
- [ ] Documentation updated (README, instruction files)
- [ ] Breaking changes documented in commit footer
- [ ] Conventional commit format used
- [ ] PR approved and merged to `master`
- [ ] Semantic-release creates tag and GitHub release automatically

## Example Release Flow

1. **Work on feature branch**: `feat/add-fluent-builder-api`
2. **Commit with convention**: `feat(validation): add ValidationConfigBuilder with fluent API`
3. **Create PR** with description of changes
4. **Merge to master** (squash or merge commits)
5. **Semantic-release runs** on CI
6. **GitHub Release created** automatically with version number and notes

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Angular Commit Convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular)
