---
name: ngx-vest-forms
description: Builds, reviews, debugs and migrates Angular template-driven forms that use ngx-vest-forms and Vest. Use whenever code imports from 'ngx-vest-forms' or uses `ngxVestForm`, `<ngx-control-wrapper>` or `vestFormsViewProviders`; for dependent-field revalidation, `ROOT_FORM`, blur auto-save, custom error wrappers, child form sections, form arrays, dynamic fields, form tests, or upgrading from v2.
license: MIT
metadata:
  author: ngx-vest-forms
---

# ngx-vest-forms

ngx-vest-forms v3 binds Angular template-driven forms to a Vest 6 suite. It targets Angular 22, RxJS 7.8+ and Vest 6.3+.

## 1. Pin the installed version

The guidance in this skill is for v3. Before writing code, read the `version` field of `node_modules/ngx-vest-forms/package.json` (the nearest `node_modules` in a monorepo; fall back to the dependency range in the project's `package.json`). The step is done when you know which branch applies. Inside the ngx-vest-forms repository itself the library is the workspace source, always the current v3; follow its `AGENTS.md`.

| Installed            | Branch                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3.x` (incl. betas)  | Continue with this skill.                                                                                                                                                                                                                                                                                                                                                         |
| `2.x`                | Answer from the v2 docs: the installed `node_modules/ngx-vest-forms/README.md` and [`release/v2.x/docs`](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/release/v2.x/docs). v2 suites are Vest 5 `staticSuite((model, field) => { only(field); ... })` and v2 still has `[formShape]`. Say that the code targets v2, and offer [`migration/SKILL.md`](migration/SKILL.md). |
| not installed        | v3 needs Angular 22. Until 3.0.0 is stable it ships on the npm `beta` tag: `npm install ngx-vest-forms@beta vest@^6.3.4`. A plain `npm install ngx-vest-forms` installs v2.                                                                                                                                                                                                       |
| user asks to upgrade | [`migration/SKILL.md`](migration/SKILL.md).                                                                                                                                                                                                                                                                                                                                       |

## 2. Use the installed public API

Import only from `'ngx-vest-forms'`. The authority for which symbols and inputs exist is the installed package's type declarations: the `.d.ts` file named by the `types` (or `typings`) field of `node_modules/ngx-vest-forms/package.json`. It matches the user's version, works offline, and carries the JSDoc. When the package is not installed, use [`public-api.ts` on `master`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/packages/ngx-vest-forms/src/public-api.ts).

A symbol missing from those declarations is a library gap: say so and suggest an issue on [ngx-vest-forms/ngx-vest-forms](https://github.com/ngx-vest-forms/ngx-vest-forms/issues). `ngx-vest-forms/internal` exists for edge cases and carries no semver guarantees; reach for it only when the user accepts that.

## 3. Hold the invariants

Every answer and code sample follows these. When the user's code breaks one, correct it before anything else.

| Rule                 | Write                                                                                                                                                       | Instead of                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Binding              | `[ngModel]="formValue().email"` on the control, `[formValue]="formValue()"` plus `(formValueChange)="formValue.set($event)"` on the form                    | `[(ngModel)]`                                   |
| Field Path           | `name` joined with the enclosing `ngModelGroup` names equals the Field Path: `ngModelGroup="address"` + `name="street"` binds `formValue().address?.street` | a `name` that drifts from the bound path        |
| Optional chaining    | `formValue().address?.street`, because the Form Model is `NgxDeepPartial<T>`                                                                                | `formValue().address.street`                    |
| Suite                | Vest 6 `create((model) => { ... })` with a model-only callback, typed as `NgxVestSuite<T>`                                                                  | `(model, field)` callbacks, `staticSuite`       |
| Focused Run          | `suite.only(field).run(model)` at the call site; the form directive already does this per field                                                             | `only(field)` inside the suite callback         |
| Child Form Component | `viewProviders: [vestFormsViewProviders]`                                                                                                                   | no `viewProviders`                              |
| Wrapper              | `<ngx-control-wrapper>` around one control; `<ngx-form-group-wrapper ngModelGroup="...">` around a group                                                    | a control wrapper around a whole `ngModelGroup` |
| Async submit         | decide the submit in `(submitSettled)`, which emits `{ valid, value, errors }` after async tests finish                                                     | reading `valid` inside `(ngSubmit)`             |

## 4. Route to the workflow

Read the sub-skill whose triggers match; combine several when the question spans them.

| Sub-skill                                                         | Triggers                                                                                                                                                               |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`core`](core/SKILL.md)                                           | first form, component structure, `NgxDeepPartial`, form contracts and schemas, typed suites, form state, submit, reset, global tokens, testing forms and suites        |
| [`validation-config-builder`](validation-config-builder/SKILL.md) | one field does not revalidate when another changes, confirm password, date ranges, `omitWhen`/`skipWhen` across fields, `validationConfig`, `createValidationConfig()` |
| [`field-blur-events`](field-blur-events/SKILL.md)                 | draft auto-save, save on blur, analytics or side effects on blur, `fieldBlur`, `NgxFieldBlurEvent`                                                                     |
| [`root-form-validation`](root-form-validation/SKILL.md)           | an error owned by the whole form, "at least one of", form summaries, `ROOT_FORM`, `ngxValidateRootForm`                                                                |
| [`built-in-wrappers`](built-in-wrappers/SKILL.md)                 | which wrapper to use, inline errors and warnings, `errorDisplayMode`, `warningDisplayMode`, `ariaAssociationMode`, wrapper styling                                     |
| [`custom-wrapper-patterns`](custom-wrapper-patterns/SKILL.md)     | design-system or Material/PrimeNG field shells, `ngxErrorControl`, `ngxErrorDisplay`, custom ARIA or pending UI                                                        |
| [`child-components`](child-components/SKILL.md)                   | splitting a form into sections, nested `ngModelGroup`, a child's controls missing from `formValue`                                                                     |
| [`form-arrays`](form-arrays/SKILL.md)                             | lists of phone numbers, addresses or line items, add/remove rows, `arrayToObject`, `objectToArray`, Vest `each()`                                                      |
| [`composite-adapter`](composite-adapter/SKILL.md)                 | one widget writing several fields: date range pickers, name splitters, hidden proxy fields                                                                             |
| [`dynamic-form-behavior`](dynamic-form-behavior/SKILL.md)         | showing and hiding fields, stale values or errors after the layout changes, `clearFieldsWhen`, `triggerFormValidation()`                                               |
| [`migration`](migration/SKILL.md)                                 | upgrading from v2, Vest 5 to 6, `sc-` selectors, `[formShape]`, removed exports, compile errors after the upgrade                                                      |

Draft auto-save with quiet dependent errors combines `field-blur-events`, `validation-config-builder` and `built-in-wrappers`.

Questions about Vest itself (enforce rules, `group`, `warn`, async test design, server-side runs) belong to the `vestjs` skill; when it is not installed, suggest `npx skills add ngx-vest-forms/ngx-vest-forms --skill vestjs`. Generic Angular questions belong to the Angular skill.

## Docs

The installed `node_modules/ngx-vest-forms/README.md` is the offline overview for the user's version. The guides live in [`docs/`](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/docs) and the runnable examples in [`apps/examples`](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/apps/examples) on GitHub; each sub-skill names the guide it relies on. Dev-mode warnings tagged `NGX-xxx` are explained in [`TROUBLESHOOTING.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/TROUBLESHOOTING.md).
