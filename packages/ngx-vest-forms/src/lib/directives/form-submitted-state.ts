import { Signal, signal, WritableSignal } from '@angular/core';
import { FormResetEvent, FormSubmittedEvent, NgForm } from '@angular/forms';

const formSubmittedSignals = new WeakMap<NgForm, WritableSignal<boolean>>();
const formsInSubmitValidation = new WeakSet<NgForm>();

/**
 * The form's submitted state as a signal, shared by every directive on the
 * form. Created on first use together with one subscription to the form's
 * submit/reset events (not one per field).
 *
 * `NgForm.submitted` itself can't be tracked: its getter reads Angular's
 * internal signal with `untracked()`. Mapping the events keeps programmatic
 * `NgForm.onSubmit()` reactive in zoneless apps. The subscription lives as
 * long as the form's `FormGroup`, the same as the signal.
 */
export function getFormSubmittedSignal(
  ngForm: NgForm
): WritableSignal<boolean> {
  let submitted = formSubmittedSignals.get(ngForm);
  if (!submitted) {
    const state = signal(ngForm.submitted);
    const form = ngForm.form;
    form.events.subscribe((event) => {
      if (event.source !== form) return;
      if (event instanceof FormSubmittedEvent) {
        state.set(true);
      } else if (event instanceof FormResetEvent) {
        state.set(false);
      }
    });
    formSubmittedSignals.set(ngForm, state);
    submitted = state;
  }
  return submitted;
}

const formResetCounts = new WeakMap<NgForm, Signal<number>>();

/**
 * A counter that goes up each time the root form emits a `FormResetEvent`
 * (`NgForm.resetForm()`, `form.reset()`), shared by every directive on the
 * form. Error display reads it to drop the messages it holds while a field
 * re-validates, so a reset clears them at once instead of when the post-reset
 * validation settles.
 */
export function getFormResetCount(ngForm: NgForm): Signal<number> {
  let count = formResetCounts.get(ngForm);
  if (!count) {
    const state = signal(0);
    const form = ngForm.form;
    form.events.subscribe((event) => {
      if (event.source === form && event instanceof FormResetEvent) {
        state.update((value) => value + 1);
      }
    });
    count = state.asReadonly();
    formResetCounts.set(ngForm, count);
  }
  return count;
}

export function setAngularFormSubmittedState(
  ngForm: NgForm,
  submitted: boolean
): void {
  // NgForm's `submitted` getter is read-only; its state lives in the private
  // `submittedReactive` signal. If a later Angular renames it, skip the
  // write instead of throwing: callers also update the shared signal, so
  // error display stays reactive. The contract spec flags the rename on
  // upgrade.
  (
    ngForm as unknown as { submittedReactive?: WritableSignal<boolean> }
  ).submittedReactive?.set(submitted);
}

/**
 * Re-runs the form's root-level validators as part of a submit. While this
 * runs, {@link isSubmitValidationPass} returns true for the form, so a
 * root-form validator can skip its usual one-task deferral and give the
 * `(ngSubmit)` handler a settled status for synchronous suites.
 */
export function runSubmitValidation(ngForm: NgForm): void {
  formsInSubmitValidation.add(ngForm);
  try {
    ngForm.form.updateValueAndValidity();
  } finally {
    formsInSubmitValidation.delete(ngForm);
  }
}

export function isSubmitValidationPass(ngForm: NgForm | null): boolean {
  return ngForm !== null && formsInSubmitValidation.has(ngForm);
}
