import { signal, WritableSignal } from '@angular/core';
import { NgForm } from '@angular/forms';

const formSubmittedSignals = new WeakMap<NgForm, WritableSignal<boolean>>();

type AngularSubmittedSignalHost = {
  submittedReactive?: WritableSignal<boolean>;
  _submittedReactive?: WritableSignal<boolean>;
};

export function getFormSubmittedSignal(
  ngForm: NgForm
): WritableSignal<boolean> {
  let submitted = formSubmittedSignals.get(ngForm);
  if (!submitted) {
    submitted = signal(ngForm.submitted);
    formSubmittedSignals.set(ngForm, submitted);
  }
  return submitted;
}

export function setAngularFormSubmittedState(
  ngForm: NgForm,
  submitted: boolean
): void {
  // Angular 21.x's concrete NgForm stores submitted state on
  // `submittedReactive`, while AbstractFormDirective-backed implementations
  // expose `_submittedReactive` and may also provide a public setter on
  // `submitted`. This helper is verified against Angular 21.x in this
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
