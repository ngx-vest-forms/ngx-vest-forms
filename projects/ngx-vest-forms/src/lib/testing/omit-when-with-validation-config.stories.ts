import { componentWrapperDecorator, Meta, StoryObj } from '@storybook/angular';
import { Component, signal, computed } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { vestForms } from '../exports';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { staticSuite, test, only, enforce, omitWhen } from 'vest';
import type { NgxDeepPartial } from '../../public-api';
import type { NgxVestSuite } from '../utils/validation-suite';

/**
 * Form model representing the issue #59 scenario:
 * Two fields with bidirectional dependency - both optional when empty,
 * both required when one has a value.
 */
type OmitWhenFormModel = NgxDeepPartial<{
  berekendeAftrekVoorarrest: {
    aantal: number;
    onderbouwing: string;
  };
}>;

/**
 * Validation suite demonstrating omitWhen with bidirectional dependencies.
 *
 * CRITICAL: Notice the unconditional `only(field)` call at the top.
 * This is required for PR #60's fix to work correctly.
 */
const omitWhenValidationSuite: NgxVestSuite<OmitWhenFormModel> = staticSuite(
  (model, field?) => {
    only(field); // ✅ CORRECT: Unconditional call

    // Require onderbouwing ONLY when aantal has a value
    omitWhen(!model.berekendeAftrekVoorarrest?.aantal, () => {
      test(
        'berekendeAftrekVoorarrest.onderbouwing',
        'Onderbouwing is verplicht wanneer aantal is ingevuld',
        () => {
          enforce(model.berekendeAftrekVoorarrest?.onderbouwing).isNotBlank();
        }
      );
    });

    // Require aantal ONLY when onderbouwing has a value (reverse dependency)
    omitWhen(!model.berekendeAftrekVoorarrest?.onderbouwing, () => {
      test(
        'berekendeAftrekVoorarrest.aantal',
        'Aantal is verplicht wanneer onderbouwing is ingevuld',
        () => {
          enforce(model.berekendeAftrekVoorarrest?.aantal).isNotEmpty();
        }
      );
    });
  }
);

const formShape: NgxDeepPartial<OmitWhenFormModel> = {
  berekendeAftrekVoorarrest: {
    aantal: 0,
    onderbouwing: '',
  },
};

/**
 * Test selectors for interaction tests
 */
const selectors = {
  inputAantal: 'input__aantal',
  inputOnderbouwing: 'input__onderbouwing',
  scControlWrapperAantal: 'sc-control-wrapper__aantal',
  scControlWrapperOnderbouwing: 'sc-control-wrapper__onderbouwing',
  btnSubmit: 'btn__submit',
  btnClearAantal: 'btn__clear-aantal',
  btnClearOnderbouwing: 'btn__clear-onderbouwing',
  formDebug: 'form__debug',
};

