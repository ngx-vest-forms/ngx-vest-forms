---
name: release-preflight
description: Run before tagging or merging a release of ngx-vest-forms. Audits conventional commits, builds all targets, diffs the public API, and verifies the publishable dist. User-invoked only.
disable-model-invocation: true
---

# Release Preflight

This repo publishes `ngx-vest-forms` via **semantic-release** on push to a
release branch. The version bump and changelog are derived entirely from
conventional commit messages, and whatever is built is what consumers get.
This skill is the manual gate that semantic-release does not provide.

Run every step. Stop and report at the first hard failure — do not "fix and
continue" silently.

## 1. Branch & status

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git log --format='%s' origin/master..HEAD
```

Confirm the branch is a release branch (`master`, `release/**`, `next`,
`beta`, `alpha`, `rc`) and the tree is clean.

## 2. Conventional-commit audit

Inspect every subject from step 1:

- Each must match `type(scope): subject` with a Conventional Commits type.
- Any change to `packages/ngx-vest-forms/src/public-api.ts` that removes or
  changes an export **requires** a `!` or `BREAKING CHANGE:` footer on at
  least one commit. Flag the mismatch — this is the most common bad release.
- A release with only `chore`/`docs`/`test`/`ci` commits produces **no
  release**. Say so explicitly if that is the case.

## 3. Public-API diff

```bash
git diff origin/master...HEAD -- packages/ngx-vest-forms/src/public-api.ts
```

Summarize added / removed / changed exports. Cross-check against the commit
audit in step 2. Consider dispatching the `library-api-reviewer` subagent for
a full verdict.

## 4. Build, lint, test (via Nx — never raw tooling)

```bash
pnpm nx run-many --target=lint
pnpm nx run-many --target=test
pnpm nx run ngx-vest-forms:build --configuration=production
```

All three must pass. Report the failing target and output verbatim on failure.

## 5. Verify the publishable artifact

```bash
ls dist/ngx-vest-forms
test -f dist/ngx-vest-forms/README.md && echo "README copied"
node -p "Object.keys(require('./dist/ngx-vest-forms/package.json').exports || {})"
```

Confirm `dist/ngx-vest-forms` contains the built package, the bundled
`README.md` (the `postbuild:lib` step), and a sane `exports` map.

## 6. Verdict

Emit a checklist with ✅/❌ per step and a final **GO** / **NO-GO**. For
NO-GO, list the exact blocking items. Never claim GO without having seen the
passing output of steps 4 and 5 in this run.
