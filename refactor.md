# NgxVestForms v2 Architecture: Progressive Enhancement Strategy

Start simple, enhance progressively. Deliver a minimal, fast core that covers 80% of use cases and add advanced features via opt-in directives. Favor composition over configuration.

- Angular 20.1+ first-class, signals-centric, zoneless-compatible

## Entry Points (Final, 4 total)

- ngx-vest-forms/schemas – Runtime schema validation helpers
- ngx-vest-forms/smart-state – External state sync for complex scenarios

Use these names everywhere (code, tests, docs, examples):

- Inputs/outputs
  - `[vestSuite]` – The Vest suite input (single name everywhere)
  - `[(formValue)]` – Two-way binding of the whole model
  - `[formSchema]` – Schema input (runtime or adapter)
  - `[smartState]` – Smart-state config
  - `[formLevelValidation]` – Enable cross-field/root validation
  - `[formLevelValidationMode]` – `'submit' | 'live'` (default `'submit'`)
  - `[enableDebug]`, `[enablePerformanceTracking]` – Dev-only flags
- Directives (selectors)
  - `form[ngxVestForm]` – Core form directive
  - `form[ngxVestForm][formSchema]` – Schema feature directive
  - `form[ngxVestForm][smartState]` – Smart-state feature directive
  - `form[ngxVestForm][formLevelValidation]` – Cross-field/root validation directive (opt-in)
  - `form[ngxVestForm][enableDebug]` – Debug/logging feature directive
  - `form[ngxVestFormEnhanced]` – Composition wrapper (optional)
- Files
  - kebab-case for file names, types over interfaces where possible

## API & DX Principles (Minimal Boilerplate)

- Predictable, explicit inputs: no hidden magic; all features opt-in via additional inputs (`[formSchema]`, `[smartState]`, `[enableDebug]`).
- Ergonomic defaults: sane defaults for debounce, submit handling, and error aggregation.

## Documentation & JSDoc Standards

- JSDoc required for all public exports (directives, types, helpers):
  - Brief description, parameter docs, return types, usage snippet.
  - Document breaking changes and deprecations with `@deprecated`.
  - Link to examples in the examples app where relevant.
- README per entry point with quickstart, API surface, and examples.
- Keep docs authoritative and consistent with naming conventions above.

## Current Status vs Goals (High Level)

- Core/Schema separation: Complete
- Modern Angular patterns (signals, host, control flow): Adopted
- Tree-shaking, multiple entry points: Working
- Core directive size: ~276 LOC (aim for smaller, keep simple)
- Test coverage: ~80% (target ≥95% by 2.0)

## Musts for First Beta (2.0.0-beta.1)

- Keep core directive small and simple (optional improvement: aim <200 LOC; avoid over-engineering)
- 100% naming consistency: `vestSuite`, `formSchema`, `smartState` ✅
- Zero manual subscriptions (prefer effects/signals; if needed, use `takeUntilDestroyed`)
- Remove legacy and backups: `*.backup`, `*.clean`, commented-out blocks
- Remove `ValidateRootFormDirective` (duplicate/overlap with core) ✅
- Slim down FormControlState-related logic; aim for lean helpers in utils
- Examples updated to new API and Angular control flow (`@if`/`@for`) ✅
- Add one Playwright + MSW E2E covering a full submit flow
- Migration draft: v1 → v2 quickstart with renames (`formSuite` → `vestSuite`, `formShape` → `formSchema`)
- JSDoc coverage for all public exports in core and schemas

## Musts for v2.0 (Stable)

- Test coverage ≥95% across core/schemas/control-wrapper/smart-state
- Benchmark bundle sizes and document results
  - Core: ≤15KB (guideline)
  - Core + Schemas: ≤20KB (guideline)
- Finalize migration guide with troubleshooting
- Documentation site draft: concepts, API, recipes, migration
- Simplified FormControlState, zero leaky abstractions

## v2.1+ (Roadmap)

- Debug directive (dev-only, fully tree-shakeable)
- FormArray/dynamic structure improvements
- Validation dependencies feature
- Additional schema adapters (Yup/Joi) with adapter guide
- ESLint rule: name attribute validation vs `[ngModel]` path (with autofix where possible)
- Interactive docs playground

## Architecture & Directory Layout

```text
projects/ngx-vest-forms/
├── core/
│   └── src/
│       ├── directives/
│       │   ├── form-core.directive.ts      # form[ngxVestForm]
│       │   └── ...                         # other small directives only as needed
│       ├── models/
│       │   ├── form-state.model.ts
│       │   └── validation.model.ts
│       └── utils/
│           ├── form-utils.ts
│           ├── form-errors.ts              # extracted from core
│           └── validation-cache.ts         # extracted from core
├── control-wrapper/
├── schemas/
│   └── src/
│       ├── schema-adapter.ts
│       └── v1-migration.ts                 # formShape → StandardSchema helper
└── smart-state/
```

## Directives (Sketches)