@Component({
  selector: 'app-omit-when-validation-config',
  template: `
    <div class="p-4">
      <h2 class="text-xl font-bold mb-4">omitWhen + validationConfig Test</h2>
      <p class="mb-4 text-sm text-gray-600">
        This demonstrates issue #59 fix: bidirectional dependencies where both
        fields are optional when empty, but both become required when one has a
        value.
      </p>

      <form
        scVestForm
        (ngSubmit)="onSubmit()"
        [formValue]="formValue()"
        [formShape]="shape"
        [validationConfig]="validationConfig"
        [suite]="suite"
        (validChange)="formValid.set($event)"
        (errorsChange)="errors.set($event)"
        (formValueChange)="setFormValue($event)"
        class="space-y-4"
      >
        <div ngModelGroup="berekendeAftrekVoorarrest">
          <div
            class="w-full"
            sc-control-wrapper
            [attr.data-testid]="selectors.scControlWrapperAantal"
          >
            <label class="block">
              <span class="text-sm font-medium">Aantal</span>
              <input
                placeholder="Voer aantal in"
                [attr.data-testid]="selectors.inputAantal"
                type="number"
                [ngModel]="vm.formValue.berekendeAftrekVoorarrest?.aantal"
                name="aantal"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </label>
          </div>

          <div
            class="w-full"
            sc-control-wrapper
            [attr.data-testid]="selectors.scControlWrapperOnderbouwing"
          >
            <label class="block">
              <span class="text-sm font-medium">Onderbouwing</span>
              <textarea
                placeholder="Voer onderbouwing in"
                [attr.data-testid]="selectors.inputOnderbouwing"
                [ngModel]="vm.formValue.berekendeAftrekVoorarrest?.onderbouwing"
                name="onderbouwing"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              ></textarea>
            </label>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            [attr.data-testid]="selectors.btnSubmit"
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
          <button
            [attr.data-testid]="selectors.btnClearAantal"
            type="button"
            (click)="clearAantal()"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Aantal
          </button>
          <button
            [attr.data-testid]="selectors.btnClearOnderbouwing"
            type="button"
            (click)="clearOnderbouwing()"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Onderbouwing
          </button>
        </div>
      </form>

      <div
        [attr.data-testid]="selectors.formDebug"
        class="mt-4 p-4 bg-gray-100 rounded text-xs"
      >
        <h3 class="font-bold mb-2">Debug Info:</h3>
        <pre>{{ vm | json }}</pre>
      </div>
    </div>
  `,
  imports: [vestForms, JsonPipe],
  standalone: true,
})
export class OmitWhenValidationConfigComponent {
  protected readonly formValue = signal<OmitWhenFormModel>({});
  protected readonly formValid = signal<boolean>(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly shape = formShape;
  protected readonly suite = omitWhenValidationSuite;
  protected readonly selectors = selectors;

  /**
   * Bidirectional validationConfig:
   * - When aantal changes, re-validate onderbouwing
   * - When onderbouwing changes, re-validate aantal
   */
  protected readonly validationConfig = {
    'berekendeAftrekVoorarrest.aantal': [
      'berekendeAftrekVoorarrest.onderbouwing',
    ],
    'berekendeAftrekVoorarrest.onderbouwing': [
      'berekendeAftrekVoorarrest.aantal',
    ],
  };

  private readonly viewModel = computed(() => ({
    formValue: this.formValue(),
    errors: this.errors(),
    formValid: this.formValid(),
  }));

  protected get vm() {
    return this.viewModel();
  }

  protected setFormValue(v: OmitWhenFormModel): void {
    this.formValue.set(v);
  }

  protected clearAantal(): void {
    this.formValue.update((v) => ({
      ...v,
      berekendeAftrekVoorarrest: {
        ...v.berekendeAftrekVoorarrest,
        aantal: undefined,
      },
    }));
  }

  protected clearOnderbouwing(): void {
    this.formValue.update((v) => ({
      ...v,
      berekendeAftrekVoorarrest: {
        ...v.berekendeAftrekVoorarrest,
        onderbouwing: undefined,
      },
    }));
  }

  protected onSubmit(): void {
    if (this.formValid()) {
      console.log('Form submitted:', this.formValue());
    }
  }
}

const meta: Meta<OmitWhenValidationConfigComponent> = {
  title: 'omitWhen + validationConfig (Issue #59)',
  component: OmitWhenValidationConfigComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# omitWhen + validationConfig Test Scenario

This story demonstrates the fix for **Issue #59**: Complex interaction between \`omitWhen\`, \`validationConfig\`, and nested field paths.

## The Problem (Before PR #60)

When \`validationConfig\` triggered dependent field validation, the validation suite received stale data from the \`formValue()\` signal.
This caused \`omitWhen\` to evaluate incorrectly, resulting in:
- \`valid: false\` but \`errorCount: 0\`, \`testCount: 0\`
- No errors displayed even though validation should fail

## The Fix (PR #60)

Changed validation to use \`mergeValuesAndRawValues(this.ngForm.form)\` instead of \`formValue()\` signal,
ensuring validation always sees the latest field values from Angular's form controls.

## Test Scenarios

1. **Scenario 1**: Fill aantal → onderbouwing becomes required
2. **Scenario 2**: Fill onderbouwing → aantal becomes required
3. **Scenario 3**: Clear trigger field → dependent field errors disappear
4. **Scenario 4**: Bidirectional dependency cycle works correctly
        `,
      },
    },
  },
};

