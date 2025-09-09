# NPM Publishing Configuration

This document outlines the npm publishing configuration and permissions for the `ngx-vest-forms` package.

## Current Setup

### Package Information
- **Package Name**: `ngx-vest-forms`
- **Current Version on npm**: `1.1.0`
- **Registry**: `https://registry.npmjs.org/`
- **Access**: Public
- **Current Maintainer**: `brechtbilliet <billietbrecht@gmail.com>`

### Publishing Process
The package is published automatically using **semantic-release** when changes are pushed to the `master` branch or release branches.

#### Workflow File: `.github/workflows/cd.yml`
- Runs on push to `master` and `release/**` branches
- Uses `NPM_TOKEN` secret for authentication
- Publishes from `dist/ngx-vest-forms` directory
- Configured in `.releaserc` file

### Package Configuration

#### Library package.json (`projects/ngx-vest-forms/package.json`)
The library package.json now includes:
```json
{
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ngx-vest-forms/ngx-vest-forms.git"
  },
  "homepage": "https://github.com/ngx-vest-forms/ngx-vest-forms#readme",
  "bugs": {
    "url": "https://github.com/ngx-vest-forms/ngx-vest-forms/issues"
  }
}
```

## Required GitHub Secrets

The following secrets must be configured in the GitHub repository:

### NPM_TOKEN
- **Purpose**: Authentication for publishing to npm registry
- **Type**: NPM Access Token
- **Scope**: Should have publish permissions for `ngx-vest-forms` package
- **Location**: Repository Settings → Secrets and variables → Actions

### GITHUB_TOKEN
- **Purpose**: Semantic-release GitHub integration (creating releases, updating changelog)
- **Type**: Automatically provided by GitHub Actions
- **Permissions**: Configured in workflow file (`contents: write`, `issues: write`, etc.)

## NPM Package Permissions

### Current Owner
- `brechtbilliet <billietbrecht@gmail.com>`

### To Add New Maintainers
If you need to add additional maintainers to the npm package, the current owner needs to run:

```bash
npm owner add <username> ngx-vest-forms
```

Or through the npm website:
1. Visit https://www.npmjs.com/package/ngx-vest-forms
2. Click "Settings" (requires owner permissions)
3. Add maintainers in the "Maintainers" section

### To Generate NPM_TOKEN
1. Login to npm: `npm login`
2. Create an access token: `npm token create --read-only` (or with appropriate permissions)
3. Add the token to GitHub Secrets as `NPM_TOKEN`

## Verification

### Check Package on NPM
```bash
npm view ngx-vest-forms
```

### Check Current Owners
```bash
npm owner ls ngx-vest-forms
```

### Test Local Publishing (Dry Run)
```bash
npm run build:lib
cd dist/ngx-vest-forms
npm publish --dry-run
```

## Troubleshooting

### Common Issues

1. **403 Forbidden on Publish**
   - Check that `NPM_TOKEN` has proper permissions
   - Verify the token belongs to a user with publish access to the package

2. **Package Already Exists**
   - Semantic-release handles version bumping automatically
   - Ensure the version in package.json is `0.0.0` (semantic-release will update it)

3. **Wrong Repository URLs**
   - Ensure all URLs point to `ngx-vest-forms/ngx-vest-forms` repository
   - Update both source and built package.json files if needed

## Security Notes

- Never commit NPM tokens to the repository
- Use GitHub Secrets for sensitive configuration
- Regularly rotate access tokens
- Monitor package downloads and changes for security issues