# Repository Ruleset Setup Guide

This guide explains how to implement the repository rulesets for the ngx-vest-forms project to ensure proper branch protection and governance.

## 🎯 Overview

The repository governance setup includes:

1. **Branch Protection Rules** - Protect the master branch
2. **Code Review Requirements** - Ensure quality through reviews
3. **Status Check Requirements** - Automated CI/CD validation
4. **Collaboration Guidelines** - Clear contribution process
5. **Security Policies** - Vulnerability reporting and handling

## 🛡️ Applying Repository Rulesets

### Method 1: GitHub Web Interface (Recommended)

1. **Navigate to Repository Settings**
   - Go to https://github.com/ngx-vest-forms/ngx-vest-forms
   - Click on "Settings" tab
   - Select "Rules" → "Rulesets" from the left sidebar

2. **Create New Ruleset**
   - Click "New branch ruleset"
   - Use the configuration from `.github/rulesets/master-branch-protection.json`

3. **Configure Ruleset Settings**
   ```
   Name: Master Branch Protection
   Enforcement: Active
   Target: Branch
   Include pattern: master
   ```

4. **Add Protection Rules**
   - ✅ Require pull request before merging
     - Required approvals: 1
     - Dismiss stale reviews when new commits are pushed
     - Require review from code owners
     - Require approval of the most recent reviewable push
   - ✅ Require status checks to pass before merging
     - Require branches to be up to date before merging
     - Status checks: `ci` (GitHub Actions)
   - ✅ Block force pushes
   - ✅ Restrict deletions
   - ✅ Require linear history

5. **Set Bypass Permissions**
   - Repository administrators can bypass with pull request

### Method 2: GitHub CLI (Alternative)

```bash
# Install GitHub CLI if not already installed
gh auth login

# Apply the ruleset (requires admin permissions)
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  repos/ngx-vest-forms/ngx-vest-forms/rulesets \
  --input .github/rulesets/master-branch-protection.json
```

### Method 3: GitHub API (For Automation)

```bash
# Using curl with GitHub token
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/repos/ngx-vest-forms/ngx-vest-forms/rulesets \
  -d @.github/rulesets/master-branch-protection.json
```

## 👥 Team and Permission Setup

### 1. Create GitHub Teams

Create the following teams in the ngx-vest-forms organization:

```
@ngx-vest-forms/maintainers
├── Repository: Admin permissions
├── Members: Project maintainers and leads
└── Responsibilities: All repository management

@ngx-vest-forms/core-team  
├── Repository: Write permissions
├── Members: Core library developers
└── Responsibilities: Library source code review

@ngx-vest-forms/contributors
├── Repository: Triage permissions  
├── Members: Trusted community contributors
└── Responsibilities: Examples, docs, issue management
```

### 2. Configure Team Permissions

1. Go to Organization Settings → Teams
2. For each team, set repository permissions:
   - **Maintainers**: Admin
   - **Core Team**: Write  
   - **Contributors**: Triage

### 3. Update CODEOWNERS

The `.github/CODEOWNERS` file references these teams. Update team names if different:

```
# Update team names to match your organization structure
* @your-org/maintainers
projects/ngx-vest-forms/src/ @your-org/core-team
```

## 🔧 Workflow Configuration

### 1. Required Secrets

Set up the following repository secrets:

```
NPM_TOKEN          # For publishing to npm
GITHUB_TOKEN       # Automatically provided by GitHub
```

### 2. Environment Setup

1. Go to Repository Settings → Environments
2. Create "production" environment
3. Add protection rules:
   - Required reviewers: @ngx-vest-forms/maintainers
   - Wait timer: 0 minutes (or as needed)

### 3. Branch Protection Migration

If you have existing branch protection rules:

1. **Document Current Settings**
   ```bash
   # List current branch protection rules
   gh api repos/ngx-vest-forms/ngx-vest-forms/branches/master/protection
   ```

2. **Disable Old Rules** (after rulesets are active)
   - Go to Settings → Branches
   - Remove or update existing protection rules
   - Rulesets take precedence over branch protection rules

## 📋 Verification Checklist

After applying the rulesets, verify the following:

### ✅ Branch Protection
- [ ] Cannot push directly to master
- [ ] Cannot delete master branch
- [ ] Cannot force push to master
- [ ] Pull requests are required

### ✅ Review Requirements  
- [ ] At least 1 review required
- [ ] Code owner review required
- [ ] Stale reviews are dismissed
- [ ] Latest push approval required

### ✅ Status Checks
- [ ] CI workflow must pass
- [ ] Branch must be up-to-date
- [ ] All required checks configured

### ✅ Team Access
- [ ] Teams created and configured
- [ ] CODEOWNERS file updated
- [ ] Permissions are correct

### ✅ Workflows
- [ ] CI workflow runs on PRs
- [ ] CD workflow runs on master
- [ ] Repository validation passes
- [ ] Secrets are configured

## 🧪 Testing the Setup

### 1. Test Branch Protection

```bash
# This should fail
git checkout master
echo "test" >> README.md
git add README.md
git commit -m "test: direct push"
git push origin master
# Expected: rejected by remote
```

### 2. Test Pull Request Flow

```bash
# This should work
git checkout -b test/ruleset-verification
echo "<!-- Ruleset test -->" >> README.md
git add README.md
git commit -m "test: verify ruleset setup"
git push origin test/ruleset-verification
# Create PR via GitHub UI
```

### 3. Test Status Checks

1. Create a PR with failing tests
2. Verify that merge is blocked
3. Fix tests and verify merge is allowed

## 🚨 Troubleshooting

### Common Issues

**Issue**: Ruleset not applying
- **Solution**: Check that enforcement is set to "Active"
- **Solution**: Verify include patterns match branch names exactly

**Issue**: CI checks not running
- **Solution**: Verify workflow file syntax with `yamllint`
- **Solution**: Check that workflow has proper permissions

**Issue**: Team mentions not working in CODEOWNERS
- **Solution**: Ensure teams exist and have repository access
- **Solution**: Update team names to match organization structure

**Issue**: Cannot bypass protection rules
- **Solution**: Verify admin permissions for bypass actors
- **Solution**: Use "Allow specified actors to bypass" option

### Getting Help

- **GitHub Support**: For GitHub-specific issues
- **Repository Issues**: For setup-specific problems
- **GitHub Community**: For best practices discussion

## 🔄 Maintenance

### Regular Tasks

1. **Review Ruleset Effectiveness** (Monthly)
   - Check PR review times
   - Monitor bypass usage
   - Evaluate team structure changes

2. **Update Team Membership** (As Needed)
   - Add new maintainers
   - Update contributor permissions
   - Remove inactive members

3. **Audit Security Settings** (Quarterly)
   - Review secret access
   - Check workflow permissions
   - Validate dependency updates

### Evolution Path

The governance model can evolve:

1. **Start Simple**: Basic branch protection
2. **Add Reviews**: Code owner requirements  
3. **Enhance CI**: More comprehensive checks
4. **Scale Teams**: More granular permissions
5. **Advanced Rules**: Custom status checks

---

This setup provides a robust foundation for managing an open source Angular library with proper governance, quality controls, and community contribution processes.