- Core (`form[ngxVestForm]`)
  - Inputs: `[(formValue)]`, `[vestSuite]`, `[validationOptions]`
  - Minimal state: `submitted`, `valid`, `dirty`, `errors`
  - Validators produced per-field via `vestSuite`; debounce configurable
  - Submit marks all as touched
- Schema feature (`form[ngxVestForm][formSchema]`)
  - Runs schema on submit; populates `schemaState` and `errorMap`
  - No extra runtime coupling to core beyond `hostDirectives`
- Smart state (`form[ngxVestForm][smartState]`)
  - Optional external sync + conflict resolution; separate entry point
- Cross-field validation (`form[ngxVestForm][formLevelValidation]`)
  - AsyncValidator on the form root; opt-in
  - Modes: `formLevelValidationMode = 'submit' | 'live'` (default `'submit'`)
  - Calls `vestSuite(model, NGX_ROOT_FORM)`; maps messages to Angular `ValidationErrors` and `_root` in `errorMap`
  - No manual subscriptions; single-run per validation request
- Debug (`form[ngxVestForm][enableDebug]`)
  - Dev-only logging/perf tracking; fully tree-shakeable

Keep code in each directive concise; avoid feature creep in core.

## Breaking Changes & Cleanup (Allowed in v2)

- Rename everywhere: `formSuite` → `vestSuite`; `formShape` → `formSchema`
- Refactor/rename root validator: `ValidateRootFormDirective` → simple opt-in cross-field validation directive (`form[ngxVestForm][formLevelValidation]`) with `formLevelValidationMode` and no manual subscriptions
- Reduce/simplify FormControlState; move helpers to utils; avoid duplicate state
- Remove `*.backup`, `*.clean`, and commented-out code
- Replace `HostBinding`/`HostListener` with host metadata
- Replace `*ngIf`/`*ngFor`/`*ngSwitch` with `@if`/`@for`/`@switch` in examples and docs
- No manual subscriptions; prefer signals/effects; if unavoidable, use `takeUntilDestroyed`

## Vest Best Practices (Enforced in Examples/Docs)

- Use `staticSuite` and `only(currentField)` for performant field-level validation
- Co-locate validations per domain in `*.validations.ts` files
- Keep messages user-focused and actionable
- Map root-level issues to `_root` in `errorMap`

## TypeScript & Angular Guidelines (Project-wide)

- Strict TS, prefer types over interfaces; no `any` (use `unknown` if needed)
- Use private class fields (`#`) and `readonly` where applicable
- Use `inject()`, `signal()`, `computed()`, `effect()`; avoid manual DI constructors
- Host bindings via `host` metadata; no `@HostBinding`/`@HostListener`
- Prefer `model()`/`input()`/`output()` over legacy Input/Output decorators
- Always use modern control flow in templates; semantic HTML and accessible labels

## Testing Strategy (Authoritative)

- Unit/Component: Vitest + Angular Testing Library
  - Follow `.github/instructions/vitest-test.instructions.md`
  - Use `render()`; role/label/text queries; avoid internal property access
  - Prefer `userEvent` from `@vitest/browser/context`
  - Use modern Angular test APIs; always await `ApplicationRef.whenStable()` in async tests
  - Root validation tests: assert form becomes INVALID when `_root` errors exist; verify `_root` messages render
- E2E: Playwright ≥1.51
  - Follow `.github/instructions/playwright.instructions.md`
  - Role-based locators, `test.step()` grouping, web-first assertions
  - Block submit when root errors exist; show root error summary
  - Tests live in `tests/` with `<feature>.spec.ts` naming

## Examples App Requirements

- Use core-only patterns in fundamentals; wrapper optional elsewhere
- Use `@if`/`@for`, accessible labels, and `NgOptimizedImage` for static images
- Demonstrate: core-only, schema, and smart-state flows
- Add one Playwright E2E covering a full submit flow with mocked API via MSW

## Success Metrics & Benchmarks (Guidelines)

- Core directive: small and readable (aim <200 LOC)
- No directive should be complex; favor utility extraction over size-chasing
- Bundle size (built and measured):
  - Core ≤15KB; Core+Schemas ≤20KB (guidelines, not hard caps)
- Test coverage: ≥95% (Vitest) by v2.0
- Zero manual subscriptions and zero backup files
- JSDoc coverage: 100% for public APIs

## Usage Patterns (Concise)

- Core only

```typescript
<form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
  <input name="email" [ngModel]="model().email" />
  @if (form.formState().errors['email']) {
    <div>{{ form.formState().errors['email'][0] }}</div>
  }
</form>
```

- With schema

```typescript
<form ngxVestForm [vestSuite]="suite" [formSchema]="schema" [(formValue)]="model"></form>
```

- With smart state

```typescript
<form ngxVestForm [vestSuite]="suite" [smartState]="{ externalSource$: data$ }" [(formValue)]="model"></form>
```

## Migration (v1 → v2)

