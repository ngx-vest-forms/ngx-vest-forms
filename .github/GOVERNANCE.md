# Repository Governance

This document outlines the governance model and repository rules for the ngx-vest-forms project.

## 🏛️ Governance Model

### Repository Structure

- **Main Branch**: `master` (protected)
- **Development**: Feature branches → Pull Requests → `master`
- **Releases**: Automated via semantic-release from `master`

### Team Structure

#### Maintainers (`@ngx-vest-forms/maintainers`)
- Full repository access
- Can merge PRs after review
- Manage releases and project direction
- Handle security issues and administrative tasks

#### Core Team (`@ngx-vest-forms/core-team`)
- Focus on library source code
- Required reviewers for core library changes
- Technical decision making for the library

#### Contributors (`@ngx-vest-forms/contributors`)
- Can review PRs for examples and documentation
- Trusted community members
- May be promoted to core team based on contributions

### Collaboration Models

#### For External Contributors (Recommended)
1. **Fork the repository** to your GitHub account
2. **Create feature branches** in your fork
3. **Submit Pull Requests** from your fork to our `master` branch
4. **Follow up** on review feedback

**Benefits:**
- Clean contribution history
- No direct access to main repository needed
- Standard open source workflow
- Easier permission management

#### For Project Collaborators
1. **Clone the main repository** directly
2. **Create feature branches** in the main repository
3. **Submit Pull Requests** to `master` branch
4. **Collaborate** directly within the repository

**Benefits:**
- Direct collaboration
- Easier for team members
- Faster iteration for trusted contributors

## 🛡️ Branch Protection Rules

### Master Branch Protection

The `master` branch is protected with the following rules:

#### Required Reviews
- **Minimum reviews**: 1 required
- **Code owner review**: Required (see `.github/CODEOWNERS`)
- **Dismiss stale reviews**: Reviews are dismissed when new commits are pushed
- **Require review from recent pushers**: The person who pushed most recent changes cannot approve

#### Status Checks
- **CI workflow must pass**: All automated tests and builds must succeed
- **Require branches to be up-to-date**: Branches must be current with `master`
- **Required checks**:
  - `ci` (GitHub Actions workflow)
  - Build and test completion
  - Storybook test completion

#### Protection Rules
- **Prevent force pushes**: Force pushes are blocked
- **Prevent deletion**: Branch cannot be deleted
- **Linear history**: Merge commits or squash merging required
- **No direct pushes**: All changes must go through Pull Requests

### Bypass Permissions

Repository administrators can bypass protection rules when necessary for:
- Emergency fixes
- Administrative changes
- Release process issues

## 📋 Pull Request Process

### 1. Requirements
- [ ] CI checks pass
- [ ] At least 1 approved review from code owner
- [ ] Branch is up-to-date with `master`
- [ ] All conversations resolved
- [ ] Follows conventional commit format

### 2. Review Criteria
- Code quality and consistency
- Test coverage for new features
- Documentation updates
- Breaking change assessment
- Performance considerations

### 3. Merge Options
- **Squash and merge**: Preferred for feature branches
- **Merge commit**: For larger features with meaningful commit history
- **Rebase and merge**: For simple, clean commits

## 🔐 Security and Permissions

### Repository Permissions

#### Admin
- Repository owners
- Can modify settings, rulesets, and permissions
- Emergency access to bypass protection rules

#### Maintain
- Core maintainers
- Can merge PRs and manage issues
- Cannot modify repository settings

#### Write
- Trusted contributors
- Can create branches and submit PRs
- Cannot merge PRs

#### Triage
- Community moderators
- Can manage issues and PRs
- Cannot push code

#### Read
- Everyone (public repository)
- Can view code, create issues, and submit PRs from forks

### Access Control

1. **Public Repository**: Anyone can view and fork
2. **Issues**: Anyone can create issues
3. **Pull Requests**: Anyone can submit PRs from forks
4. **Direct Commits**: Only team members with write access
5. **Merging**: Only maintainers after review process

## 🚀 Release Process

### Automated Releases
- **Trigger**: Merges to `master` branch
- **Tool**: semantic-release
- **Versioning**: Semantic versioning based on conventional commits
- **Artifacts**: NPM package, GitHub release, changelog update

### Release Types
- **Patch**: Bug fixes (`fix:` commits)
- **Minor**: New features (`feat:` commits)
- **Major**: Breaking changes (`BREAKING CHANGE:` in commit body)

### Manual Override
- Maintainers can trigger manual releases if needed
- Emergency releases follow expedited review process

## 📊 Metrics and Monitoring

### Repository Health
- **PR Review Time**: Target < 48 hours for initial review
- **Issue Response Time**: Target < 24 hours for initial response
- **CI Success Rate**: Target > 95%
- **Security**: Regular dependency updates and security scans

### Quality Gates
- **Test Coverage**: Maintain current levels or improve
- **Build Success**: All builds must pass
- **Code Quality**: Prettier, linting, and conventions enforced
- **Documentation**: Keep docs up-to-date with changes

## 🔄 Process Evolution

This governance model may evolve as the project grows:

### When to Update
- Team size changes significantly
- New collaboration needs arise
- Security requirements change
- Community feedback suggests improvements

### How to Update
1. **Propose changes**: Create an issue or discussion
2. **Community input**: Gather feedback from contributors
3. **Maintainer review**: Core team evaluates proposal
4. **Implementation**: Update documentation and rules
5. **Communication**: Announce changes to community

## 📞 Contact and Support

### For Repository Governance Questions
- **GitHub Discussions**: General questions and proposals
- **Issues**: Specific problems with the process
- **Email**: [security@simplified.courses](mailto:security@simplified.courses) for sensitive matters

### For Technical Questions
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General usage and questions
- **Documentation**: Check README and contributing guidelines

---

This governance model ensures the project maintains high quality while remaining welcoming to new contributors. It provides clear guidelines for all participants and helps maintain the project's long-term sustainability.