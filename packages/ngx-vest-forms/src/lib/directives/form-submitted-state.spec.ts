import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  getFormSubmittedSignal,
  setAngularFormSubmittedState,
} from './form-submitted-state';

@Component({
  imports: [FormsModule],
  template: `
    <form #form="ngForm" (ngSubmit)="submitted.set(true)">
      <input name="email" ngModel />
      <button type="submit">Submit</button>
    </form>
  `,
})
class HostComponent {
  readonly form = viewChild.required<NgForm>('form');
  readonly submitted = signal(false);
}

describe('form-submitted-state', () => {
  describe('getFormSubmittedSignal', () => {
    it('returns the current submitted state on first access', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const ngForm = fixture.componentInstance.form();

      const submittedSignal = getFormSubmittedSignal(ngForm);

      expect(submittedSignal()).toBe(false);
    });

    it('returns the same signal instance across repeated calls (per-NgForm cache)', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const ngForm = fixture.componentInstance.form();

      const a = getFormSubmittedSignal(ngForm);
      const b = getFormSubmittedSignal(ngForm);

      expect(a).toBe(b);
    });

    it('keeps separate signals for separate NgForm instances', () => {
      const fixtureA = TestBed.createComponent(HostComponent);
      const fixtureB = TestBed.createComponent(HostComponent);
      fixtureA.detectChanges();
      fixtureB.detectChanges();

      const signalA = getFormSubmittedSignal(fixtureA.componentInstance.form());
      const signalB = getFormSubmittedSignal(fixtureB.componentInstance.form());

      expect(signalA).not.toBe(signalB);
    });
  });

  describe('setAngularFormSubmittedState', () => {
    it('updates Angular 21.x NgForm submitted state on a real NgForm', () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const ngForm = fixture.componentInstance.form();

      expect(ngForm.submitted).toBe(false);

      setAngularFormSubmittedState(ngForm, true);
      expect(ngForm.submitted).toBe(true);

      setAngularFormSubmittedState(ngForm, false);
      expect(ngForm.submitted).toBe(false);
    });

    it('prefers submittedReactive when present (public Angular signal)', () => {
      let written: boolean | null = null;
      const fakeForm = {
        submittedReactive: {
          set(value: boolean): void {
            written = value;
          },
        },
        _submittedReactive: {
          set(): void {
            throw new Error('should not use the internal fallback');
          },
        },
      } as unknown as NgForm;

      setAngularFormSubmittedState(fakeForm, true);

      expect(written).toBe(true);
    });

    it('falls back to _submittedReactive when submittedReactive is missing', () => {
      let written: boolean | null = null;
      const fakeForm = {
        _submittedReactive: {
          set(value: boolean): void {
            written = value;
          },
        },
      } as unknown as NgForm;

      setAngularFormSubmittedState(fakeForm, true);

      expect(written).toBe(true);
    });

    it('falls back to a prototype-chain submitted setter when no signal exists', () => {
      let written: boolean | null = null;
      class PrototypeForm {}
      Object.defineProperty(PrototypeForm.prototype, 'submitted', {
        set(value: boolean) {
          written = value;
        },
        configurable: true,
      });
      const fakeForm = new PrototypeForm() as unknown as NgForm;

      setAngularFormSubmittedState(fakeForm, true);

      expect(written).toBe(true);
    });

    it('walks ancestor prototypes to find a writable submitted setter', () => {
      let written: boolean | null = null;
      class GrandparentForm {}
      Object.defineProperty(GrandparentForm.prototype, 'submitted', {
        set(value: boolean) {
          written = value;
        },
        configurable: true,
      });
      class ParentForm extends GrandparentForm {}
      class ChildForm extends ParentForm {}
      const fakeForm = new ChildForm() as unknown as NgForm;

      setAngularFormSubmittedState(fakeForm, true);

      expect(written).toBe(true);
    });

    it('does not throw when no signal and no submitted setter exist', () => {
      const fakeForm = Object.create(null) as NgForm;

      expect(() => setAngularFormSubmittedState(fakeForm, true)).not.toThrow();
    });
  });
});
