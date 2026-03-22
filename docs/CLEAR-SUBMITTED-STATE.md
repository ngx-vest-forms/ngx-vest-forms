# Clear Submitted State

Use `clearSubmittedState()` when you want to end the current **submit cycle** without resetting form values or Angular control metadata.

## The Problem

In `'on-submit'` error display mode, errors stay visible after the first submit because the form remains in a submitted state until `resetForm()` is called.

That is often too heavy-handed:

- `resetForm()` clears `touched`
- `resetForm()` clears `dirty` / `pristine` state
- `resetForm()` can hide errors that should still remain visible in mixed display-mode scenarios

This matters when the user has already submitted once, fixed the current errors, and then continues editing untouched parts of a long or multi-form workflow.

## When to Use `clearSubmittedState()`

Use it when all of the following are true:

1. You are using submit-gated error visibility such as `'on-submit'`
2. A submit attempt has already happened
3. You want to return to a pre-submit UX state
4. You want to preserve form values and control metadata

Typical examples:

- A review page with multiple child forms and one external submit button
- A long form where users fix submit-time errors section by section
- A custom submit flow that calls `ngForm.onSubmit(...)` programmatically

## When NOT to Use It

Do **not** use `clearSubmittedState()` as a general-purpose reset API.

Use `resetForm()` instead when you intentionally want to:

- clear values
- mark controls pristine
- mark controls untouched
- fully reset the Angular form state

Use `markAllAsTouched()` instead when you want to show errors immediately.

Use `triggerFormValidation()` instead when form structure changed and you only need validation to re-run.

## What It Does

`clearSubmittedState()` only ends the current submit cycle.

It does **not**:

- change field values
- clear warnings
- mark controls pristine
- mark controls untouched
- re-run validation by itself

That makes it the lightweight counterpart to `resetForm()` for submit-only UX flows.

## Basic Usage

```typescript
import { Component, signal, viewChild } from '@angular/core';
import { FormDirective } from 'ngx-vest-forms';

@Component({
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      #vestForm="ngxVestForm"
    >
      <!-- fields -->
    </form>
  `,
})
export class CheckoutComponent {
  protected readonly formValue = signal({});
  protected readonly vestForm =
    viewChild.required<FormDirective<Record<string, unknown>>>('vestForm');

  protected finishSubmitCycle(): void {
    this.vestForm().clearSubmittedState();
  }
}
```

## Recommended Flow

```typescript
submit(): void {
  const form = this.vestForm();

  form.ngForm.onSubmit(new Event('submit'));

  if (!form.formState().valid) {
    return;
  }

  // Submit succeeded or the previously submitted issues were resolved
  // and the UI should return to a pre-submit state.
  form.clearSubmittedState();
}
```

## Multi-Form Example

```typescript
submitAll(): void {
  const forms = this.submitForms();

  for (const form of forms) {
    form.ngForm.onSubmit(new Event('submit'));
  }

  const allValid = forms.every((form) => form.formState().valid);
  if (!allValid) {
    return;
  }

  for (const form of forms) {
    form.clearSubmittedState();
  }
}
```

## Why Not Just Call `resetForm(form.ngForm.value)`?

That workaround preserves values, but it still resets Angular control metadata across the whole form tree.

```typescript
// Works, but resets touched/dirty/pristine metadata.
form.resetForm(form.ngForm.value);
```

`clearSubmittedState()` exists for the narrower case where you only want to close the submit gate and leave the rest of the form state alone.
