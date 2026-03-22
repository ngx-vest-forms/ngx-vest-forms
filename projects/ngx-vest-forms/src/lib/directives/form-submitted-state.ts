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
  const signalHost = ngForm as unknown as AngularSubmittedSignalHost;
  const angularSignal =
    signalHost.submittedReactive ?? signalHost._submittedReactive;

  angularSignal?.set(submitted);
}
