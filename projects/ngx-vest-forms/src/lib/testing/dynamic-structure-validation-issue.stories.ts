import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import {
  Component,
  computed,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { vestForms } from '../exports';
import { FormDirective } from '../directives/form.directive';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { DeepPartial } from '../utils/deep-partial';
import { DeepRequired } from '../utils/deep-required';
import { staticSuite, test, enforce, omitWhen, only } from 'vest';
import { JsonPipe } from '@angular/common';

type DynamicFormModel = DeepPartial<{
  procedureType: 'typeA' | 'typeB' | 'typeC';
  fieldA?: string;
  fieldB?: string;
}>;

const dynamicFormShape: DeepRequired<DynamicFormModel> = {
  procedureType: 'typeA',
  fieldA: '',
  fieldB: '',
};

const dynamicFormValidationSuite = staticSuite(
  (model: DynamicFormModel, field?: string) => {
    if (field) {
      only(field);
    }

    test('procedureType', 'Procedure type is required', () => {
      enforce(model.procedureType).isNotBlank();
    });

    // Only validate fieldA when procedureType is 'typeA'
    omitWhen(model.procedureType !== 'typeA', () => {
      test('fieldA', 'Field A is required for Type A procedure', () => {
        enforce(model.fieldA).isNotBlank();
      });
    });

    // Only validate fieldB when procedureType is 'typeB'
    omitWhen(model.procedureType !== 'typeB', () => {
      test('fieldB', 'Field B is required for Type B procedure', () => {
        enforce(model.fieldB).isNotBlank();
      });
    });

    // TypeC has no additional validation requirements - just procedureType
  }
);

@Component({
  selector: 'app-dynamic-structure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      #vestForm="scVestForm"
      class="p-4 max-w-lg"
      scVestForm
      [formValue]="formValue()"
      [formShape]="shape"
      [suite]="suite"
      (formValueChange)="handleFormChange($event)"
      (validChange)="formValid.set($event)"
      (errorsChange)="errors.set($event)"
    >
      <fieldset class="space-y-4">
        <legend class="text-lg font-semibold mb-4">
          Dynamic Form Structure Test - Angular 20 Best Practices
        </legend>

        <div
          sc-control-wrapper
          data-testid="sc-control-wrapper__procedure-type"
        >
          <label class="block">
            <span class="block text-sm font-medium mb-2">Procedure Type</span>
            <select
              name="procedureType"
              [ngModel]="formValue().procedureType"
              data-testid="select__procedure-type"
              class="w-full p-2 border border-gray-300 rounded"
              (change)="onProcedureTypeChange($event)"
            >
              <option value="">Select a procedure type...</option>
              <option value="typeA">Type A (requires input field A)</option>
              <option value="typeB">Type B (requires input field B)</option>
              <option value="typeC">Type C (informational only)</option>
            </select>
          </label>
        </div>

        <!-- Type A: Shows input field A -->
        <!-- Using @if instead of *ngIf (Angular 20 best practice) -->
        @if (formValue().procedureType === 'typeA') {
          <div
            sc-control-wrapper
            data-testid="sc-control-wrapper__field-a"
            class="bg-blue-50 p-3 rounded"
          >
            <label class="block">
              <span class="block text-sm font-medium mb-2"
                >Field A (Required)</span
              >
              <input
                name="fieldA"
                [ngModel]="formValue().fieldA"
                data-testid="input__field-a"
                placeholder="Enter Field A value"
                class="w-full p-2 border border-gray-300 rounded"
              />
            </label>
            <p class="text-sm text-blue-600 mt-1">
              This field is required for Type A procedures.
            </p>
          </div>
        }

        <!-- Type B: Shows input field B -->
        @if (formValue().procedureType === 'typeB') {
          <div
            sc-control-wrapper
            data-testid="sc-control-wrapper__field-b"
            class="bg-green-50 p-3 rounded"
          >
            <label class="block">
              <span class="block text-sm font-medium mb-2"
                >Field B (Required)</span
              >
              <input
                name="fieldB"
                [ngModel]="formValue().fieldB"
                data-testid="input__field-b"
                placeholder="Enter Field B value"
                class="w-full p-2 border border-gray-300 rounded"
              />
            </label>
            <p class="text-sm text-green-600 mt-1">
              This field is required for Type B procedures.
            </p>
          </div>
        }

        <!-- Type C: Shows informational paragraph (no inputs) -->
        @if (formValue().procedureType === 'typeC') {
          <div
            data-testid="info__type-c"
            class="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400"
          >
            <h3 class="text-lg font-medium text-yellow-800">
              Type C Procedure Information
            </h3>
            <p class="text-yellow-700 mt-2">
              This procedure type does not require any additional input fields.
              The system will automatically configure the necessary parameters
              based on your selection.
            </p>
            <ul class="list-disc list-inside text-yellow-700 mt-2 space-y-1">
              <li>Automatic parameter configuration</li>
              <li>No additional user input required</li>
              <li>Processing will begin immediately upon form submission</li>
            </ul>
          </div>
        }

        <button
          type="submit"
          data-testid="btn__submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          [disabled]="!formValid()"
        >
          {{ formValid() ? 'Submit Form' : 'Please complete required fields' }}
        </button>

        <!-- Debug information -->
        <details class="mt-6 bg-gray-100 p-4 rounded">
          <summary class="cursor-pointer font-medium">
            Debug Information (Angular 20 Pattern with Signals)
          </summary>
          <div class="mt-3 space-y-2 text-sm font-mono">
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
              <span class="block mb-1">Form Value:</span>
              <pre class="bg-white p-2 rounded text-xs overflow-auto">{{
                formValue() | json
              }}</pre>
            </div>
            <div data-testid="debug__errors" class="border-t pt-2">
              <span class="block mb-1">Errors:</span>
              <pre class="bg-white p-2 rounded text-xs overflow-auto">{{
                errors() | json
              }}</pre>
            </div>
          </div>
        </details>
      </fieldset>
    </form>
  `,
  imports: [vestForms, JsonPipe],
})
export class DynamicStructureComponent {
  // Angular 20: Using ViewChild to access template reference
  @ViewChild('vestForm', { static: true })
  private readonly vestFormRef!: FormDirective<DynamicFormModel>;

  // Angular 20: Using signals for state management
  protected readonly formValue = signal<DynamicFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string>>({});

  // Static properties can remain as regular properties
  protected readonly shape = dynamicFormShape;
  protected readonly suite = dynamicFormValidationSuite;

  // Angular 20: Using computed() for derived state
  protected readonly hasErrors = computed(() => {
    return Object.keys(this.errors()).length > 0;
  });

  protected handleFormChange(value: DynamicFormModel): void {
    this.formValue.set(value);
  }

  protected onProcedureTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const rawValue = target.value as 'typeA' | 'typeB' | 'typeC' | '';
    const newValue = rawValue === '' ? undefined : rawValue;

    // Update form value with proper field clearing for component state consistency
    this.formValue.update((current) => ({
      ...current,
      procedureType: newValue,
      // Clear fields that are no longer relevant to keep component state clean
      // Angular automatically removes FormControls from DOM, but we need to clean our signal state
      ...(newValue !== 'typeA' && { fieldA: undefined }),
      ...(newValue !== 'typeB' && { fieldB: undefined }),
    }));

    // Using the new triggerFormValidation() API to handle structure changes
    // This is necessary because Angular doesn't emit ValueChangeEvent when form structure changes
    setTimeout(() => {
      this.vestFormRef.triggerFormValidation();
    }, 0);
  }
}

const meta: Meta<DynamicStructureComponent> = {
  title: 'Issues/Dynamic Structure Validation',
  component: DynamicStructureComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Dynamic Form Structure Validation - Angular 20 Best Practices

This story demonstrates both a validation issue in ngx-vest-forms and modern Angular 20 patterns:

### Angular 20 Best Practices Demonstrated:
- ✅ **Signals**: Using \`signal()\` for state management instead of properties
- ✅ **Computed**: Using \`computed()\` for derived state
- ✅ **OnPush**: Using \`ChangeDetectionStrategy.OnPush\` for performance
- ✅ **Native Control Flow**: Using \`@if\` instead of \`*ngIf\`
- ✅ **Style Bindings**: Using \`[style.color]\` instead of \`ngStyle\`
- ✅ **ViewChild**: Modern template reference access pattern

### Form Structure Issue:
- **Type A**: Shows input field A (required)
- **Type B**: Shows input field B (required)
- **Type C**: Shows informational paragraph (no inputs, no additional validation)

### Key Learning: Field Clearing Logic

\`\`\`typescript
// This IS needed for component state consistency:
...(newType !== 'typeA' && { fieldA: undefined }),
...(newType !== 'typeB' && { fieldB: undefined }),
\`\`\`

**Why?** Angular automatically removes FormControls from DOM when inputs are hidden,
but your component state (signals/properties) retains old values, creating inconsistency.

### Solution: triggerFormValidation() API
When form structure changes, manually trigger validation to ensure UI updates immediately.
        `,
      },
    },
  },
};

