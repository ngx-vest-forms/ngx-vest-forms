---
name: ngx-vest-forms
description: Routes general ngx-vest-forms requests to the right workflow. Use this whenever the user broadly asks about ngx-vest-forms, wants help with the library but the feature area is not obvious yet, asks for best practices, migration help, blur-driven draft auto-save, `fieldBlur`, swapping the equality function with `NGX_EQUALITY_FN`, or says things like "how should I build this with ngx-vest-forms?" even when they do not mention `validationConfig`, wrappers, child components, root-form validation, or field-level persistence explicitly.
---

# ngx-vest-forms router skill

Use this as the broad entry point for ngx-vest-forms questions. It covers ngx-vest-forms v3 on Angular 22, RxJS 7.8+ and Vest 6.3+.

## Invariants

Every answer and code sample follows these. When the user's code breaks one, correct it before anything else.

| Rule                 | Write                                                                                                                                                       | Instead of                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Binding              | `[ngModel]="formValue().email"` on the control, `(formValueChange)="formValue.set($event)"` on the form                                                     | `[(ngModel)]`                                   |
| Field Path           | `name` joined with the enclosing `ngModelGroup` names equals the Field Path: `ngModelGroup="address"` + `name="street"` binds `formValue().address?.street` | a `name` that drifts from the bound path        |
| Optional chaining    | `formValue().address?.street`, because the Form Model is `NgxDeepPartial<T>`                                                                                | `formValue().address.street`                    |
| Suite                | Vest 6 `create((model) => { ... })` with a model-only callback, typed as `NgxVestSuite<T>`                                                                  | `(model, field)` callbacks, `staticSuite`       |
| Focused Run          | `suite.only(field).run(model)` at the call site                                                                                                             | `only(field)` inside the suite callback         |
| Child Form Component | `viewProviders: [vestFormsViewProviders]`                                                                                                                   | no `viewProviders`                              |
| Wrapper              | `<ngx-control-wrapper>` around one control; `<ngx-form-group-wrapper ngModelGroup="...">` around a group                                                    | a control wrapper around a whole `ngModelGroup` |

## Stay on the public API surface

Recommend imports from `'ngx-vest-forms'` only, and check that the package exports the symbol (see [`public-api.ts`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/packages/ngx-vest-forms/src/public-api.ts)). Paths under `packages/ngx-vest-forms/src/lib/**` are for maintaining the library itself.

## Available workflow sub-skills

Use these nested workflow sub-skills when the feature area is clear:

| Sub-skill                   | Use when                                                                                            | Path                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `core`                      | first examples, form structure, `[ngModel]`, `NgxDeepPartial`, typed suites                         | `core/SKILL.md`                      |
| `validation-config-builder` | dependent field revalidation, `createValidationConfig()`, `whenChanged`, `bidirectional`            | `validation-config-builder/SKILL.md` |
| `field-blur-events`         | draft auto-save, blur-driven persistence, analytics, `fieldBlur`, `NgxFieldBlurEvent`               | `field-blur-events/SKILL.md`         |
| `root-form-validation`      | `ROOT_FORM`, `ngxValidateRootForm`, summary-level business rules                                    | `root-form-validation/SKILL.md`      |
| `built-in-wrappers`         | built-in wrapper selection, display modes, `ariaAssociationMode`                                    | `built-in-wrappers/SKILL.md`         |
| `custom-wrapper-patterns`   | design-system wrappers, `FormErrorDisplayDirective`, `FormErrorControlDirective`                    | `custom-wrapper-patterns/SKILL.md`   |
| `child-components`          | nested `ngModelGroup`, reusable form sections, `vestFormsViewProviders`                             | `child-components/SKILL.md`          |
| `composite-adapter`         | one UI widget mapping to multiple flat form fields, hidden proxy fields, fan-out, error aggregation | `composite-adapter/SKILL.md`         |
| `dynamic-form-behavior`     | clearing hidden values, structure changes, `triggerFormValidation()`                                | `dynamic-form-behavior/SKILL.md`     |

