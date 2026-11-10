---
name: release-preflight
description: Run before dispatching a release of ngx-vest-forms from master, beta or rc. Audits the commits since the last release tag, reviews the public API, runs the local checks and inspects the built package. User-invoked only.
disable-model-invocation: true
metadata:
  internal: true
---

# Release preflight

A release is a manual dispatch of `cd.yml` on a release branch (`docs/RELEASE.md`). semantic-release derives the version and the release notes from the commit messages alone, so a wrong commit message becomes a wrong release. This skill is the local gate before the dispatch.

It covers the v3 line: `master`, `beta` and `rc`. `release/v1.x` and `release/v2.x` carry older tooling and an older workflow that has no dry run, so a dispatch there publishes once it is approved; release them from `docs/RELEASE.md`.

Run the steps in order. At the first failure, stop and report it with the output; the fix is the user's decision.

## 1. Branch and range

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git status --porcelain
git fetch --tags origin
git rev-parse HEAD "origin/$BRANCH"
```

The dispatch releases the remote branch, so the two commit ids must be equal. Report that id.

Pick the last release tag for the branch, then list the commits since it:

```bash
# master: the last stable tag. semantic-release ignores prerelease tags for a stable release.
LAST=$(git describe --tags --abbrev=0 --match 'v*' --exclude '*-*')
# beta, rc: the last tag of any kind.
LAST=$(git describe --tags --abbrev=0 --match 'v*')

git log --format='%h %s%n%b' "$LAST"..HEAD
```

Done when the branch is `master`, `beta` or `rc`, the tree is clean, local and remote are the same commit, and you hold every commit since `$LAST`.

## 2. Commit audit

Classify every commit from step 1, in this order:

1. A commit with a `BREAKING CHANGE:` footer gives a major release, whatever its type. The `library-api-review` skill holds the reason why `!` alone does not count.
2. Otherwise `feat` gives a minor release; `fix`, `perf` and a revert give a patch.
3. A range with none of these gives **no release**; say so and stop.

Done when you can state the release type the range produces. The dry run of `cd.yml` computes the real version; this step finds the commits that would make it wrong.

## 3. Public API

Run the `library-api-review` skill with `$LAST` as its base. A BLOCK verdict is a failure of this step.

## 4. Local checks

```bash
pnpm verify
pnpm nx run ngx-vest-forms:test-browser
```

`pnpm verify` runs the format check, the skill checks, lint, the spec typecheck, the production library build and the unit tests. The browser tests are a separate target that `cd.yml` does not run; they start a browser, so run them outside a sandbox. `cd.yml` repeats lint, the build and the unit tests, and runs the E2E tests.

## 5. Built package

```bash
ls dist/ngx-vest-forms
node -p "Object.keys(require('./dist/ngx-vest-forms/package.json').exports)"
npm pack ./dist/ngx-vest-forms --dry-run --ignore-scripts
```

Done when the pack list holds `README.md`, `LICENSE`, the `fesm2022` bundle and the type declarations, and `exports` holds `.`, `./internal` and `./package.json`.

## 6. Verdict

Report one line per step with pass or fail, then **GO** or **NO-GO**. GO needs the passing output of steps 4 and 5 from this run. For NO-GO, list each blocking item.

After a GO, the next action is the dry run, which prints the computed version and channel: `gh workflow run cd.yml --ref <branch>`. The publish run (`-f dry_run=false`) is the user's to start.
