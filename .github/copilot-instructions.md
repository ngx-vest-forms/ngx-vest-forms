# GitHub Copilot Instructions

## What matters most in this repo

When generating code for this repository:

1. Treat `.github/instructions/ngx-vest-forms.instructions.md` as the always-on invariant sheet for ngx-vest-forms usage.
2. Treat `.github/instructions/vest.instructions.md` as the always-on Vest 6 invariant sheet, and use `.agents/skills/vestjs/` for deeper workflow guidance.
3. Prefer the local skills under `.agents/skills/ngx-vest-forms/` and `.agents/skills/vestjs/` over generic framework advice.
4. Prefer coding patterns already used in the repository's Angular components, examples, services, and public API over generic best-practice examples.

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
  prereleases on the `v3-snapshot` npm dist-tag) — never on PR merge.
- Other `release/*` branches are maintenance-only for their respective majors.

When uncertain, default to `release/v3` and call out the choice in the PR
description so a reviewer can redirect if needed.

## Version baseline

Use the versions in `package.json` and the baseline below as hard compatibility limits for generated code and advice.

- Angular framework packages: `21.2.11`
- Angular CLI/build tooling: `21.2.9`
- TypeScript: `~5.9.3`
- Node.js: `>=22.0.0`
- RxJS: `~7.8.2`
- Vest.js: `~6.3.2`
- Vitest: `^4.1.5`
- Playwright: `1.59.1`
- Storybook: `10.3.6`

You can suggest code that depends on features introduced in versions of Angular, TypeScript, Node.js, RxJS, Vest, Vitest, Playwright, Storybook, or other dependencies newer than the versions listed here or in `package.json`. But come with a strong justification for why the newer feature is necessary and how it improves on the existing patterns in the repo. Do not suggest newer features just because they exist or are trendy if they do not clearly enhance the code quality, readability, or maintainability of the generated code in this specific repository context.

## Repo shape

- Library source: `projects/ngx-vest-forms/`
- Demo/examples app: `projects/examples/`
- Library public surface: `projects/ngx-vest-forms/src/public-api.ts`
- Domain docs: `docs/`
- Always-on instructions: `.github/instructions/`
- Local skills: `.agents/skills/`

## Public API first

When writing examples for developers using the library:

- import from `'ngx-vest-forms'`
- prefer symbols that exist in `projects/ngx-vest-forms/src/public-api.ts`
- do not recommend imports from `projects/ngx-vest-forms/src/lib/**` or other internal paths unless the task is explicitly about maintaining the library itself

If a new library feature is added, export it in `projects/ngx-vest-forms/src/public-api.ts` and then update the examples, docs, and skills.

## Working rules

- Keep the `name` attribute aligned with the `[ngModel]` path.
- Use `[ngModel]`, not `[(ngModel)]`, for ngx-vest-forms examples.
- Use optional chaining with partial form models.
- Use Vest 6 suite callbacks with a model-only signature: `create((model) => { ... })`.
- Handle field-focused validation at the call site with `suite.only(field).run(model)`.
- Use `vestFormsViewProviders` in child form components that participate in the parent form tree.
- Prefer `<ngx-control-wrapper>` for single controls and group wrappers for `ngModelGroup` containers.
- The examples app mocks the people API in-app via `mockPeopleApiInterceptor`; no separate backend is required.

## How to choose guidance sources

- Need baseline usage rules: read `.github/instructions/ngx-vest-forms.instructions.md`
- Need baseline Vest suite invariants: read `.github/instructions/vest.instructions.md`
- Need deeper Vest workflow guidance: use `.agents/skills/vestjs/`
- Need default form setup: use `.agents/skills/ngx-vest-forms/core/`
- Need `validationConfig`: use `.agents/skills/ngx-vest-forms/validation-config-builder/`
- Need `ROOT_FORM`: use `.agents/skills/ngx-vest-forms/root-form-validation/`
- Need wrappers: use `.agents/skills/ngx-vest-forms/built-in-wrappers/` or `custom-wrapper-patterns/`
- Need composite widgets mapped to multiple fields: use `.agents/skills/ngx-vest-forms/composite-adapter/`
- Need blur-driven autosave: use the examples and docs around `fieldBlur`

## Library maintenance workflow

When changing the library itself:

1. Implement in `projects/ngx-vest-forms/src/lib/`
2. Export the supported surface in `projects/ngx-vest-forms/src/public-api.ts`
3. Add or update example usage in `projects/examples/`
4. Add or update tests
5. Update docs and any affected skill/reference files

## Style and quality

- Keep code aligned with Angular 21 + signals patterns already used in the repo.
- Prefer clear, typed examples over clever abstractions.
- Follow repository naming and file-organization patterns.
- Keep accessibility and predictable validation UX in mind.
- Do not reintroduce legacy Vest 5 callback-field patterns into Vest 6 code.

## Chat guidelines

- Verify version compatibility before suggesting code changes.
- Prioritize consistency with existing codebase patterns over external best practices.
- Avoid stale Vest 5 guidance such as `staticSuite((model, field?) => ...)`, callable suites, or `only()` inside the suite callback.
