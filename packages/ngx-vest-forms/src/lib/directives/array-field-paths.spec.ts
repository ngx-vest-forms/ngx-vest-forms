/**
 * Runtime check of the field-path form that `FieldPath<T>` emits for arrays.
 *
 * Template-driven forms model an array as nested `ngModelGroup`s keyed by
 * index, so the control of `addresses[0].street` lives at the indexed path
 * `addresses.0.street`. A flattened path without the index never resolves to
 * a control, which is why `FieldPath<T>` only emits the indexed form.
 */
import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { create, enforce, test } from 'vest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import type { NgxDeepPartial } from '../utils/deep-partial';
import { FormDirective, type NgxValidationConfig } from './form.directive';

type Model = NgxDeepPartial<{
  name: string;
  addresses: Array<{ street: string }>;
}>;

const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

function createHost(validationConfig: NgxValidationConfig<Model>) {
  let nameRuns = 0;

  @Component({
    template: `
      <form
        ngxVestForm
        [formValue]="formValue()"
        [suite]="suite"
        [validationConfig]="config"
        (formValueChange)="formValue.set($event)"
      >
        <input name="name" [ngModel]="formValue().name" />
        <div ngModelGroup="addresses">
          <div ngModelGroup="0">
            <input name="street" [ngModel]="street" />
          </div>
        </div>
      </form>
    `,
    imports: [NgxVestForms],
  })
  class HostComponent {
    readonly form = viewChild.required(FormDirective);
    readonly formValue = signal<Model>({
      name: '',
      addresses: [{ street: '' }],
    });
    readonly config = validationConfig;
    readonly street = '';
    readonly suite = create((model: Model) => {
      test('name', 'Name is required', () => {
        nameRuns++;
        enforce(model.name).isNotBlank();
      });
    });
  }

  return { HostComponent, nameRuns: () => nameRuns };
}

async function setup(config: NgxValidationConfig<Model>) {
  const { HostComponent, nameRuns } = createHost(config);
  const fixture = TestBed.configureTestingModule({
    imports: [HostComponent],
  }).createComponent(HostComponent);
  fixture.detectChanges();
  await whenStable();
  return { fixture, nameRuns };
}

async function typeStreet(
  fixture: { nativeElement: HTMLElement },
  value: string
) {
  const street = fixture.nativeElement.querySelector<HTMLInputElement>(
    'input[name="street"]'
  );
  if (!street) throw new Error('street input not rendered');
  street.value = value;
  street.dispatchEvent(new Event('input'));
  await whenStable();
  // Let the validationConfig pipeline's debounce and cooldown settle.
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 700);
  });
  await whenStable();
}

/** How often `name` validates after a street edit under `config`. */
async function nameRunsAfterStreetEdit(config: NgxValidationConfig<Model>) {
  const { fixture, nameRuns } = await setup(config);
  const before = nameRuns();
  await typeStreet(fixture, 'Main St');
  TestBed.resetTestingModule();
  return nameRuns() - before;
}

describe('array field paths at runtime', () => {
  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => TestBed.resetTestingModule());

  it('registers array element controls under the indexed path only', async () => {
    const { fixture } = await setup(null);
    const form = fixture.componentInstance.form().ngForm.form;

    expect(form.get('addresses.0.street')).not.toBeNull();
    expect(form.get('addresses.street')).toBeNull();
  });

  it('revalidates dependents of an indexed trigger path, never of a flattened one', async () => {
    // Without a config, `name` still validates once per edit (form-level
    // value change); a working trigger adds a run on top of that.
    const baseline = await nameRunsAfterStreetEdit(null);
    const indexed = await nameRunsAfterStreetEdit({
      'addresses.0.street': ['name'],
    });
    // The flattened form is not a FieldPath any more; the cast stands for a
    // config that bypasses the type, to pin down the runtime behaviour.
    const flattened = await nameRunsAfterStreetEdit({
      'addresses.street': ['name'],
    } as unknown as NgxValidationConfig<Model>);

    expect(indexed).toBeGreaterThan(baseline);
    expect(flattened).toBe(baseline);
  });
});
