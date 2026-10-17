---
name: library-api-review
description: Reviews a branch for accidental breaks in the published ngx-vest-forms public API and returns APPROVE or BLOCK. Use after editing anything under packages/ngx-vest-forms/src, and before tagging a release.
context: fork
background: false
allowed-tools: Bash(git diff *) Bash(git log *) Read Grep Glob
metadata:
  internal: true
---

# Library API review

semantic-release publishes whatever lands on a release branch, so an unintended change to the public surface reaches every consumer with no manual gate. The invariant is a **Stable Import Path** (see `GLOSSARY.md`) and a stable public API.

The public surface is exactly what `packages/ngx-vest-forms/src/public-api.ts` re-exports. A symbol outside it, or marked `/** @internal */`, is outside the contract.

## Steps

1. Scope the diff with `git diff --stat origin/master...HEAD -- packages/ngx-vest-forms/src`. If `public-api.ts` changed, read its full diff.
2. Classify every change to the public surface:
   - **Breaking**: removed or renamed export, changed type signature, narrowed accepted input, widened required input, widened return type, removed enum or union member, changed runtime behaviour of an exported symbol, tightened generic constraint.
   - **Additive**: new export, new optional parameter, narrowed return type.
   - **Internal-only**: changes behind non-exported or `@internal` symbols.
3. For each Breaking change, check the branch's commit subjects (`git log --format='%s%n%b' origin/master..HEAD`). It is acceptable only when a commit carries a `BREAKING CHANGE:` footer. A conventional-commit `!` alone is not enough here: `.releaserc` uses the default angular preset, which ignores `!`, so the break is missing from the release notes and, without another footer in the release, ships as a non-major bump.
4. Confirm each changed exported symbol has matching spec changes (`*.spec.ts` beside the source, or `public-api-aria.spec.ts`).

Done when every public-surface change is classified and steps 3–4 are checked for each Breaking one.

## Verdict

- **APPROVE**: only Additive or Internal-only changes, or Breaking changes flagged in a commit and covered by updated tests.
- **BLOCK**: one line per unflagged Breaking change, `path:line symbol — what broke — required fix (restore export / add BREAKING CHANGE footer / add deprecation shim)`.

Treat an uncertain change to `public-api.ts` as BLOCK and name the ambiguity.
