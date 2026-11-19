# Troubleshooting diagnostics

ngx-vest-forms logs development-mode diagnostics via `console.warn`. They are silent in production builds (`isDevMode() === false`). When a test intentionally exercises a warning path, spy on `console.warn` and assert the diagnostic code to keep test output clean.

## Code index

| Code | Summary |
| --- | --- |
| [`NGX-001`](#ngx-001--ngx-002--ngx-004-form-contract-diagnostics) | Extra property in form value not present in form contract |
| [`NGX-002`](#ngx-001--ngx-002--ngx-004-form-contract-diagnostics) | Value type mismatch against form contract |
| [`NGX-003`](#ngx-003-control-not-found-in-triggerformvalidation) | Control path passed to `triggerFormValidation(path)` was not found |
| [`NGX-004`](#ngx-001--ngx-002--ngx-004-form-contract-diagnostics) | Standard Schema issue reported by form contract |
| [`NGX-100`](#ngx-100-divergent-same-tick-formmodel-writes) | Divergent same-tick form/model write dropped (form wins) |
| [`NGX-101`](#ngx-101-ngform-not-found-on-ngxvalidaterootform) | `ngxValidateRootForm` used without an `NgForm` |
| [`NGX-102`](#ngx-102-root-form-validation-error) | Unhandled error thrown during root-form validation |
| [`NGX-103`](#ngx-103-no-ngxvestform-context) | `ngModel` or `ngModelGroup` validated outside `<form ngxVestForm>` |
| [`NGX-104`](#ngx-104-unresolved-control-path-in-async-validator-bridge) | Async validator could not resolve the control's path in the form tree |
| [`NGX-105`](#ngx-105-errordisplaymodeon-blur-with-updateon-submit) | `errorDisplayMode="on-blur"` combined with `updateOn: 'submit'` |
| [`NGX-106`](#ngx-106--ngx-107-validationconfig-timeout-warnings) | `validationConfig` timed out waiting for `PENDING` to settle |
| [`NGX-107`](#ngx-106--ngx-107-validationconfig-timeout-warnings) | `validationConfig` timed out waiting for dependent controls |
| [`NGX-108`](#ngx-108-signal-forms-control-not-registered-in-time) | Signal Forms custom control not registered in its form in time |

---

## `NGX-001` / `NGX-002` / `NGX-004`: form contract diagnostics

**Meaning:** Development-only structural contract checks found an extra property (`NGX-001`), a type mismatch (`NGX-002`), or a Standard Schema issue (`NGX-004`). These warnings never affect runtime form validity.

**Notes:**

- Runs only when `isDevMode()` is `true`.
- Consumes only synchronous Standard Schema results; async schemas are skipped by this pass.
- Unknown-key detection depends on the strictness of your Standard Schema (legacy `NgxDeepRequired<T>` contracts always warn on extra keys).

**Fix:** Align control `name` / `ngModelGroup` paths with your schema or `NgxDeepRequired<T>` contract, and keep runtime business rules in your Vest suite.

## `NGX-003`: control not found in `triggerFormValidation`

**Meaning:** `vestForm().triggerFormValidation(path)` was called with a `path` that `ngForm.form.get(path)` could not find.

**Fix:** Check the dotted path spelling (including enclosing `ngModelGroup` names) and verify the control is mounted in the DOM when `triggerFormValidation(path)` runs.

## `NGX-100`: divergent same-tick form/model writes

**Meaning:** `ngxVestForm` saw the Angular form value and the bound `[formValue]` signal change to different values in the same synchronization turn. The form value wins for that turn and internal baselines advance so subsequent single-sided updates sync normally.

**Common causes:**

- Mutating the `[formValue]` signal from a native `(change)` / `(input)` or `(ngModelChange)` handler on a control that is already part of `<form ngxVestForm>`.
- Updating `[formValue]` without binding `(formValueChange)`.
- Reading `[formValue]` from one signal while writing `(formValueChange)` to a different signal.

**Not a conflict:** updating the model inside `(formValueChange)` (such as clearing hidden fields or filling derived values). Let `(formValueChange)` be your single write path:

```ts
protected handleFormChange(value: ProfileFormModel): void {
  this.formValue.set(
    clearFieldsWhen(value, {
      businessOnlyField: value.mode !== 'business',
    })
  );
}
```

## `NGX-101`: `NgForm` not found on `ngxValidateRootForm`

**Meaning:** `ValidateRootFormDirective` could not resolve a host `NgForm`.

**Fix:** Place `ngxValidateRootForm` on a `<form ngxVestForm>` element and ensure `NgxVestForms` (or `FormsModule`) is imported in the component.

## `NGX-102`: root-form validation error

**Meaning:** The Vest suite threw an unhandled error while running `ROOT_FORM` validation. The directive forwards the error to Angular's `ErrorHandler` and fails open so the form does not lock up.

**Fix:** Guard nullable nested accesses in your `ROOT_FORM` tests with optional chaining (`model.address?.street`) and handle rejected promises inside async tests.

## `NGX-103`: no `ngxVestForm` context

**Meaning:** `FormModelDirective` (`[ngModel]`) or `FormModelGroupDirective` (`[ngModelGroup]`) ran without an ancestor `<form ngxVestForm>`. Validation is skipped fail-open.

**Common causes:**

- Importing the full `NgxVestForms` array into a component that renders a plain Angular `<form>` without `ngxVestForm`.
- Wrapping a plain Angular `ngModelGroup` with `<ngx-form-group-wrapper>` while `NgxVestForms` is imported.

**Fix:** Either add `ngxVestForm`, `[suite]`, and `[formValue]` to the parent `<form>`, or import only `FormsModule` and the specific wrapper component (`ControlWrapperComponent` / `FormGroupWrapperComponent`) when using a plain Angular form.

## `NGX-104`: unresolved control path in async validator bridge

**Meaning:** The async validator bridge could not resolve a control's dotted path inside `ngForm.control`.

**Fix:** Ensure every control has a non-empty `name` attribute, every group has a non-empty `ngModelGroup`, and child components provide `viewProviders: [vestFormsViewProviders]`.

## `NGX-105`: `errorDisplayMode="on-blur"` with `updateOn: 'submit'`

**Meaning:** The wrapper is configured to show errors on blur, while Angular delays model updates until submit. Users will not see blur-time errors.

**Fix:** Align display timing with `updateOn`: use `[errorDisplayMode]="'on-submit'"` when `[ngModelOptions]="{ updateOn: 'submit' }"`, or remove `updateOn: 'submit'` for blur feedback.

## `NGX-106` / `NGX-107`: `validationConfig` timeout warnings

**Meaning:** The `validationConfig` pipeline hit its safety timeout waiting for either the form to leave `PENDING` (`NGX-106`) or dependent controls to mount after a dynamic change (`NGX-107`, listing missing paths), and continued so validation would not stall.

**Fix:** Ensure async validators resolve or honor `AbortSignal`, verify dependent paths in `validationConfig` match mounted control paths, and clear hidden sections with `clearFieldsWhen()` + `removeField()` + `omitWhen()`.

## `NGX-108`: Signal Forms control not registered in time

**Meaning:** An `[ngModel]` on a Signal Forms custom control (`FormValueControl` / `FormCheckboxControl`) did not become reachable in its form in time, so ngx-vest-forms could not attach its validators. Vest will not validate that field.

**Fix:** Give the control a stable, non-empty `name` inside the form and avoid tearing down or renaming it mid-registration. Standalone controls (`[ngModelOptions]="{ standalone: true }"`) do not trigger this warning. See [Custom control wrappers](./CUSTOM-CONTROL-WRAPPERS.md#signal-forms-controls-inside-a-wrapper).

## Duplicate `ValidationConfigBuilder` warnings

**Meaning:** The same trigger-to-dependent pair was added twice to `createValidationConfig()`. The builder deduplicates automatically and warns in dev mode.

**Fix:** Remove duplicate calls, or combine reusable fragments with `.merge(...)`.

## Testing expected warnings

Spy on `console.warn` and assert the code so intentional warning tests stay quiet:

```ts
const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// Exercise the warning path

expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[NGX-100]'));
warnSpy.mockRestore();
```
