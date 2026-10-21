/* eslint-disable @angular-eslint/component-selector */
// The failure message passed as expect()'s second argument is the point of
// these tests, so allow it in this file.
/* eslint vitest/valid-expect: ["error", { "maxArgs": 2 }] */
/**
 * Contract tests for the private Angular APIs ngx-vest-forms probes.
 *
 * The library reads or writes a few Angular internals that are not part of
 * Angular's public API. If an Angular upgrade removes or renames one, the
 * library skips that read or write instead of throwing: a missing
 * `submittedReactive` leaves `NgForm.submitted` unset, while the library's
 * own submitted signal still updates. These
 * tests exercise the REAL Angular objects and fail loudly, naming the library
 * function that depends on the field, so the upgrade PR has to deal with it.
 *
 * Probed internals (keep in sync with the library code):
 * - `NgForm.submittedReactive`
 *   → `setAngularFormSubmittedState` (form-submitted-state.ts)
 *
 * Retired: `NgForm._directives` and `ControlValueAccessor._elementRef` were
 * replaced by the field element registry (field-element-registry.ts).
 * `OutputEmitterRef.listeners` is gone too: `fieldBlur` no longer checks for
 * subscribers before building its payload.
 */
import {
  ApplicationRef,
  Component,
  isSignal,
  isWritableSignal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormDirective, NgxFieldBlurEvent } from './form.directive';

const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

const UPGRADE_BROKE_IT =
  'An Angular upgrade removed or reshaped this private API.';

@Component({
  selector: 'test-private-api-ng-form-host',
  template: `
    <form #ngForm="ngForm">
      <input aria-label="Text" name="text" [ngModel]="text" />
      <input
        aria-label="Checkbox"
        type="checkbox"
        name="checkbox"
        [ngModel]="checkbox"
      />
      <select aria-label="Select" name="select" [ngModel]="select">
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
    </form>
  `,
  imports: [FormsModule],
})
class NgFormHost {
  readonly text = '';
  readonly checkbox = false;
  readonly select = 'a';
  readonly ngForm = viewChild.required<NgForm>('ngForm');
}

async function renderNgForm(): Promise<NgForm> {
  const { fixture } = await render(NgFormHost);
  await whenStable();
  return fixture.componentInstance.ngForm();
}

describe('private Angular API contract: NgForm submitted signal', () => {
  // The field setAngularFormSubmittedState writes.
  const candidates = ['submittedReactive'] as const;

  it('exposes submittedReactive as a writable signal', async () => {
    const ngForm = await renderNgForm();
    const host = ngForm as unknown as Record<string, unknown>;

    const found = candidates.find((key) => host[key] !== undefined);
    expect(
      found,
      `setAngularFormSubmittedState (form-submitted-state.ts) writes ` +
        `NgForm.${candidates[0]}, but a real NgForm does not have it. ` +
        `${UPGRADE_BROKE_IT} clearSubmittedState() can no longer ` +
        `reset Angular's native submitted flag.`
    ).toBeDefined();

    const submittedSignal = host[found as string];
    expect(
      isSignal(submittedSignal) && isWritableSignal(submittedSignal),
      `setAngularFormSubmittedState calls NgForm.${found}.set(), but ` +
        `NgForm.${found} is no longer a WritableSignal. ${UPGRADE_BROKE_IT}`
    ).toBe(true);

    const writable = submittedSignal as WritableSignal<boolean>;
    writable.set(true);
    expect(
      ngForm.submitted,
      `Setting NgForm.${found} to true no longer flips NgForm.submitted, ` +
        `so setAngularFormSubmittedState no longer drives it. ` +
        UPGRADE_BROKE_IT
    ).toBe(true);

    writable.set(false);
    expect(
      ngForm.submitted,
      `Setting NgForm.${found} to false no longer clears NgForm.submitted, ` +
        `so setAngularFormSubmittedState no longer drives it. ` +
        UPGRADE_BROKE_IT
    ).toBe(false);
  });
});

describe('private Angular API behaviour through the public surface', () => {
  @Component({
    selector: 'test-private-api-vest-form-host',
    template: `
      <form
        ngxVestForm
        #vest="ngxVestForm"
        [formValue]="model()"
        (formValueChange)="model.set($event)"
        (ngSubmit)="noop()"
      >
        <input aria-label="Name" name="name" [ngModel]="model().name" />
        <button type="submit">Submit</button>
      </form>
    `,
    imports: [NgxVestForms],
  })
  class VestFormHost {
    readonly model = signal<{ name?: string }>({ name: '' });
    readonly vestForm =
      viewChild.required<FormDirective<{ name?: string }>>('vest');
    noop(): void {
      // Binding (ngSubmit) keeps the native submit from navigating.
    }
  }

  it('clearSubmittedState() resets Angular NgForm.submitted after a submit', async () => {
    const { fixture } = await render(VestFormHost);
    await whenStable();
    const vestForm = fixture.componentInstance.vestForm();

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await whenStable();
    expect(vestForm.ngForm.submitted).toBe(true);

    vestForm.clearSubmittedState();
    await whenStable();

    expect(
      vestForm.ngForm.submitted,
      `clearSubmittedState() relies on setAngularFormSubmittedState writing ` +
        `NgForm.submittedReactive. Angular's native ` +
        `submitted flag stayed true. ${UPGRADE_BROKE_IT}`
    ).toBe(false);
  });

  it('emits fieldBlur to a programmatic outputToObservable subscriber', async () => {
    const { fixture } = await render(VestFormHost);
    await whenStable();

    const events: Array<NgxFieldBlurEvent<{ name?: string }>> = [];
    const subscription = outputToObservable(
      fixture.componentInstance.vestForm().fieldBlur
    ).subscribe((event) => events.push(event));

    await userEvent.type(screen.getByLabelText('Name'), 'Ada');
    await userEvent.tab();
    await whenStable();

    await expect
      .poll(() => events.length, {
        message: 'fieldBlur did not reach an outputToObservable subscriber.',
      })
      .toBe(1);
    expect(events[0]?.field).toBe('name');
    expect(events[0]?.value).toBe('Ada');

    subscription.unsubscribe();
  });
});
