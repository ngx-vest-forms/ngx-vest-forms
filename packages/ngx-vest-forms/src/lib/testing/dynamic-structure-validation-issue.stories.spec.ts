import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, omitWhen, test } from 'vest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { NgxDeepPartial, NgxDeepRequired } from '../../public-api';
import { FormDirective } from '../directives/form.directive';
import { NgxVestForms } from '../exports';
import { clearFieldsWhen } from '../utils/field-clearing';

type DynamicFormModel = NgxDeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA?: string;
  fieldB?: string;
}>;

const formShape: NgxDeepRequired<DynamicFormModel> = {
  procedureType: 'typeA',
  fieldA: '',
  fieldB: '',
};

const dynamicFormValidationSuite = create((model: DynamicFormModel) => {
  test('procedureType', 'Procedure type is required', () => {
    enforce(model.procedureType).isNotBlank();
  });

  omitWhen(model.procedureType !== 'typeA', () => {
    test('fieldA', 'Field A is required for Type A procedure', () => {
      enforce(model.fieldA).isNotBlank();
    });
  });

  omitWhen(model.procedureType !== 'typeB', () => {
    test('fieldB', 'Field B is required for Type B procedure', () => {
      enforce(model.fieldB).isNotBlank();
    });
  });
});

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms, JsonPipe],
  template: `
    <form
      #vestForm="ngxVestForm"
      class="max-w-lg p-4"
      ngxVestForm
      [formValue]="formValue()"
      [formContract]="shape"
      [suite]="suite"
      (formValueChange)="handleFormChange($event)"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
    >
      <fieldset class="space-y-4">
        <legend class="mb-4 text-lg font-semibold">
          Dynamic Form Structure Test - Angular 20 Best Practices
        </legend>

        <div
          ngx-control-wrapper
          data-testid="ngx-control-wrapper__procedure-type"
        >
          <label class="block">
            <span class="mb-2 block text-sm font-medium">Procedure Type</span>
            <select
              name="procedureType"
              [ngModel]="formValue().procedureType"
              data-testid="select__procedure-type"
              class="w-full rounded border border-gray-300 p-2"
            >
              <option value="">Select a procedure type...</option>
              <option value="typeA">Type A (requires input field A)</option>
              <option value="typeB">Type B (requires input field B)</option>
              <option value="typeC">Type C (informational only)</option>
            </select>
          </label>
        </div>

        @if (formValue().procedureType === 'typeA') {
          <div
            ngx-control-wrapper
            data-testid="ngx-control-wrapper__field-a"
            class="rounded bg-blue-50 p-3"
          >
            <label class="block">
              <span class="mb-2 block text-sm font-medium"
                >Field A (Required)</span
              >
              <input
                name="fieldA"
                [ngModel]="formValue().fieldA"
                data-testid="input__field-a"
                placeholder="Enter Field A value"
                class="w-full rounded border border-gray-300 p-2"
              />
            </label>
            <p class="mt-1 text-sm text-blue-600">
              This field is required for Type A procedures.
            </p>
          </div>
        }

        @if (formValue().procedureType === 'typeB') {
          <div
            ngx-control-wrapper
            data-testid="ngx-control-wrapper__field-b"
            class="rounded bg-green-50 p-3"
          >
            <label class="block">
              <span class="mb-2 block text-sm font-medium"
                >Field B (Required)</span
              >
              <input
                name="fieldB"
                [ngModel]="formValue().fieldB"
                data-testid="input__field-b"
                placeholder="Enter Field B value"
                class="w-full rounded border border-gray-300 p-2"
              />
            </label>
            <p class="mt-1 text-sm text-green-600">
              This field is required for Type B procedures.
            </p>
          </div>
        }

        @if (formValue().procedureType === 'typeC') {
          <div
            data-testid="info__type-c"
            class="rounded border-l-4 border-yellow-400 bg-yellow-50 p-4"
          >
            <h3 class="text-lg font-medium text-yellow-800">
              Type C Procedure Information
            </h3>
            <p class="mt-2 text-yellow-700">
              This procedure type does not require any additional input fields.
              The system will automatically configure the necessary parameters
              based on your selection.
            </p>
            <ul class="mt-2 list-inside list-disc space-y-1 text-yellow-700">
              <li>Automatic parameter configuration</li>
              <li>No additional user input required</li>
              <li>Processing will begin immediately upon form submission</li>
            </ul>
          </div>
        }

        <button
          type="submit"
          data-testid="btn__submit"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          [disabled]="!formValid()"
        >
          {{ formValid() ? 'Submit Form' : 'Please complete required fields' }}
        </button>

        <details class="mt-6 rounded bg-gray-100 p-4">
          <summary class="cursor-pointer font-medium">
            Debug Information (Angular 20 Pattern with Signals)
          </summary>
          <div class="mt-3 space-y-2 font-mono text-sm">
            <div data-testid="debug__form-valid" class="flex justify-between">
              <span>Form Valid:</span>
              <span
                class="font-bold"
                [style.color]="formValid() ? 'green' : 'red'"
              >
                {{ formValid() }}
              </span>
            </div>
            <div data-testid="debug__has-errors" class="flex justify-between">
              <span>Has Errors:</span>
              <span
                class="font-bold"
                [style.color]="hasErrors() ? 'red' : 'green'"
              >
                {{ hasErrors() }}
              </span>
            </div>
            <div data-testid="debug__form-value" class="border-t pt-2">
              <span class="mb-1 block">Form Value:</span>
              <pre class="overflow-auto rounded bg-white p-2 text-xs">{{
                formValue() | json
              }}</pre>
            </div>
            <div data-testid="debug__errors" class="border-t pt-2">
              <span class="mb-1 block">Errors:</span>
              <pre class="overflow-auto rounded bg-white p-2 text-xs">{{
                errors() | json
              }}</pre>
            </div>
          </div>
        </details>
      </fieldset>
    </form>
  `,
})
export class DynamicStructureComponent {
  protected readonly vestFormRef =
    viewChild.required<FormDirective<DynamicFormModel>>('vestForm');
  protected readonly formValue = signal<DynamicFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly shape = formShape;
  protected readonly suite = dynamicFormValidationSuite;
  protected readonly hasErrors = computed(() => {
    return Object.keys(this.errors()).length > 0;
  });

