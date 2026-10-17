/* eslint-disable @angular-eslint/component-selector */
import {
  ApplicationRef,
  Component,
  Directive,
  signal,
  type Type,
  viewChild,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NgxVestForms } from '../exports';
import { NGX_EQUALITY_FN } from '../tokens/equality.token';
import { fastDeepEqual } from '../utils/equality';
import { FormDirective } from './form.directive';

/**
 * PERF-01: the work one keystroke costs in a large form.
 *
 * Counts, for one value change in a form with 200 fields (10 groups of 20),
 * how many times the library copies the whole form value (each copy starts
 * with one `getRawValue()` on the root form) and how many times it calls the
 * equality function on two different references (a real deep comparison;
 * calls on the same reference return at the first `Object.is`).
 */

const GROUPS = 10;
const FIELDS_PER_GROUP = 20;

type Model = Record<string, Record<string, string>>;

const groupNames = Array.from({ length: GROUPS }, (_, g) => `group${g}`);
const fieldNames = Array.from(
  { length: FIELDS_PER_GROUP },
  (_, f) => `field${f}`
);

function initialModel(): Model {
  const model: Model = {};
  for (const group of groupNames) {
    model[group] = {};
    for (const field of fieldNames) {
      model[group][field] = 'value';
    }
  }
  return model;
}

const suite = create((model: Model) => {
  for (const group of groupNames) {
    for (const field of fieldNames) {
      vestTest(`${group}.${field}`, 'Required', () => {
        enforce(model[group]?.[field]).isNotBlank();
      });
    }
  }
});

const counters = { equal: 0, deepEqual: 0 };
function countingEqual(a: unknown, b: unknown): boolean {
  counters.equal++;
  if (!Object.is(a, b)) {
    counters.deepEqual++;
  }
  return fastDeepEqual(a, b);
}

const template = `
  <form
    ngxVestForm
    [suite]="suite"
    [formValue]="formValue()"
    (formValueChange)="onValueChange($event)"
    #vest="ngxVestForm"
  >
    @for (group of groupNames; track group) {
      <div [ngModelGroup]="group">
        @for (field of fieldNames; track field) {
          <input
            [name]="field"
            [attr.data-testid]="group + '.' + field"
            [ngModel]="formValue()[group]?.[field]"
          />
        }
      </div>
    }
  </form>
`;

@Directive()
abstract class LargeFormBase {
  abstract readonly suite: typeof suite | null;
  readonly groupNames = groupNames;
  readonly fieldNames = fieldNames;
  readonly formValue = signal<Model>(initialModel());
  readonly emissions: Model[] = [];
  readonly vestForm = viewChild.required<FormDirective<Model>>('vest');

  onValueChange(value: Model): void {
    this.emissions.push(value);
    this.formValue.set(value);
  }
}

@Component({
  selector: 'test-large-form',
  imports: [NgxVestForms],
  providers: [{ provide: NGX_EQUALITY_FN, useValue: countingEqual }],
  template,
})
class LargeFormComponent extends LargeFormBase {
  readonly suite = suite;
}

@Component({
  selector: 'test-large-form-no-suite',
  imports: [NgxVestForms],
  providers: [{ provide: NGX_EQUALITY_FN, useValue: countingEqual }],
  template,
})
class LargeFormNoSuiteComponent extends LargeFormBase {
  readonly suite = null;
}

const settle = async () => {
  await TestBed.inject(ApplicationRef).whenStable();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await TestBed.inject(ApplicationRef).whenStable();
};

async function measureKeystrokes(
  component: Type<LargeFormBase>,
  values: string[]
) {
  const { fixture } = await render(component);
  const host = fixture.componentInstance;
  await settle();

  // Every full copy of the form value starts with one `getRawValue()` on the
  // root form; Angular itself never calls it on the root.
  const rawValueSpy = vi.spyOn(host.vestForm().ngForm.form, 'getRawValue');
  host.emissions.length = 0;
  counters.equal = 0;
  counters.deepEqual = 0;
  // Read formState the way a template binding would.
  host.vestForm().formState();

  const input = fixture.nativeElement.querySelector(
    '[data-testid="group4.field7"]'
  ) as HTMLInputElement;
  for (const value of values) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await settle();
    host.vestForm().formState();
  }

  return {
    host,
    copies: rawValueSpy.mock.calls.length,
    equalCalls: counters.equal,
    deepEqualCalls: counters.deepEqual,
  };
}

describe('PERF-01: per-keystroke work in a 200-field form', () => {
  // The counts are upper bounds: fewer copies or comparisons pass.
  afterEach(() => {
    vi.restoreAllMocks();
    suite.reset();
  });

  it('copies the form value once per value event and compares each snapshot pair once', async () => {
    const result = await measureKeystrokes(LargeFormNoSuiteComponent, [
      'changed',
    ]);

    // Before PERF-01: 2 copies and 7 deep comparisons. Now the value event
    // takes the one snapshot `formValueChange`, `formState` and the sync
    // effect share.
    expect(result.copies).toBe(1);
    expect(result.deepEqualCalls).toBeLessThanOrEqual(2);
    expect(result.host.emissions).toHaveLength(1);
    expect(result.host.emissions[0]?.['group4']?.['field7']).toBe('changed');
    expect(result.host.vestForm().formState().value).toEqual(
      result.host.emissions[0]
    );
  });

  it(
    "adds only the async validators' own copies when a suite validates the field",
    { timeout: 30_000 },
    async () => {
      const result = await measureKeystrokes(LargeFormComponent, ['changed']);

      // Before PERF-01: 5 copies and 9 deep comparisons. The field and its
      // ngModelGroup each validate on a copy of their own (2); the value event
      // takes 1, and the status event of the async result 1 more.
      expect(result.copies).toBeLessThanOrEqual(4);
      expect(result.deepEqualCalls).toBeLessThanOrEqual(4);
      expect(result.host.emissions).toHaveLength(1);
      expect(result.host.emissions[0]?.['group4']?.['field7']).toBe('changed');
      expect(result.host.vestForm().formState().value).toEqual(
        result.host.emissions[0]
      );
    }
  );

  it(
    'emits once per keystroke with the value of that keystroke',
    { timeout: 30_000 },
    async () => {
      const result = await measureKeystrokes(LargeFormComponent, [
        'a',
        'ab',
        'abc',
      ]);

      // Before PERF-01: 15 copies and 27 deep comparisons.
      expect(result.copies).toBeLessThanOrEqual(12);
      expect(result.deepEqualCalls).toBeLessThanOrEqual(12);
      expect(
        result.host.emissions.map((value) => value['group4']?.['field7'])
      ).toEqual(['a', 'ab', 'abc']);
      expect(
        result.host.vestForm().formState().value?.['group4']?.['field7']
      ).toBe('abc');
      expect(result.host.vestForm().formState().valid).toBe(true);
    }
  );
});
