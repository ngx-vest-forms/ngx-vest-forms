import { JsonPipe } from '@angular/common';
import { Component, computed, Signal, signal, viewChild } from '@angular/core';
import {
  FormDirective,
  getValueAtPath,
  ngxVestForms,
  setValueAtPath,
  VestSuite,
} from 'ngx-vest-forms';
import { enforce, only, staticSuite, test } from 'vest';

// --- Example Form Model ---
type Address = { street: string; city: string };
type ExampleFormModel = {
  generalInfo: { firstName: string; lastName: string };
  addresses: Address[];
};

// --- Vest Suite for the Example ---
const exampleSuite: VestSuite<ExampleFormModel> = staticSuite(
  (data = {}, field?: string) => {
    only(field);
    test('generalInfo.firstName', 'First name is required', () => {
      enforce(data.generalInfo?.firstName).isNotEmpty();
    });
    test('addresses[0].city', 'City is required for address 0', () => {
      enforce(data.addresses?.[0]?.city).isNotEmpty();
    });
  },
);

@Component({
  selector: 'ngx-field-path-form-example',
  standalone: true,
  imports: [ngxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="formValue"
      #vestForm="ngxVestForm"
    >
      <div ngModelGroup="generalInfo">
        <label>First Name: <input name="firstName" ngModel /></label>
        <label>Last Name: <input name="lastName" ngModel /></label>
      </div>
      <div ngModelGroup="addresses">
        @for (i of addressIndices(); track i) {
          <div [ngModelGroup]="i">
            <label>Street: <input name="street" ngModel /></label>
            <label>City: <input name="city" ngModel /></label>
          </div>
        }
      </div>
      <button type="button" (click)="setSecondStreet()">
        Set 2nd Street to 'Updated St'
      </button>
      <pre>Form Value: {{ vestForm.formState().value | json }}</pre>
      <pre>Errors: {{ vestForm.formState().errors | json }}</pre>
      <div>
        <strong>Second Street (signal):</strong> {{ secondStreetSignal() }}
      </div>
      <div>
        <strong>Address[0] City Errors (signal):</strong>
        @if (address0CityErrorsSignal()) {
          <span>
            @for (err of address0CityErrorsSignal(); track err) {
              <span>{{ err }}</span>
            }
          </span>
        }
      </div>
    </form>
  `,
})
export class FieldPathExampleComponent {
  protected readonly suite = exampleSuite;
  protected readonly formValue = signal<ExampleFormModel>({
    generalInfo: { firstName: 'Alice', lastName: 'Smith' },
    addresses: [
      { street: 'Main St', city: 'Springfield' },
      { street: 'Second St', city: 'Shelbyville' },
    ],
  });
  protected readonly vestForm = viewChild.required(
    FormDirective<ExampleFormModel>,
  );

  // Signal for the number of addresses (defensive for undefined)
  readonly addressIndices = computed(() => {
    // Defensive: ensure addresses is always an array
    const value = this.vestForm().formState().value as
      | ExampleFormModel
      | undefined;
    const addresses = value?.addresses ?? [];
    return addresses.map((_, index) => index.toString());
  });

  // Signal for the nested value
  readonly secondStreetSignal = computed(() => {
    const value = getValueAtPath(
      this.vestForm().formState().value ?? {},
      'addresses[1].street',
    );
    return typeof value === 'string' ? value : undefined;
  });

  // Signal for the nested errors
  readonly address0CityErrorsSignal: Signal<string[] | undefined> = computed(
    () => {
      // Defensive: ensure errors is an object
      const errors = this.vestForm().formState().errors ?? {};
      const result = getValueAtPath(errors, 'addresses[0].city');
      return Array.isArray(result) ? (result as string[]) : undefined;
    },
  );

  setSecondStreet(): void {
    // Deep copy to avoid mutating the signal value
    const value = structuredClone(this.formValue());
    setValueAtPath(value, 'addresses[1].street', 'Updated St');
    this.formValue.set(value);
  }

  resetForm(): void {
    // Reset to initial value
    this.formValue.set({
      generalInfo: { firstName: 'Alice', lastName: 'Smith' },
      addresses: [
        { street: 'Main St', city: 'Springfield' },
        { street: 'Second St', city: 'Shelbyville' },
      ],
    });
  }
}