export default meta;

/**
 * Primary story - interactive playground
 */
export const Primary: StoryObj = {
  decorators: [componentWrapperDecorator(OmitWhenValidationConfigComponent)],
};

/**
 * Test Scenario 1: Fill aantal first
 * Expected: onderbouwing becomes required and shows error when empty
 */
export const Scenario1_FillAantalFirst: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Step 1: Type "1" in aantal field
    const aantalInput = canvas.getByTestId(selectors.inputAantal);
    await userEvent.clear(aantalInput);
    await userEvent.type(aantalInput, '1');

    // Step 2: Click on onderbouwing (triggers validation via validationConfig)
    const onderbouwingInput = canvas.getByTestId(selectors.inputOnderbouwing);
    await userEvent.click(onderbouwingInput);

    // Step 3: Blur onderbouwing without entering data
    await onderbouwingInput.blur();

    // Wait for validation to complete
    await waitFor(
      () => {
        const wrapper = canvas.getByTestId(
          selectors.scControlWrapperOnderbouwing
        );
        expect(wrapper).toHaveTextContent(
          'Onderbouwing is verplicht wanneer aantal is ingevuld'
        );
      },
      { timeout: 2000 }
    );
  },
};

/**
 * Test Scenario 2: Fill onderbouwing first
 * Expected: aantal becomes required and shows error when empty
 */
export const Scenario2_FillOnderbouwingFirst: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Step 1: Type text in onderbouwing field
    const onderbouwingInput = canvas.getByTestId(selectors.inputOnderbouwing);
    await userEvent.clear(onderbouwingInput);
    await userEvent.type(onderbouwingInput, 'Some explanation text');

    // Step 2: Click on aantal (triggers validation via validationConfig)
    const aantalInput = canvas.getByTestId(selectors.inputAantal);
    await userEvent.click(aantalInput);

    // Step 3: Blur aantal without entering data
    await aantalInput.blur();

    // Wait for validation to complete
    await waitFor(
      () => {
        const wrapper = canvas.getByTestId(selectors.scControlWrapperAantal);
        expect(wrapper).toHaveTextContent(
          'Aantal is verplicht wanneer onderbouwing is ingevuld'
        );
      },
      { timeout: 2000 }
    );
  },
};

/**
 * Test Scenario 3: Clear trigger field removes dependent errors
 * Expected: When aantal is cleared, onderbouwing error disappears (omitWhen works)
 */
export const Scenario3_ClearTriggerRemovesErrors: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Step 1: Fill aantal to trigger onderbouwing requirement
    const aantalInput = canvas.getByTestId(selectors.inputAantal);
    await userEvent.clear(aantalInput);
    await userEvent.type(aantalInput, '5');

    // Step 2: Touch onderbouwing to trigger validation
    const onderbouwingInput = canvas.getByTestId(selectors.inputOnderbouwing);
    await userEvent.click(onderbouwingInput);
    await onderbouwingInput.blur();

    // Step 3: Verify error appears
    await waitFor(
      () => {
        const wrapper = canvas.getByTestId(
          selectors.scControlWrapperOnderbouwing
        );
        expect(wrapper).toHaveTextContent(
          'Onderbouwing is verplicht wanneer aantal is ingevuld'
        );
      },
      { timeout: 2000 }
    );

    // Step 4: Clear aantal using button
    const clearButton = canvas.getByTestId(selectors.btnClearAantal);
    await userEvent.click(clearButton);

    // Step 5: Verify error disappears (omitWhen skips the test)
    await waitFor(
      () => {
        const wrapper = canvas.getByTestId(
          selectors.scControlWrapperOnderbouwing
        );
        expect(wrapper).not.toHaveTextContent('verplicht');
      },
      { timeout: 2000 }
    );
  },
};