- Replace `formSuite` with `vestSuite`; replace `formShape` with `formSchema` (or migrate via `v1-migration.ts`)
- Update templates to modern control flow and signals-based patterns
- Verify `name` attributes match `[ngModel]` property paths
- Form-level validation (root): `[validateRootForm]` → `formLevelValidation` and add `[formLevelSuite]` (plus optional `[formLevelValidationMode]`).
  - Reuse one suite for both: `<form ngxVestForm [vestSuite]="suite" formLevelValidation [formLevelSuite]="suite">`.
  - Or split suites: `<form ngxVestForm [vestSuite]="fieldSuite" formLevelValidation [formLevelSuite]="rootSuite">`.

## Actionable Task Lists

### Beta (2.0.0-beta.1)

- [x] Standardize naming across code, tests, examples (`vestSuite`, `formSchema`, `smartState`)
- [x] Refactor root validator to `form[ngxVestForm][formLevelValidation]` with `formLevelValidationMode` (default `'submit'`)
- [x] Prune `*.backup`/`*.clean` files and commented code
- [x] Update examples to `@if`/`@for` and modern patterns
- [x] Draft v1→v2 migration guide (renames + schema helper)
- [ ] Add Playwright + MSW E2E for one critical submit flow (including root errors)
- [ ] Ensure 100% JSDoc coverage for public APIs in core and schemas
- [ ] Keep core directive small/simple (optional improvement: aim <200 LOC); extract helpers where it improves clarity

### Beta (2.0.0-beta.2)

- [ ] Upgrade Tailwind CSS to latest version v4
- [ ] Make ngx-control-wrapper tailwind agnostic and use css custom properties instead
  - [ ] Update styles to use custom properties
  - [ ] Remove any tailwind-specific classes
  - [ ] Ensure compatibility with existing tailwind styles (allow Tailwind variables/css custom properties to be used)
  - [ ] Document the migration process for existing styles
  - [ ] Create a set of utility classes for common styles (if needed)

### Beta (2.0.0-beta.3)

- [ ] Add more advanced nested array validation examples
  - [ ] A TodoList with subtasks, with nested array of items (or something similar)
- [ ] Improve error messaging and handling for nested structures

### v2.0 (Stable)

- [ ] Simplify FormControlState; move logic to utils; avoid leaky abstractions
- [ ] Raise test coverage to ≥95% across all entry points
- [ ] Finalize migration guide with troubleshooting
- [ ] Finalize root validation API/modes and examples; add advanced tests
- [ ] Benchmark bundle sizes and document results (core, core+schemas)

### v2.1+

- [ ] Draft documentation site (concepts, API, recipes, migration)
- [ ] Dev-only Debug directive (separate, tree-shakeable)
- [ ] FormArray/dynamic structure improvements
- [ ] Validation dependencies feature
- [ ] Additional schema adapters (Yup/Joi) + adapter guide
- [ ] ESLint rule: validate `name` vs `[ngModel]` path (with autofix)
  - [ ] Other ESLint rules if applicable

## Final Notes

- Keep the core minimal and opinion-free; move optional logic to features
- Prefer composition via `hostDirectives`; avoid abstract base directives
- Optimize for developer understanding and minimal boilerplate
- Document common paths; keep edge cases out of core

## Testing Artifacts Policy

- Keep Vitest textual snapshots committed in `__snapshots__/`.
- Ignore Playwright outputs and heavy artifacts in git: `playwright-report/`, `test-results/`, and any `__screenshots__/` directories.
- Avoid committing backup/legacy files: `*.backup`, `*.clean`, and `**/backup-old-examples/`.

## Schema Module Architecture (v2)

### Adapter Pattern Implementation

- Implement individual adapters for each schema library (Zod, Valibot, ArkType, Yup)
- Each adapter implements `SchemaAdapter` interface with:
  - `vendor`: string identifier
  - `isSupported(schema)`: detection logic
  - `toStandardSchema(schema)`: conversion to Standard Schema v1
- Use adapter registry pattern for extensibility and tree-shaking

### Standard Schema Compliance

- Fully implement Standard Schema v1 specification
- Libraries with native support (Zod 3.24+, Valibot 1.0+, ArkType 2.0+): direct pass-through
- Legacy libraries: provide conversion adapters
- Custom `ngxModelToStandardSchema`: refactor as adapter

### File Structure

```text
schemas/
├── src/
│   ├── adapters/
│   │   ├── base.adapter.ts         # SchemaAdapter interface
│   │   ├── zod.adapter.ts
│   │   ├── valibot.adapter.ts
│   │   ├── arktype.adapter.ts
│   │   ├── yup.adapter.ts
│   │   ├── custom-model.adapter.ts # ngxModelToStandardSchema
│   │   └── index.ts                # Tree-shakeable exports
│   ├── adapter-registry.ts         # Central registry
│   ├── runtime-schema.ts           # Runtime normalization only
│   ├── schema-validation.directive.ts
│   └── standard-schema.types.ts    # Standard Schema v1 types
```
