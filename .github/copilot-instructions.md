# GitHub Copilot Instructions

## What matters most in this repo

When generating code for this repository:

1. Respect the exact toolchain versions in `package.json`.
2. Use the model-invoked `ngx-vest-forms` skill only for requests involving this library’s APIs or behavior.
3. Treat `.github/instructions/vest.instructions.md` as the deeper Vest validation guide.
4. Prefer patterns already present in the repo over generic framework advice.

## Branch policy (read before opening PRs)

This repo maintains parallel release lines. Pick the right base branch before
proposing changes.

- **`master`** — current stable v2 maintenance line. Only target master for v2
  bug fixes, security patches, or repo-wide governance/tooling changes that
  must apply to the default branch (PR templates, dependabot config,
  copilot instructions, CI policy). Do not target master for new v3 features
  or refactors.
- **`release/v3`** — active v3 development. All v3 features, refactors, test
  migrations, and v3-specific dependency upgrades target this branch. Merging
  here does **not** auto-publish; v3 only ships via manual
  `workflow_dispatch` of `.github/workflows/prerelease.yml` (snapshot
  prereleases) — never on PR merge.
- Other `release/*` branches are maintenance-only for their respective majors.

When uncertain, default to `release/v3` and call out the choice in the PR
description so a reviewer can redirect if needed.

## Version baseline

- Angular framework packages: `21.2.5`
- Angular CLI/build tooling: `21.2.3`
- TypeScript: `~6.0.2`
- Node.js: `>=22.0.0`
- RxJS: `~7.8.2`
- Vest.js: `~5.4.6`
- Vitest: `^4.1.1`
- Playwright: `1.58.2`
- Storybook: `10.3.3`

Do not suggest code that depends on newer language or framework features than these versions support.

## Repo shape

- Library source: `projects/ngx-vest-forms/`
- Demo/examples app: `projects/examples/`
- Library public surface: `projects/ngx-vest-forms/src/public-api.ts`
- Domain docs: `docs/`
- Umbrella skill: `.agents/skills/ngx-vest-forms/`

## How to choose guidance sources

- Need ngx-vest-forms guidance: use the `ngx-vest-forms` skill
- Need Vest suite semantics: read `.github/instructions/vest.instructions.md`
- Need default form setup: use the `core/` workflow sub-skill under `ngx-vest-forms`
- Need `validationConfig` guidance: use the `validation-config-builder/` workflow sub-skill under `ngx-vest-forms`
- Need `ROOT_FORM`: use the `root-form-validation/` workflow sub-skill under `ngx-vest-forms`
- Need wrappers: use the `built-in-wrappers/` or `custom-wrapper-patterns/` workflow sub-skill under `ngx-vest-forms`
- Need composite adapter (one widget, multiple fields): use the `composite-adapter/` workflow sub-skill under `ngx-vest-forms`
- Need nested sections: use the `child-components/` workflow sub-skill under `ngx-vest-forms`
- Need dynamic structure changes: use the `dynamic-form-behavior/` workflow sub-skill under `ngx-vest-forms`

## Style and quality

- Keep code aligned with existing Angular 21 + signals patterns.
- Prefer clear, typed examples over clever abstractions.
- Follow repository naming and file-organization patterns.
- Do not introduce new architectural styles unless the task requires it.

## Chat guidelines

- Do not use emojis in chat responses, except for checking off tasks.
- Verify version compatibility before suggesting code changes.
- Prefer concise repo-specific guidance over long repeated tutorials.
