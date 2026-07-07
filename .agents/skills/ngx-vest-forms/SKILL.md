---
name: ngx-vest-forms
description: Routes general ngx-vest-forms requests to the right workflow. Use this whenever the user broadly asks about ngx-vest-forms, wants help with the library but the feature area is not obvious yet, asks for best practices, migration help, blur-driven draft auto-save, `fieldBlur`, swapping the equality function with `NGX_EQUALITY_FN`, or says things like "how should I build this with ngx-vest-forms?" even when they do not mention `validationConfig`, wrappers, child components, root-form validation, or field-level persistence explicitly.
---

# ngx-vest-forms router skill

Use this as the broad entry point for ngx-vest-forms questions. Track the current branch baseline: v3.x-era guidance on Angular 22+, RxJS ~7.8, and Vest 6.x.

## Start with the invariant layer

Assume the repo instruction file already enforces the baseline guardrails:

- use `[ngModel]`, not `[(ngModel)]`
- keep `name` aligned with the bound path
- use optional chaining for partial models
- handle field-focused validation at the call site via `suite.only(field).run(model)` when needed
- use `vestFormsViewProviders` in nested child form components
- use the form's `fieldBlur` output with `NgxFieldBlurEvent<T>` for blur-driven persistence, analytics, and field-level side effects
- do not gate draft auto-save on `event.pending`
- pair `validationConfig` with `[errorDisplayMode]="'on-blur'"` on dependent wrappers when a field becomes logically invalid as soon as its trigger changes but should stay visually quiet until its own blur — do **not** add `(blur)` handlers that call `triggerFormValidation()` to manufacture this timing

Do not repeat those basics unless they are directly relevant to the user's issue.

## Current branch deltas to keep in mind

Non-breaking but worth knowing when the user mentions related symptoms:

- **`(fieldBlur)` is the supported blur primitive.** Emits a freshly validated snapshot of the blurred control's value plus the full form value. Handles nested control paths, dynamic groups, radios, and repeated leaf names. Cancels in-flight emissions on form reset. Route to `field-blur-events`.
- **Pluggable equality** via the `NGX_EQUALITY_FN` injection token (`NgxEqualityFn = (a, b) => boolean`). Lets consumers swap the comparator used by `formValueChange` `distinctUntilChanged`, the form↔model two-way sync, and the `formState` signal's structural equality. Default is the library's `fastDeepEqual` with real cycle detection. Reach for it for bundle-size (e.g. `dequal/lite`), test instrumentation, or domain rules. See `docs/API-TOKENS.md`.
- **Reactive `[pendingDebounce]`** on `<ngx-form-group-wrapper>` — now a signal-accessor input, runtime changes propagate. New public type: `DebouncedPendingStateOptionsInput`. Route to `custom-wrapper-patterns` when the user is wiring async pending UI.
- **Lifecycle safety.** `form.directive` and `validate-root-form.directive` route async work through an internal `destroy-scheduler` tied to `DestroyRef`. No more `ViewDestroyedError` after destroy-mid-async-validation; async validators emit cleanly even when torn down. Symptom-only — no API change.
- **`setValueAtPath` array-safe.** `setValueAtPath(form, 'addresses[0].street', 'x')` no longer overwrites a populated array with `{}`. Bracket notation now chooses container shape from the segment (numeric → array, string → object). Relevant to `composite-adapter` fan-out.
- **`parseFieldPath` strict mode** logs a dev warning (`ngDevMode`-gated, tree-shakable) for malformed segments like `'a..b'`, `'.a'`, `'a.'`, instead of silently truncating. Production behavior is unchanged for previously valid paths.
- **`validateShape` removed in v3 (see `formContract`).** The legacy shape-validator is no longer exported. The `[formContract]` input on `FormDirective<T>` accepts any `StandardSchemaV1<T>` (Zod v4, Valibot, hand-rolled, etc.) and still accepts a legacy `NgxDeepRequired<T>` shape via the `toFormContract()` adapter for back-compat. Opaque values (`Date`, `Map`, `Set`, `RegExp`, `File`, `Blob`) short-circuit shape recursion as before.
- **Dependents revalidate silently.** When a trigger field changes, its `validationConfig`-tracked dependents are revalidated but touched state is deliberately NOT propagated to them — dependents show errors only after their own interaction (blur) or form submit.
- **`cloneDeep` was removed in v3.0.0.** Use `structuredClone` in new guidance.

## Stay on the public API surface

Unless the task is explicitly about maintaining the library internals, recommend imports from `'ngx-vest-forms'` and verify the symbol exists in `packages/ngx-vest-forms/src/public-api.ts`.

Do not send library consumers to `packages/ngx-vest-forms/src/lib/**` imports. That is an internal maintenance path, not consumer guidance.

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
- asking about `NgxDeepPartial`, form shapes, or signal-based form state
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
- If the issue is specifically about Vest semantics, also consult `vest.instructions.md` (and the sibling `vestjs` agent skill if installed — see `docs/VESTJS-SKILL.md`).
- If the issue is generic Angular rather than library-specific, prefer the Angular skill instead of overfitting ngx-vest-forms guidance.

## Core repo references

- `README.md`
- `.github/instructions/ngx-vest-forms.instructions.md`
- `.github/instructions/vest.instructions.md`
- `docs/`
- `packages/ngx-vest-forms/src/public-api.ts`

## Goal

Use this skill to quickly identify the correct ngx-vest-forms workflow, then route into the matching nested sub-skill instead of giving a generic library overview.