## Route to the right workflow

### Core form setup

Read `core/SKILL.md` when the user is:

- starting a form from scratch
- asking for a proper example
- unsure how to structure a component around ngx-vest-forms
- asking about `NgxDeepPartial`, the Form Contract, or signal-based form state
- swapping the equality function with `NGX_EQUALITY_FN`
- translating or renaming the wrappers' "Validating…" text with `NGX_PENDING_LABEL`
- writing tests for a form/Vest suite, asking about `staticSuite`, `runStatic`,
  resetting stateful suites between tests, or "tests pass locally but fail in CI"

### Dependent field revalidation

Read `validation-config-builder/SKILL.md` when the user is:

- asking why one field does not revalidate when another changes
- dealing with confirm-password, date ranges, country/state, or `omitWhen`
- mentioning `validationConfig`, `createValidationConfig()`, `whenChanged`, `bidirectional`, or `group`

### Field blur events and draft persistence

Read `field-blur-events/SKILL.md` when the user is:

- asking for draft auto-save, blur-save, or recovery-oriented persistence
- mentioning `fieldBlur` or `NgxFieldBlurEvent`
- wiring analytics or side effects to a field blur event
- trying to save on blur without turning validation into a persistence gate
- asking how to keep dependent fields logically invalid but visually quiet until their own blur

### Form-level rules

Read `root-form-validation/SKILL.md` when the user is:

- asking for a message that belongs to the entire form
- comparing `ROOT_FORM` versus field-level validation
- working with `ngxValidateRootForm` or `ngxValidateRootFormMode`

### Built-in wrappers

Read `built-in-wrappers/SKILL.md` when the user is:

- asking which wrapper to use
- working with `ngx-control-wrapper` or `ngx-form-group-wrapper`
- asking about error or warning display modes

### Custom wrappers

Read `custom-wrapper-patterns/SKILL.md` when the user is:

- building a design-system wrapper
- using `FormErrorDisplayDirective` or `FormErrorControlDirective`
- asking about `hostDirectives`, ARIA wiring, or custom pending/error UI

### Child components

Read `child-components/SKILL.md` when the user is:

- splitting a large form into reusable sections
- working with nested `ngModelGroup`
- debugging missing `vestFormsViewProviders`

### Composite adapters

Read `composite-adapter/SKILL.md` when the user is:

- mapping one UI widget to multiple flat form model fields
- asking about date range pickers, name splitters, or multi-field composites
- using hidden proxy fields with `setValueAtPath` fan-out
- aggregating errors from multiple fields into a single UI region
- asking why `<ngx-control-wrapper>` does not work for their composite control

### Dynamic structure changes

Read `dynamic-form-behavior/SKILL.md` when the user is:

- showing/hiding controls dynamically
- replacing inputs with static content
- clearing hidden values
- asking when `triggerFormValidation()` is necessary

## Routing heuristics

- If the user mentions several of these at once, combine the relevant sub-skills instead of forcing a single lens.
- Draft auto-save with quiet dependent errors usually combines `field-blur-events`, `validation-config-builder`, and `built-in-wrappers`.
- If the issue is specifically about Vest semantics, also load the `vestjs` skill if it is installed (`npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs`).
- For migration from v2, read [MIGRATION-v2.x-to-v3.0.0.md](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/migration/MIGRATION-v2.x-to-v3.0.0.md) first: it covers removed APIs such as `validateShape` (now `toFormContract()`) and `cloneDeep` (now `structuredClone`).
- If the issue is generic Angular rather than library-specific, prefer the Angular skill instead of overfitting ngx-vest-forms guidance.

## References

- [README](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/README.md)
- [docs/](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/docs)
- [`public-api.ts`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/packages/ngx-vest-forms/src/public-api.ts)

## Goal

Use this skill to quickly identify the correct ngx-vest-forms workflow, then route into the matching nested sub-skill instead of giving a generic library overview.
