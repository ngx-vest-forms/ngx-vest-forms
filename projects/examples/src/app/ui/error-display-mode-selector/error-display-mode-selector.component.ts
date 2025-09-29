import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  ERROR_STRATEGIES,
  type ErrorDisplayStrategy,
} from 'ngx-vest-forms/core';

export type ErrorDisplayModeConfig = {
  mode: ErrorDisplayStrategy;
  label: string;
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
};

export const ERROR_DISPLAY_MODES: ErrorDisplayModeConfig[] = [
  {
    mode: 'immediate',
    label: ERROR_STRATEGIES.immediate.name,
    description: ERROR_STRATEGIES.immediate.description,
    whenToUse: ERROR_STRATEGIES.immediate.useCase,
    pros: [...ERROR_STRATEGIES.immediate.pros],
    cons: [...ERROR_STRATEGIES.immediate.cons],
  },
  {
    mode: 'on-touch',
    label: ERROR_STRATEGIES['on-touch'].name,
    description: ERROR_STRATEGIES['on-touch'].description,
    whenToUse: ERROR_STRATEGIES['on-touch'].useCase,
    pros: [...ERROR_STRATEGIES['on-touch'].pros],
    cons: [...ERROR_STRATEGIES['on-touch'].cons],
  },
  {
    mode: 'on-submit',
    label: ERROR_STRATEGIES['on-submit'].name,
    description: ERROR_STRATEGIES['on-submit'].description,
    whenToUse: ERROR_STRATEGIES['on-submit'].useCase,
    pros: [...ERROR_STRATEGIES['on-submit'].pros],
    cons: [...ERROR_STRATEGIES['on-submit'].cons],
  },
  {
    mode: 'manual',
    label: ERROR_STRATEGIES.manual.name,
    description: ERROR_STRATEGIES.manual.description,
    whenToUse: ERROR_STRATEGIES.manual.useCase,
    pros: [...ERROR_STRATEGIES.manual.pros],
    cons: [...ERROR_STRATEGIES.manual.cons],
  },
];

/**
 * Reusable Error Display Mode Selector Component
 *
 * Allows switching between different error display modes with
 * educational context about each mode's characteristics.
 */
@Component({
  selector: 'ngx-error-display-mode-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mode Selector Section -->
    <div class="error-mode-wrapper">
      <div class="mb-4">
        <fieldset>
          <legend
            class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            🎛️ Error Display Mode
          </legend>
          <div class="flex flex-wrap gap-4">
            @for (modeConfig of errorDisplayModes; track modeConfig.mode) {
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="errorDisplayMode"
                  [value]="modeConfig.mode"
                  [checked]="selectedMode() === modeConfig.mode"
                  (change)="onModeChange($event)"
                  class="form-radio h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ modeConfig.label }}</span
                >
              </label>
            }
          </div>
        </fieldset>
      </div>

      <div class="error-mode-summary">
        <div class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ currentModeConfig().description }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">
          <strong>When to use:</strong> {{ currentModeConfig().whenToUse }}
        </div>
      </div>

      <!-- Testing Instructions -->
      <div class="error-mode-instructions">
        <div class="text-sm font-medium text-amber-800 dark:text-amber-200">
          🧪 Try this with "{{ currentModeConfig().label }}":
        </div>
        <div class="mt-1 text-xs text-amber-700 dark:text-amber-300">
          @switch (selectedMode()) {
            @case ('immediate') {
              1. Start typing invalid data → 2. See feedback update instantly →
              3. Notice how errors clear as you type
            }
            @case ('on-touch') {
              1. Click a field → 2. Enter invalid data → 3. Tab away → 4.
              Observe errors appearing after you leave the field
            }
            @case ('on-submit') {
              1. Fill the form quickly → 2. Submit without fixing issues → 3.
              Watch all errors appear together
            }
            @case ('manual') {
              1. Interact with fields → 2. Notice no automatic errors → 3.
              Imagine controlling error display yourself (e.g., via guided
              flows)
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ErrorDisplayModeSelectorComponent {
  /** The currently selected error display mode */
  readonly selectedMode = input.required<ErrorDisplayStrategy>();

  /** Event emitted when the mode selection changes */
  readonly modeChange = output<ErrorDisplayStrategy>();

  protected readonly errorDisplayModes = ERROR_DISPLAY_MODES;

  protected readonly currentModeConfig = () =>
    this.errorDisplayModes.find((mode) => mode.mode === this.selectedMode()) ||
    this.errorDisplayModes[1];

  protected onModeChange(event: Event): void {
    const radio = event.target as HTMLInputElement;
    const newMode = radio.value as ErrorDisplayStrategy;
    this.modeChange.emit(newMode);
  }
}
