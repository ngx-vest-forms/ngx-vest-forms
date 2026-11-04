# Merge through a merge queue instead of requiring up-to-date branches

## Status

Accepted

## Date

2026-11-04

## Context

The `Long-Lived Branches` ruleset requires the `ci` check with
`strict_required_status_checks_policy: true`. A PR must be up to date with its
base branch before it can merge. `dependabot-auto-merge.yml` only enables
auto-merge. It never updates the branch, and Dependabot rebases only on a
conflict. So every Dependabot PR that falls behind `master` after another merge
stays `BEHIND` and never merges on its own.

Updating the branch with a workflow would work. But the update is a commit by
another actor, and Dependabot then refuses to rebase or update that PR.

## Decision

Use a GitHub merge queue on `master`.

- `ci.yml` and `pr-title.yml` also run on `merge_group`. The queue tests the
  merge result, so a PR needs no up-to-date branch.
- `pr-title` skips its job on `merge_group`. A skipped job satisfies a required
  check, and the PR title was already linted on the PR.
- `gh pr merge --auto --squash` in `dependabot-auto-merge.yml` adds the PR to the
  queue once its checks pass. That workflow does not change.
- The ruleset change is a repository setting, not a file. A maintainer turns on
  "Require merge queue" in the `Long-Lived Branches` ruleset, with squash as the
  merge method, and turns off the up-to-date requirement. Do this only after this
  change is on `master`, so the queue's checks exist.

## Consequences

- Dependabot minor and patch PRs merge without a human, with no branch update.
- Each merge runs `ci` once more on the queued result. `ci` saves the pnpm store
  only on `push`, so a queue run restores the base branch's cache and saves none.
- The `Long-Lived Branches` ruleset may also cover `release/**`, `beta` and
  `rc`. Turn the queue on only where `ci` and `pr-title` run on `merge_group`.
  Both workflows already list those branches for `pull_request`, and a
  `merge_group` run has no branch filter.