export default meta;

export const Primary: StoryObj = {
  decorators: [componentWrapperDecorator(DynamicStructureComponent)],
};

export const DemonstrateValidationIssue: StoryObj = {
  name: 'Validation Issue Reproduction',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initially, form should be invalid (procedureType not selected)
    await waitFor(() => {
      expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
      expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent('true');
    });

    // Select Type A - this should show Field A input
    const selectElement = canvas.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;
    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
      expect(canvas.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(canvas.queryByTestId('info__type-c')).not.toBeInTheDocument();
    });

    // Form should still be invalid because Field A is empty (required for Type A)
    await waitFor(() => {
      expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
      expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent('true');
    });

    // Now switch to Type C - this removes the input field and shows informational content
    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(canvas.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(canvas.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(canvas.getByTestId('info__type-c')).toBeInTheDocument();
    });

    // BUG DEMONSTRATION: Form should be valid now
    // (only procedureType is required and it's filled, Type C has no additional requirements)
    // However, validation doesn't update because no ValueChangeEvent is emitted
    // when the form structure changes from input field to paragraph

    // This assertion demonstrates the bug - it should pass but likely fails
    try {
      await waitFor(
        () => {
          expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
            'true'
          );
          expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent(
            'false'
          );
        },
        { timeout: 2000 }
      );
    } catch (error) {
      console.error(
        'BUG CONFIRMED: Form validation did not update after structure change'
      );
      console.error(
        'Expected: Form should be valid (Type C has no additional requirements)'
      );
      console.error(
        'Actual: Form validation state is stale from previous Type A selection'
      );
      throw error;
    }
  },
};

