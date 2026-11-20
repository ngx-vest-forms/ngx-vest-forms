# ValidationConfig vs root-form validation

ngx-vest-forms provides three complementary mechanisms for cross-field and dynamic validation. They solve different problems and often work together:

| Mechanism | Purpose | Where errors appear | Triggered when |
| --- | --- | --- | --- |
| `[validationConfig]` | Revalidate dependent fields when a trigger field changes | On the dependent field (`errors['confirmPassword']`) | Automatically on trigger value change and before `(submitSettled)` |
| `ngxValidateRootForm` (`ROOT_FORM`) | Validate form-wide rules that belong to no single field | On the root form (`errors[ROOT_FORM]`) | On submit (`'submit'`, default) or on every change (`'live'`) |
| `triggerFormValidation(path?)` | Re-run validators for the whole form, one group subtree, or one field path after structure or focus changes without a value change | All fields and root form, or target subtree | Manually from component code |

## 1. `[validationConfig]` for dependent fields

`validationConfig` controls **when** field validations re-run. All validation rules still live in your Vest suite.

When field B's Vest test reads field A's value (or sits inside `omitWhen`/`skipWhen` based on field A), Angular does not know to re-run field B when field A changes. `validationConfig` bridges that gap.

```ts
import { createValidationConfig, type NgxDeepPartial, type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';

type SignupModel = NgxDeepPartial<{
  password: string;
  confirmPassword: string;
  age: number;
  emergencyContact: string;
}>;

export const signupSuite: NgxVestSuite<SignupModel> = create((model) => {
  test('password', 'Password is required', () => {
    enforce(model.password).isNotBlank();
  });

  omitWhen(!model.password, () => {
    test('confirmPassword', 'Passwords must match', () => {
      enforce(model.confirmPassword).equals(model.password);
    });
  });

  omitWhen((model.age ?? 0) >= 18, () => {
    test('emergencyContact', 'Required for minors', () => {
      enforce(model.emergencyContact).isNotBlank();
    });
  });
});

// In your component:
protected readonly validationConfig = createValidationConfig<SignupModel>()
  .bidirectional('password', 'confirmPassword')
  .whenChanged('age', 'emergencyContact')
  .build();
```

What happens when `password` changes:

1. `FormDirective` sees `password` in `validationConfig`.
2. After the configured debounce (`NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN`, default 100 ms), it calls `updateValueAndValidity()` on `confirmPassword`.
3. `confirmPassword`'s validator runs `suite.only('confirmPassword').run(model)`.
4. Its validity updates immediately, while its visual error display still respects the wrapper's `errorDisplayMode` (so an untouched dependent field stays quiet until blur or submit).

On submit, `FormDirective` revalidates `validationConfig` dependents before emitting `(submitSettled)` (and its corresponding post-submit `(errorsChange)` update; during ordinary edits, `(errorsChange)` still emits on every non-`PENDING` status change), so submitting immediately after editing a trigger field never passes on a stale result.

Use `whenChanged` for one-way dependencies (such as `age` to `emergencyContact`) and `bidirectional` only when both fields read each other. For the full builder API, see [ValidationConfig builder](./VALIDATION-CONFIG-BUILDER.md).

## 2. `ngxValidateRootForm` for form-level rules

Use `ngxValidateRootForm` and `ROOT_FORM` when a rule spans multiple fields and belongs to the whole form rather than any one input (for example, "provide at least one contact method" or "billing and shipping addresses must differ").

```ts
import { ROOT_FORM, type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

export const contactSuite: NgxVestSuite<ContactModel> = create((model) => {
  test(ROOT_FORM, 'At least one contact method is required', () => {
    enforce(model.email || model.phone).isTruthy();
  });
});
```

Expose `ROOT_FORM` on the component class so the template can read `errors()[ROOT_FORM]`:

```ts
protected readonly ROOT_FORM = ROOT_FORM;
protected readonly errors = signal<Record<string, string[]>>({});
```

```html
<form
  ngxVestForm
  ngxValidateRootForm
  [ngxValidateRootFormMode]="'submit'"
  [suite]="suite"
  [formValue]="formValue()"
  (formValueChange)="formValue.set($event)"
  (errorsChange)="errors.set($event)"
  (submitSettled)="onSubmit($event)"
>
  <!-- controls -->

  @if (errors()[ROOT_FORM]) {
    <div role="alert">{{ errors()[ROOT_FORM][0] }}</div>
  }

  <button type="submit">Submit</button>
</form>
```

