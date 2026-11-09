import { TestBed } from '@angular/core/testing';
import { FormControl, NgForm, ValidationErrors } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  getFormSubmittedSignal,
  isSubmitValidationPass,
  runSubmitValidation,
  setAngularFormSubmittedState,
} from './form-submitted-state';

function createNgForm(): NgForm {
  return TestBed.runInInjectionContext(() => new NgForm([], []));
}

describe('getFormSubmittedSignal', () => {
  it('starts from the form submitted state', () => {
    const ngForm = createNgForm();
    expect(getFormSubmittedSignal(ngForm)()).toBe(false);

    const submittedForm = createNgForm();
    setAngularFormSubmittedState(submittedForm, true);
    expect(getFormSubmittedSignal(submittedForm)()).toBe(true);
  });

  it('returns the same signal for the same form and a different one per form', () => {
    const a = createNgForm();
    const b = createNgForm();

    expect(getFormSubmittedSignal(a)).toBe(getFormSubmittedSignal(a));
    expect(getFormSubmittedSignal(a)).not.toBe(getFormSubmittedSignal(b));
  });

  it('becomes true on submit and false on reset', () => {
    const ngForm = createNgForm();
    const submitted = getFormSubmittedSignal(ngForm);

    ngForm.onSubmit(new Event('submit'));
    expect(submitted()).toBe(true);

    ngForm.resetForm();
    expect(submitted()).toBe(false);
  });

  it('only reacts to the form it was created for', () => {
    const a = createNgForm();
    const b = createNgForm();
    const submittedA = getFormSubmittedSignal(a);

    b.onSubmit(new Event('submit'));

    expect(submittedA()).toBe(false);
  });

  it('ignores submit/reset events whose source is a child control', () => {
    const ngForm = createNgForm();
    const child = new FormControl('');
    ngForm.form.addControl('child', child);
    const submitted = getFormSubmittedSignal(ngForm);

    ngForm.onSubmit(new Event('submit'));
    // A child reset bubbles a FormResetEvent with the child as source.
    child.reset();

    expect(submitted()).toBe(true);
  });
});

describe('setAngularFormSubmittedState', () => {
  describe('with a real NgForm (internal signal path)', () => {
    it('updates NgForm.submitted both ways', () => {
      const ngForm = createNgForm();

      setAngularFormSubmittedState(ngForm, true);
      expect(ngForm.submitted).toBe(true);

      setAngularFormSubmittedState(ngForm, false);
      expect(ngForm.submitted).toBe(false);
    });

    it('does not emit form events (the shared signal is not touched)', () => {
      const ngForm = createNgForm();
      const submitted = getFormSubmittedSignal(ngForm);

      setAngularFormSubmittedState(ngForm, true);

      expect(ngForm.submitted).toBe(true);
      expect(submitted()).toBe(false);
    });
  });
});

describe('runSubmitValidation / isSubmitValidationPass', () => {
  it('returns false for null and for a form outside a submit pass', () => {
    expect(isSubmitValidationPass(null)).toBe(false);
    expect(isSubmitValidationPass(createNgForm())).toBe(false);
  });

  it('re-runs root validators and flags only that form during the pass', () => {
    const ngForm = createNgForm();
    const other = createNgForm();
    const seen: Array<[boolean, boolean]> = [];
    ngForm.form.addValidators((): ValidationErrors | null => {
      seen.push([
        isSubmitValidationPass(ngForm),
        isSubmitValidationPass(other),
      ]);
      return null;
    });

    runSubmitValidation(ngForm);

    expect(seen).toEqual([[true, false]]);
    expect(isSubmitValidationPass(ngForm)).toBe(false);
  });

  it('clears the flag when a validator throws', () => {
    const ngForm = createNgForm();
    ngForm.form.addValidators(() => {
      throw new Error('validator failed');
    });

    expect(() => {
      runSubmitValidation(ngForm);
    }).toThrow('validator failed');
    expect(isSubmitValidationPass(ngForm)).toBe(false);
  });
});