export const WorkaroundTest: StoryObj = {
  name: 'Manual Validation Update (Workaround)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start with Type A
    const selectElement = canvas.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;
    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
      expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
    });

    // Switch to Type C
    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(canvas.getByTestId('info__type-c')).toBeInTheDocument();
    });

    // Workaround: Trigger any other field change to force validation update
    // (In real app, this would be calling form.updateValueAndValidity() manually)
    await userEvent.selectOptions(selectElement, 'typeB');
    await userEvent.selectOptions(selectElement, 'typeC');

    // After the workaround, validation should be correct
    await waitFor(() => {
      expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent('true');
      expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent(
        'false'
      );
    });
  },
};

export const SolutionWithTriggerValidation: StoryObj = {
  name: 'Solution: Using triggerFormValidation()',
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the solution using the new \`triggerFormValidation()\` method.
When the form structure changes (switching to/from Type C), we manually trigger validation
to ensure the form validity updates immediately.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Start with Type A - form should be invalid (fieldA required but empty)
    const selectElement = canvas.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;
    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
      expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
    });

    // Switch to Type C - form should become valid immediately due to triggerFormValidation()
    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(canvas.getByTestId('info__type-c')).toBeInTheDocument();
      expect(canvas.queryByTestId('input__field-a')).not.toBeInTheDocument();
    });

    // SOLUTION DEMONSTRATION: Form should be valid immediately
    await waitFor(
      () => {
        expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
          'true'
        );
        expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent(
          'false'
        );
      },
      { timeout: 1000 }
    );

    // Test reverse transition: C → A (should become invalid)
    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(
      () => {
        expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
        expect(canvas.getByTestId('debug__form-valid')).toHaveTextContent(
          'false'
        );
        expect(canvas.getByTestId('debug__has-errors')).toHaveTextContent(
          'true'
        );
      },
      { timeout: 1000 }
    );
  },
};

export const FieldClearingDemo: StoryObj = {
  name: 'Field Clearing Logic Demonstration',
  parameters: {
    docs: {
      description: {
        story: `
### Why Field Clearing is Necessary

This story demonstrates why manually clearing fields is needed for component state consistency.

**Angular Template-Driven Forms Behavior:**
1. When input is removed from DOM (via \`@if\`), Angular automatically removes the FormControl
2. FormGroup.value will no longer contain that property
3. **BUT** your component signal/property still contains the old value!

**Test this:**
1. Select "Type A" and enter text in Field A
2. Select "Type C" - notice Field A input disappears (Angular removes FormControl)
3. Check Debug Info - without field clearing, \`formValue()\` would still show old fieldA value
4. With proper clearing, component state stays consistent with form structure

**The Pattern:**
\`\`\`typescript
...(newType !== 'typeA' && { fieldA: undefined }),
...(newType !== 'typeB' && { fieldB: undefined }),
\`\`\`

This ensures component state matches the actual form structure after DOM changes.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectElement = canvas.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    // Start with Type A
    await userEvent.selectOptions(selectElement, 'typeA');
    await waitFor(() => {
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
    });

    // Enter some text in Field A
    const fieldAInput = canvas.getByTestId(
      'input__field-a'
    ) as HTMLInputElement;
    await userEvent.type(fieldAInput, 'Test value for field A');

    await waitFor(() => {
      expect(fieldAInput.value).toBe('Test value for field A');
    });

    // Switch to Type B - Field A should be cleared from component state
    await userEvent.selectOptions(selectElement, 'typeB');
    await waitFor(() => {
      expect(canvas.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(canvas.getByTestId('input__field-b')).toBeInTheDocument();
    });

    // Enter text in Field B
    const fieldBInput = canvas.getByTestId(
      'input__field-b'
    ) as HTMLInputElement;
    await userEvent.type(fieldBInput, 'Test value for field B');

    // Switch to Type C - both fields should be cleared from component state
    await userEvent.selectOptions(selectElement, 'typeC');
    await waitFor(() => {
      expect(canvas.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(canvas.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(canvas.getByTestId('info__type-c')).toBeInTheDocument();
    });

    // Verify component state is clean (no stale field values)
    // The form should show only procedureType in the debug info
    await waitFor(() => {
      const debugInfo = canvas.getByTestId('debug__form-value');
      const formValueText = debugInfo.textContent || '';
      // Should NOT contain fieldA or fieldB values
      expect(formValueText).not.toContain('Test value for field A');
      expect(formValueText).not.toContain('Test value for field B');
      // Should only contain procedureType
      expect(formValueText).toContain('"procedureType": "typeC"');
    });
  },
};

export const TestAllTransitions: StoryObj = {
  name: 'Test All Structure Transitions',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selectElement = canvas.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    // Test A → B transition
    await userEvent.selectOptions(selectElement, 'typeA');
    await waitFor(() =>
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument()
    );

    await userEvent.selectOptions(selectElement, 'typeB');
    await waitFor(() => {
      expect(canvas.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(canvas.getByTestId('input__field-b')).toBeInTheDocument();
    });

    // Test B → C transition (input to paragraph)
    await userEvent.selectOptions(selectElement, 'typeC');
    await waitFor(() => {
      expect(canvas.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(canvas.getByTestId('info__type-c')).toBeInTheDocument();
    });

    // Test C → A transition (paragraph to input)
    await userEvent.selectOptions(selectElement, 'typeA');
    await waitFor(() => {
      expect(canvas.queryByTestId('info__type-c')).not.toBeInTheDocument();
      expect(canvas.getByTestId('input__field-a')).toBeInTheDocument();
    });
  },
};
