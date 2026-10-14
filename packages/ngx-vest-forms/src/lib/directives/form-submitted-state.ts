import { signal, WritableSignal } from '@angular/core';
import { FormResetEvent, FormSubmittedEvent, NgForm } from '@angular/forms';

const formSubmittedSignals = new WeakMap<NgForm, WritableSignal<boolean>>();
const formsInSubmitValidation = new WeakSet<NgForm>();

type AngularSubmittedSignalHost = {
  submittedReactive?: WritableSignal<boolean>;
  _submittedReactive?: WritableSignal<boolean>;
};

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

export function setAngularFormSubmittedState(
  ngForm: NgForm,
  submitted: boolean
): void {
  // Angular 22.1's concrete NgForm stores submitted state on
  // `submittedReactive`, while AbstractFormDirective-backed implementations
  // expose `_submittedReactive` and may also provide a public setter on
  // `submitted`. This helper is verified against Angular 22.1 in this
  // repository and falls back to the first writable `submitted` setter it can
  // find if a future Angular version changes the concrete field names.
  //
  // We try the concrete/internal signal first because NgForm overrides the
  // getter-only `submitted` property at runtime in this workspace. If neither
  // signal exists, fall back to the first writable `submitted` setter we can
  // find on the prototype chain. If no setter exists either, callers should
  // still update ngx-vest-forms' shared signal so error display state remains
  // reactive even though Angular's native submitted flag cannot be changed.
  const signalHost = ngForm as unknown as AngularSubmittedSignalHost;
  const angularSignal =
    signalHost.submittedReactive ?? signalHost._submittedReactive;

  if (angularSignal) {
    angularSignal.set(submitted);
    return;
  }

  let prototype: object | null = Object.getPrototypeOf(ngForm);
  while (prototype) {
    const submittedDescriptor = Object.getOwnPropertyDescriptor(
      prototype,
      'submitted'
    );
    if (submittedDescriptor?.set) {
      submittedDescriptor.set.call(ngForm, submitted);
      return;
    }
    prototype = Object.getPrototypeOf(prototype);
  }
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
