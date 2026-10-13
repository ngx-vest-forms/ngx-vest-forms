/* eslint-disable @angular-eslint/component-selector */
// The failure message passed as expect()'s second argument is the point of
// these tests, so allow it in this file.
/* eslint vitest/valid-expect: ["error", { "maxArgs": 2 }] */
/**
 * Contract tests for the private Angular APIs ngx-vest-forms probes.
 *
 * The library reads or writes a few Angular internals that are not part of
 * Angular's public API. Each one has a fallback, so an Angular upgrade that
 * removes or renames one of them degrades silently instead of throwing. These
 * tests exercise the REAL Angular objects and fail loudly, naming the library
 * function that depends on the field, so the upgrade PR has to deal with it.
 *
 * Probed internals (keep in sync with the library code):
 * - `NgForm.submittedReactive` / `NgForm._submittedReactive`
 *   → `setAngularFormSubmittedState` (form-submitted-state.ts)
 * - `NgForm._directives` and `ControlValueAccessor._elementRef`
 *   → `readNgFormDirectives` / `readValueAccessorElement`
 *     (field-path-resolver.ts)
 * - `OutputEmitterRef.listeners`
 *   → `FormDirective.#hasFieldBlurSubscriber` (form.directive.ts)
 */
import {
  ApplicationRef,
  Component,
  isSignal,
  isWritableSignal,
  output,
  OutputEmitterRef,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
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
  // Same lookup order as setAngularFormSubmittedState.
  const candidates = ['submittedReactive', '_submittedReactive'] as const;

  it('exposes submittedReactive or _submittedReactive as a writable signal', async () => {
    const ngForm = await renderNgForm();
    const host = ngForm as unknown as Record<string, unknown>;

    const found = candidates.find((key) => host[key] !== undefined);
    expect(
      found,
      `setAngularFormSubmittedState (form-submitted-state.ts) writes ` +
        `NgForm.${candidates.join(' ?? NgForm.')}, but a real NgForm has ` +
        `neither. ${UPGRADE_BROKE_IT} clearSubmittedState() can no longer ` +
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

describe('private Angular API contract: NgForm._directives and CVA _elementRef', () => {
  it('exposes _directives as an iterable of the registered NgModel directives', async () => {
    const ngForm = await renderNgForm();
    const directives = (ngForm as unknown as { _directives?: unknown })
      ._directives;

    expect(
      directives,
      `readNgFormDirectives (field-path-resolver.ts) reads ` +
        `NgForm._directives, but a real NgForm no longer has it. ` +
        `${UPGRADE_BROKE_IT} fieldBlur falls back to name/DOM heuristics ` +
        `and cannot disambiguate dynamic [ngModelGroup] paths.`
    ).toBeDefined();
    expect(
      typeof (directives as { [Symbol.iterator]?: unknown })?.[Symbol.iterator],
      `readNgFormDirectives iterates NgForm._directives, but it is no ` +
        `longer iterable. ${UPGRADE_BROKE_IT}`
    ).toBe('function');

    const entries = [...(directives as Iterable<unknown>)];
    expect(
      entries.length > 0 && entries.every((d) => d instanceof NgModel),
      `readNgFormDirectives expects NgForm._directives to hold the form's ` +
        `NgModel directives. ${UPGRADE_BROKE_IT}`
    ).toBe(true);
    expect(
      (entries as NgModel[]).map((d) => d.path.join('.')).sort(),
      `resolveControlPathByNgModelDirective reads NgModel.path from each ` +
        `NgForm._directives entry. ${UPGRADE_BROKE_IT}`
    ).toEqual(['checkbox', 'select', 'text']);
  });

  it('exposes _elementRef.nativeElement on the built-in value accessors', async () => {
    const ngForm = await renderNgForm();
    const directives = [
      ...((ngForm as unknown as { _directives?: Iterable<NgModel> })
        ._directives ?? []),
    ];
    const byName = new Map(directives.map((d) => [d.name, d]));

    const expected: Array<[string, HTMLElement]> = [
      ['text', screen.getByLabelText('Text')],
      ['checkbox', screen.getByLabelText('Checkbox')],
      ['select', screen.getByLabelText('Select')],
    ];

    for (const [name, element] of expected) {
      const accessor = byName.get(name)?.valueAccessor;
      const accessorName = accessor?.constructor.name ?? 'unknown accessor';
      const elementRef = (
        accessor as { _elementRef?: { nativeElement?: unknown } } | null
      )?._elementRef;

      expect(
        elementRef?.nativeElement,
        `readValueAccessorElement (field-path-resolver.ts) reads ` +
          `${accessorName}._elementRef.nativeElement for the "${name}" ` +
          `control, but it no longer points at the host element. ` +
          `${UPGRADE_BROKE_IT}`
      ).toBe(element);
    }
  });
});

describe('private Angular API contract: OutputEmitterRef.listeners', () => {
  // output() may only initialise a property of a @Component or @Directive.
  @Component({ selector: 'test-private-api-output-host', template: '' })
  class OutputHost {
    readonly changed = output<string>();
  }

  function createOutput(): OutputEmitterRef<string> {
    return TestBed.createComponent(OutputHost).componentInstance.changed;
  }

  const listenersOf = (ref: OutputEmitterRef<string>): unknown =>
    (ref as unknown as { listeners?: unknown }).listeners;

  it('keeps listeners null until the first subscribe, then an array of subscribers', () => {
    const ref = createOutput();

    expect(
      listenersOf(ref),
      `FormDirective.#hasFieldBlurSubscriber (form.directive.ts) reads ` +
        `OutputEmitterRef.listeners and expects null before any subscribe. ` +
        `undefined means the field is gone: ${UPGRADE_BROKE_IT} ` +
        `fieldBlur now resolves fields and structuredClones the form on ` +
        `every blur even with no subscriber.`
    ).toBeNull();

    const subscription = ref.subscribe(() => undefined);
    const afterSubscribe = listenersOf(ref);
    expect(
      Array.isArray(afterSubscribe) &&
        (afterSubscribe as unknown[]).length === 1,
      `FormDirective.#hasFieldBlurSubscriber expects ` +
        `OutputEmitterRef.listeners to be an array holding one entry per ` +
        `subscriber. ${UPGRADE_BROKE_IT}`
    ).toBe(true);

    subscription.unsubscribe();
    const afterUnsubscribe = listenersOf(ref);
    expect(
      afterUnsubscribe === null ||
        (Array.isArray(afterUnsubscribe) && afterUnsubscribe.length === 0),
      `FormDirective.#hasFieldBlurSubscriber treats null or an empty ` +
        `OutputEmitterRef.listeners as "no subscriber". After unsubscribe ` +
        `it is neither. ${UPGRADE_BROKE_IT}`
    ).toBe(true);
  });
});

describe('private Angular API behaviour through the public surface', () => {
  // Behaviour already covered elsewhere (not duplicated here):
  // - NgForm._directives + _elementRef: form.directive.spec.ts
  //   "should resolve paths through dynamic [ngModelGroup] with numeric keys"
  //   resolves `slots.1.to`, which only the _directives strategy can do.
  // - OutputEmitterRef.listeners with a template `(fieldBlur)=` binding:
  //   form.directive.spec.ts "should emit field blur metadata for named controls".

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
        `NgForm.submittedReactive / _submittedReactive. Angular's native ` +
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
        message:
          `FormDirective.#hasFieldBlurSubscriber did not see the ` +
          `outputToObservable subscriber through ` +
          `OutputEmitterRef.listeners, so fieldBlur was skipped. ` +
          UPGRADE_BROKE_IT,
      })
      .toBe(1);
    expect(events[0]?.field).toBe('name');
    expect(events[0]?.value).toBe('Ada');

    subscription.unsubscribe();
  });
});
