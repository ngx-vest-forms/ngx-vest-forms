# Clear submitted state

Use `clearSubmittedState()` to end the current submit cycle without resetting form values, `touched`, `dirty`, or `pristine` metadata.

## Why it exists

In `'on-submit'` error display mode, errors remain visible after the first submit because `ngForm.submitted` stays `true` until `resetForm()` is called. Calling `resetForm()` (even `resetForm(form.ngForm.value)`) resets `touched`, `dirty`, and `pristine` across the whole form tree, which is often too disruptive for multi-form or section-by-section review flows.

`clearSubmittedState()` only resets the submitted gate back to `false` (and clears submit-mode `ROOT_FORM` errors). It does **not** change values, clear warnings, reset `touched`/`dirty`/`pristine`, or re-run field validation.

## When to use something else

- **Reset values and control metadata:** call `resetForm()`.
- **Show all errors immediately without submitting:** call `markAllAsTouched()`.
- **Recalculate validity after a structure change:** call `triggerFormValidation()`.

## Usage

```ts
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  FormDirective,
  NgxVestForms,
  type NgxDeepPartial,
  type NgxSubmitSettledEvent,
  type NgxVestSuite,
} from 'ngx-vest-forms';

type CheckoutFormModel = NgxDeepPartial<{ email: string }>;

@Component({
  selector: 'app-checkout',
  imports: [NgxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (submitSettled)="onSubmitSettled($event)"
      #vestForm="ngxVestForm"
    >
      <!-- controls -->
      <button type="submit">Submit</button>
    </form>
  `,
})
export class CheckoutComponent {
  protected readonly formValue = signal<CheckoutFormModel>({});
  protected readonly suite: NgxVestSuite<CheckoutFormModel> = checkoutSuite;
  protected readonly vestForm =
    viewChild.required<FormDirective<CheckoutFormModel>>('vestForm');

  protected onSubmitSettled(event: NgxSubmitSettledEvent<CheckoutFormModel>): void {
    if (!event.valid) {
      return;
    }

    // End the submit cycle while keeping current values and touched/dirty state.
    this.vestForm().clearSubmittedState();
  }
}
```

### Programmatic multi-form submit

When one external button submits several synchronous child forms:

```ts
submitAll(): void {
  const forms = this.submitForms();

  for (const form of forms) {
    form.ngForm.onSubmit(new Event('submit'));
  }

  if (!forms.every((form) => form.formState().valid)) {
    return;
  }

  for (const form of forms) {
    form.clearSubmittedState();
  }
}
```

If any of those forms runs async Vest validators, `formState().valid` is `false` while the form is `PENDING`. In that case, wait for each form's `(submitSettled)` event before checking validity and calling `clearSubmittedState()`.