### Root validation modes

- `'submit'` (default): runs `suite.only(ROOT_FORM).run(model)` only after the form is submitted.
- `'live'`: runs on every form value change.

### Checking validity on submit (sync and async)

With `ngxVestForm`, listen to `(submitSettled)` to decide whether to submit:

```ts
protected onSubmit(event: NgxSubmitSettledEvent<ContactModel>): void {
  if (!event.valid) {
    return;
  }

  this.save(event.value);
}
```

`(submitSettled)` waits for dependent `validationConfig` revalidation, submit-mode `ROOT_FORM` checks, and any async Vest tests to finish, then emits `{ valid, value, errors }` once per submit. If a newer submit occurs while an earlier submit is still waiting on async validation, the newer submit replaces the earlier one so only the latest emits. Do not check `form.valid` inside `(ngSubmit)` when your suite has async tests.

## 3. `triggerFormValidation(path?)` for structure changes

When a template switches between form controls and static content (such as replacing an `<input>` with a `<p>`), no control emits a value change, so root form validity can remain stale.

- `triggerFormValidation()` (no argument) re-runs validators on every control in the form deepest-first, then updates the root form. All field validators (including async tests) and root-level validators re-run, and fields are **not** marked as touched.
- `triggerFormValidation('address')` or `triggerFormValidation('address.street')` re-runs validators on every descendant under that path (deepest first), then updates the target control and its ancestors up to the root. Pass a group or field path when only one section needs revalidation (for example after changing `[validationFocus]`). An unknown path logs `[NGX-003]` in dev mode.

Always clear hidden values inside `(formValueChange)`, not in a separate `(ngModelChange)` handler alongside `(formValueChange)` (which causes `NGX-100` same-tick sync conflicts):

```ts
import { viewChild } from '@angular/core';
import { clearFieldsWhen, FormDirective } from 'ngx-vest-forms';

private readonly vestForm = viewChild(FormDirective<DynamicFormModel>);

protected handleFormChange(value: DynamicFormModel): void {
  const next = clearFieldsWhen(value, {
    fieldA: value.type !== 'typeA',
  });
  if (value.type !== 'typeA') {
    this.vestForm()?.removeField('fieldA');
  }
  this.formValue.set(next);
  this.vestForm()?.triggerFormValidation();
}
```

### `triggerFormValidation()` vs `markAllAsTouched()`

| Method | Updates validity | Shows errors | Typical use |
| --- | --- | --- | --- |
| `triggerFormValidation(path?)` | Yes (whole form, group subtree, or target field) | No | Template structure or `validationFocus` changes without value changes |
| `markAllAsTouched()` | No | Yes | Submitting multiple forms from one external button |

With the default `'on-blur-or-submit'` error display mode, standard `(ngSubmit)` / `(submitSettled)` submissions call `markAllAsTouched()` automatically.

## Decision guide

- **Error belongs to a specific field whose rule reads another field** (password confirmation, conditional `omitWhen`, end date after start date): use `[validationConfig]`.
- **Error belongs to the whole form** (at least one contact method, mutually exclusive sections, cross-section business rules): use `ngxValidateRootForm` with `ROOT_FORM`.
- **Controls unmount and turn into static text without another input changing**: clear hidden values in `(formValueChange)`, call `removeField()` for removed fields, and call `triggerFormValidation()`.

## Common mistakes

- **Using `omitWhen` without `[validationConfig]`:** The dependent control never revalidates when the controlling field changes.
- **Putting field-specific errors on `ROOT_FORM`:** Errors like "Passwords must match" belong on `confirmPassword` (with `validationConfig`) so the error attaches to the right input via `aria-describedby`.
- **Calling `triggerFormValidation()` from blur handlers to show dependent errors:** `validationConfig` already handles revalidation, and each wrapper's `errorDisplayMode` controls visibility. For blur-driven side effects such as draft auto-save, listen to `(fieldBlur)` instead.

## Related guides

- [ValidationConfig builder](./VALIDATION-CONFIG-BUILDER.md)
- [Structure change detection](./STRUCTURE_CHANGE_DETECTION.md)
- [Field clearing utilities](./FIELD-CLEARING-UTILITIES.md)
- [Auto-save on blur](./AUTO-SAVE-ON-BLUR.md)
