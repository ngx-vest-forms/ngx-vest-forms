---
name: root-form-validation
description: Form-level rules in ngx-vest-forms with `ROOT_FORM`, `ngxValidateRootForm` and `ngxValidateRootFormMode`. Read it for errors no single field owns ("at least one contact method", form summaries) or when unsure whether a cross-field rule is field-level or form-level.
---

# ngx-vest-forms root-form validation

The invariants live in the router, [`../SKILL.md`](../SKILL.md).

## Decide ownership

Use `ROOT_FORM` only when no single field should show the error.

| Form-owned → `ROOT_FORM`                    | Field-owned → field test plus `validationConfig`       |
| ------------------------------------------- | ------------------------------------------------------ |
| at least one contact method is required     | confirm password mismatch (owned by `confirmPassword`) |
| billing and shipping addresses must differ  | end date before start date (owned by `endDate`)        |
| a business rule summarised above the submit | a field required because another field has a value     |

Say explicitly when the user's rule is field-owned and route it to [`../validation-config-builder/SKILL.md`](../validation-config-builder/SKILL.md). A `ROOT_FORM` used for hard-to-place field errors hides an ownership problem.

## Wire it

1. In the suite: `test(ROOT_FORM, 'message', () => { ... })`, with `ROOT_FORM` imported from `'ngx-vest-forms'`.
2. On the form: `ngxValidateRootForm`, and choose `[ngxValidateRootFormMode]` deliberately: `'submit'` (the default choice for blocking summaries) or `'live'` (continuous feedback, only where it will not be noisy).
3. Render the message in one stable summary region. Blocking summaries use `role="alert"` (assertive); inline field errors stay polite.
4. Submit handling: submit-mode root validation has already run when `(ngSubmit)` fires, so a synchronous `ROOT_FORM` failure already makes the form `INVALID` there. With async `ROOT_FORM` tests decide in `(submitSettled)`, whose `errors` include `ROOT_FORM`. `clearSubmittedState()` clears submit-mode `ROOT_FORM` errors.

```ts
import { ROOT_FORM, type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, test } from 'vest';

export const contactSuite: NgxVestSuite<Contact> = create((model) => {
  test(ROOT_FORM, 'Give an email address or a phone number', () => {
    enforce(!!model.email || !!model.phone).isTruthy();
  });
});
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
  (submitSettled)="save($event)"
>
  @if (errors()[ROOT_FORM]; as rootErrors) {
  <div role="alert" aria-atomic="true">{{ rootErrors[0] }}</div>
  }
  <!-- controls -->
</form>
```

Expose `ROOT_FORM` to the template as a component field (`protected readonly ROOT_FORM = ROOT_FORM;`).

`ROOT_FORM` tests share the suite's state with field tests, so test files reset shared suites the same way ([`../core/references/testing-vest-6.md`](../core/references/testing-vest-6.md)).

## References

- [`VALIDATION-CONFIG-VS-ROOT-FORM.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/VALIDATION-CONFIG-VS-ROOT-FORM.md)
- [`ACCESSIBILITY.md`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/ACCESSIBILITY.md)
