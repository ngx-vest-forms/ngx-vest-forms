# Contributing to ngx-vest-forms

Thank you for your interest in contributing to ngx-vest-forms! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### For External Contributors (Non-Collaborators)

1. **Fork the Repository**: Click the "Fork" button on the GitHub repository page
2. **Clone Your Fork**: 
   ```bash
   git clone https://github.com/YOUR_USERNAME/ngx-vest-forms.git
   cd ngx-vest-forms
   ```
3. **Create a Feature Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make Your Changes**: Follow the development guidelines below
5. **Submit a Pull Request**: Push to your fork and create a PR to the `master` branch

### For Project Collaborators

1. **Clone the Repository**: 
   ```bash
   git clone https://github.com/ngx-vest-forms/ngx-vest-forms.git
   cd ngx-vest-forms
   ```
2. **Create a Feature Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**: Follow the development guidelines below
4. **Submit a Pull Request**: Push your branch and create a PR to the `master` branch

## 🛠️ Development Setup

### Prerequisites

- Node.js 20 or higher
- npm (comes with Node.js)

### Installation

```bash
# Install dependencies
npm ci

# Install Playwright for testing
npx playwright install
```

### Available Scripts

```bash
# Development
npm start                    # Start development server
npm run api                  # Start JSON server for examples

# Building
npm run build:lib           # Build the library
npm run build:app           # Build the examples app
npm run build:ci            # Build both lib and app

# Testing
npm run test:lib            # Run unit tests
npm run test:ci             # Run CI tests
npm run test:storybook      # Run Storybook tests

# Code Quality
npm run prettier:check      # Check code formatting
npm run prettier:format     # Format code

# Documentation
npm run storybook:build     # Build Storybook documentation
```

## 📝 Development Guidelines

### Code Style

- We use **Prettier** for code formatting
- Run `npm run prettier:format` before committing
- Follow existing code patterns and conventions
- Use TypeScript strict mode

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(forms): add new validation directive
fix(core): resolve memory leak in form subscription
docs(readme): update installation instructions
chore(deps): update Angular to v18
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `perf`: Performance improvements

### Testing

- Write unit tests for all new features
- Ensure existing tests pass: `npm run test:ci`
- Add Storybook stories for new components
- Test your changes with the examples app

### Pull Request Guidelines

1. **Keep PRs Focused**: One feature/fix per PR
2. **Write Clear Descriptions**: Explain what and why
3. **Add Tests**: Include tests for new functionality
4. **Update Documentation**: Update README, docs, or Storybook as needed
5. **Check CI**: Ensure all checks pass before requesting review

## 🔍 Code Review Process

1. **Automated Checks**: All PRs must pass CI checks
2. **Required Reviews**: At least one review from a code owner
3. **Status Checks**: CI build, tests, and Storybook must pass
4. **Up-to-date Branch**: Branch must be up-to-date with master

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template and include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Angular version, browser, etc.)
- Minimal reproduction example

### Feature Requests

Use the feature request template and include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Breaking change considerations

## 📋 Project Structure

```
projects/
├── ngx-vest-forms/          # Main library
│   ├── src/lib/            # Library source code
│   └── .storybook/         # Storybook configuration
└── examples/               # Example applications
    └── src/app/            # Example components and usage
```

## 🏷️ Release Process

Releases are automated using semantic-release:
- Merges to `master` trigger automatic releases
- Version numbers follow semantic versioning
- Changelog is automatically generated
- NPM packages are published automatically

## 🛡️ Security

If you discover a security vulnerability, please see our [Security Policy](.github/SECURITY.md) for reporting instructions.

## ❓ Questions

- **General Questions**: Open a discussion on GitHub
- **Bug Reports**: Use the issue templates
- **Feature Requests**: Use the feature request template

## 🙏 Recognition

Contributors are recognized in the following ways:
- Listed in GitHub contributors
- Mentioned in release notes for significant contributions
- Added to the README contributors section (for major contributions)

Thank you for contributing to ngx-vest-forms! 🎉