import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, NgForm, ValidationErrors } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
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

  describe('with a stand-in host', () => {
    it('prefers submittedReactive over _submittedReactive', () => {
      const submittedReactive = signal(false);
      const _submittedReactive = signal(false);
      const host = { submittedReactive, _submittedReactive };

      setAngularFormSubmittedState(host as unknown as NgForm, true);

      expect(submittedReactive()).toBe(true);
      expect(_submittedReactive()).toBe(false);
    });

    it('uses _submittedReactive when submittedReactive is absent', () => {
      const _submittedReactive = signal(false);
      const setter = vi.fn();
      const proto = {};
      Object.defineProperty(proto, 'submitted', {
        get: () => false,
        set: setter,
      });
      const host = Object.create(proto);
      host._submittedReactive = _submittedReactive;

      setAngularFormSubmittedState(host as NgForm, true);

      expect(_submittedReactive()).toBe(true);
      expect(setter).not.toHaveBeenCalled();
    });

    it('falls back to a submitted setter further up the prototype chain', () => {
      const setter = vi.fn(function (this: unknown, value: boolean) {
        (this as { stored?: boolean }).stored = value;
      });
      const grandparent = {};
      Object.defineProperty(grandparent, 'submitted', {
        get: () => false,
        set: setter,
      });
      // The nearer prototype has a getter-only `submitted`; it must be skipped.
      const parent = Object.create(grandparent);
      Object.defineProperty(parent, 'submitted', { get: () => false });
      const host = Object.create(parent) as { stored?: boolean };

      setAngularFormSubmittedState(host as unknown as NgForm, true);

      expect(setter).toHaveBeenCalledTimes(1);
      expect(setter).toHaveBeenCalledWith(true);
      expect(setter.mock.contexts[0]).toBe(host);
      expect(host.stored).toBe(true);
    });

    it('uses the nearest setter when several prototypes define one', () => {
      const far = vi.fn();
      const near = vi.fn();
      const grandparent = {};
      Object.defineProperty(grandparent, 'submitted', {
        get: () => false,
        set: far,
      });
      const parent = Object.create(grandparent);
      Object.defineProperty(parent, 'submitted', {
        get: () => false,
        set: near,
      });

      setAngularFormSubmittedState(Object.create(parent) as NgForm, false);

      expect(near).toHaveBeenCalledWith(false);
      expect(far).not.toHaveBeenCalled();
    });

    it('is a no-op without a signal or a setter', () => {
      const host = Object.create({ submitted: false });

      expect(() => {
        setAngularFormSubmittedState(host as NgForm, true);
      }).not.toThrow();
      expect(host.submitted).toBe(false);
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