  protected handleFormChange(value: DynamicFormModel | null): void {
    const nextValue = value ?? {};
    const previousProcedureType = this.formValue().procedureType;

    // First accept ngxVestForm's emitted snapshot unchanged. Transforming it
    // synchronously would create two divergent same-tick writers for the form
    // model and trigger the NGX-100 conflict diagnostic.
    this.formValue.set(nextValue);

    if (previousProcedureType === nextValue.procedureType) {
      return;
    }

    setTimeout(() => {
      const current = this.formValue();
      const normalized = clearFieldsWhen(current, {
        fieldA: current.procedureType !== 'typeA',
        fieldB: current.procedureType !== 'typeB',
      });

      this.formValue.set(normalized);
      this.vestFormRef().triggerFormValidation();
    }, 0);
  }
}

describe('dynamic-structure-validation-issue stories', () => {
  beforeEach(() => {
    dynamicFormValidationSuite.reset();
  });

  it('keeps the workaround transition flow valid after an extra structure change', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
      expect(screen.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
    });

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeB');
    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.getByTestId('debug__form-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('debug__has-errors')).toHaveTextContent(
        'false'
      );
    });
  });

  it('clears stale field values as the structure changes', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });

    const fieldAInput = screen.getByTestId(
      'input__field-a'
    ) as HTMLInputElement;
    await userEvent.type(fieldAInput, 'Test value for field A');

    await waitFor(() => {
      expect(fieldAInput.value).toBe('Test value for field A');
    });

    await userEvent.selectOptions(selectElement, 'typeB');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-b')).toBeInTheDocument();
    });

    const fieldBInput = screen.getByTestId(
      'input__field-b'
    ) as HTMLInputElement;
    await userEvent.type(fieldBInput, 'Test value for field B');

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await waitFor(() => {
      const formValueText =
        screen.getByTestId('debug__form-value').textContent ?? '';

      expect(formValueText).not.toContain('Test value for field A');
      expect(formValueText).not.toContain('Test value for field B');
      expect(formValueText).toContain('"procedureType": "typeC"');
    });
  });

  it('renders the expected controls for each structure transition', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeB');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-b')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.queryByTestId('info__type-c')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });
  });
});