/**
 * Test Scenario 4: Bidirectional dependency cycle
 * Expected: Both fields can trigger each other's validation correctly
 */
export const Scenario4_BidirectionalCycle: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const aantalInput = canvas.getByTestId(selectors.inputAantal);
    const onderbouwingInput = canvas.getByTestId(selectors.inputOnderbouwing);

    // Step 1: Fill aantal → onderbouwing becomes required
    await userEvent.clear(aantalInput);
    await userEvent.type(aantalInput, '3');
    await userEvent.click(onderbouwingInput);
    await onderbouwingInput.blur();

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperOnderbouwing)
      ).toHaveTextContent('verplicht');
    });

    // Step 2: Fill onderbouwing → error disappears, but aantal must stay filled
    await userEvent.clear(onderbouwingInput);
    await userEvent.type(onderbouwingInput, 'Explanation');
    await onderbouwingInput.blur();

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperOnderbouwing)
      ).not.toHaveTextContent('verplicht');
    });

    // Step 3: Clear aantal → onderbouwing still has value, so aantal becomes required
    await userEvent.click(canvas.getByTestId(selectors.btnClearAantal));
    await userEvent.click(aantalInput);
    await aantalInput.blur();

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperAantal)
      ).toHaveTextContent('verplicht');
    });

    // Step 4: Clear onderbouwing → both fields empty, no errors
    await userEvent.click(canvas.getByTestId(selectors.btnClearOnderbouwing));

    await waitFor(() => {
      expect(
        canvas.getByTestId(selectors.scControlWrapperAantal)
      ).not.toHaveTextContent('verplicht');
      expect(
        canvas.getByTestId(selectors.scControlWrapperOnderbouwing)
      ).not.toHaveTextContent('verplicht');
    });
  },
};

/**
 * Test Scenario 5: Submit with empty fields (both optional)
 * Expected: No validation errors when both fields are empty
 */
export const Scenario5_SubmitEmptyFields: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Submit without filling any fields
    await userEvent.click(canvas.getByTestId(selectors.btnSubmit));

    // Wait a bit for any potential validation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify no errors appear (both fields are optional when empty)
    const aantalWrapper = canvas.getByTestId(selectors.scControlWrapperAantal);
    const onderbouwingWrapper = canvas.getByTestId(
      selectors.scControlWrapperOnderbouwing
    );

    expect(aantalWrapper).not.toHaveTextContent('verplicht');
    expect(onderbouwingWrapper).not.toHaveTextContent('verplicht');
  },
};

/**
 * Test Scenario 6: Rapid field switching
 * Expected: Validation updates correctly even with rapid user input
 */
export const Scenario6_RapidFieldSwitching: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const aantalInput = canvas.getByTestId(selectors.inputAantal);
    const onderbouwingInput = canvas.getByTestId(selectors.inputOnderbouwing);

    // Rapid back-and-forth interaction
    await userEvent.type(aantalInput, '1');
    await userEvent.click(onderbouwingInput);
    await userEvent.type(onderbouwingInput, 'T');
    await userEvent.click(aantalInput);
    await userEvent.clear(aantalInput);
    await userEvent.click(onderbouwingInput);
    await onderbouwingInput.blur();

    // Final state: aantal empty, onderbouwing has "T"
    // Expected: aantal should show error (required when onderbouwing filled)
    await waitFor(
      () => {
        expect(
          canvas.getByTestId(selectors.scControlWrapperAantal)
        ).toHaveTextContent('verplicht');
      },
      { timeout: 2000 }
    );
  },
};
