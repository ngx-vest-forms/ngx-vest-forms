# GitHub Copilot Instructions

## What matters most in this repo

When generating code for this repository:

1. Respect the exact toolchain versions in `package.json`.
2. Treat `.github/instructions/ngx-vest-forms.instructions.md` as the always-on invariant sheet for ngx-vest-forms usage.
3. Treat `.github/instructions/vest.instructions.md` as the deeper Vest validation guide.
4. Use the umbrella `ngx-vest-forms` skill and its nested workflow sub-skills for feature workflows instead of restating library docs from memory.
5. Prefer patterns already present in the repo over generic framework advice.

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
- Always-on instructions: `.github/instructions/`
- Umbrella skill: `.github/skills/ngx-vest-forms/`

## Public API first

When writing examples for developers using the library:

- import from `'ngx-vest-forms'`
- prefer symbols that exist in `projects/ngx-vest-forms/src/public-api.ts`
- do not recommend imports from `projects/ngx-vest-forms/src/lib/**` or other internal paths unless the task is explicitly about maintaining the library itself

If a new library feature is added, export it in `projects/ngx-vest-forms/src/public-api.ts` and then update the examples, docs, and skills.

## Working rules

- Keep `name` aligned with the `[ngModel]` path.
- Use `[ngModel]`, not `[(ngModel)]`, for ngx-vest-forms examples.
- Use optional chaining with partial form models.
- Call `only(field)` unconditionally in Vest suites.
- Use `vestFormsViewProviders` in child form components that participate in the parent form tree.

These rules live in the invariant instruction file; correct violations instead of arguing with them.

## How to choose guidance sources

- Need the baseline rules: read `.github/instructions/ngx-vest-forms.instructions.md`
- Need Vest suite semantics: read `.github/instructions/vest.instructions.md`
- Need default form setup: use the `core/` workflow sub-skill under `ngx-vest-forms`
- Need `validationConfig` guidance: use the `validation-config-builder/` workflow sub-skill under `ngx-vest-forms`
- Need `ROOT_FORM`: use the `root-form-validation/` workflow sub-skill under `ngx-vest-forms`
- Need wrappers: use the `built-in-wrappers/` or `custom-wrapper-patterns/` workflow sub-skill under `ngx-vest-forms`
- Need composite adapter (one widget, multiple fields): use the `composite-adapter/` workflow sub-skill under `ngx-vest-forms`
- Need nested sections: use the `child-components/` workflow sub-skill under `ngx-vest-forms`
- Need dynamic structure changes: use the `dynamic-form-behavior/` workflow sub-skill under `ngx-vest-forms`

## Library maintenance workflow

When changing the library itself:

1. Implement in `projects/ngx-vest-forms/src/lib/`
2. Export the supported surface in `projects/ngx-vest-forms/src/public-api.ts`
3. Add or update example usage in `projects/examples/`
4. Add or update tests
5. Update docs and any affected skill/reference files

## Style and quality

- Keep code aligned with existing Angular 21 + signals patterns.
- Prefer clear, typed examples over clever abstractions.
- Follow repository naming and file-organization patterns.
- Do not introduce new architectural styles unless the task requires it.

## Chat guidelines

- Do not use emojis in chat responses, except for checking off tasks.
- Verify version compatibility before suggesting code changes.
- Prefer concise repo-specific guidance over long repeated tutorials.
