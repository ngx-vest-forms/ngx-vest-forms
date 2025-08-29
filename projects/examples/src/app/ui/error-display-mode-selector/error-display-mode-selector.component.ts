import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgxErrorDisplayMode } from 'ngx-vest-forms/core';

export type ErrorDisplayModeConfig = {
  mode: NgxErrorDisplayMode;
  label: string;
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
};

export const ERROR_DISPLAY_MODES: ErrorDisplayModeConfig[] = [
  {
    mode: 'on-blur',
    label: 'On Blur',
    description: 'Show errors immediately when user leaves a field',
    whenToUse:
      'Forms where immediate feedback helps (e.g., complex validation)',
    pros: [
      'Immediate feedback',
      'Prevents error accumulation',
      'Good for expert users',
    ],
    cons: [
      'Can be overwhelming',
      'May interrupt user flow',
      'Anxiety-inducing for some users',
    ],
  },
  {
    mode: 'on-submit',
    label: 'On Submit',
    description: 'Show errors only when user attempts to submit',
    whenToUse: 'Simple forms or when you want to minimize interruptions',
    pros: [
      'Non-intrusive',
      'Allows completion without interruption',
      'Good for simple forms',
    ],
    cons: [
      'Delayed feedback',
      'May surprise users',
      'Potentially longer error correction time',
    ],
  },
  {
    mode: 'on-blur-or-submit',
    label: 'On Blur or Submit (Recommended)',
    description: 'Show errors on field blur OR form submit',
    whenToUse: 'Most forms - balances immediacy with user flow',
    pros: [
      'Balanced approach',
      'Flexible timing',
      'Good user experience',
      'WCAG 2.2 friendly',
    ],
    cons: ['Slight complexity in implementation'],
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
    <div
      class="mb-8 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-blue-900/20 dark:to-indigo-900/20"
    >
      <div class="mb-4">
        <label
          for="errorDisplayMode"
          class="text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          🎛️ Error Display Mode
        </label>
        <select
          id="errorDisplayMode"
          name="errorDisplayMode"
          [value]="selectedMode()"
          (change)="onModeChange($event)"
          class="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          @for (modeConfig of errorDisplayModes; track modeConfig.mode) {
            <option [value]="modeConfig.mode">{{ modeConfig.label }}</option>
          }
        </select>
      </div>

      <div class="rounded-lg bg-white/70 p-4 dark:bg-gray-800/70">
        <div class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ currentModeConfig().description }}
        </div>
        <div class="text-xs text-gray-600 dark:text-gray-400">
          <strong>When to use:</strong> {{ currentModeConfig().whenToUse }}
        </div>
      </div>

      <!-- Testing Instructions -->
      <div class="mt-4 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
        <div class="text-sm font-medium text-amber-800 dark:text-amber-200">
          🧪 Try this with "{{ currentModeConfig().label }}":
        </div>
        <div class="mt-1 text-xs text-amber-700 dark:text-amber-300">
          @switch (selectedMode()) {
            @case ('on-blur') {
              1. Click in any field → 2. Type something invalid → 3. Tab away →
              4. Notice immediate error feedback
            }
            @case ('on-submit') {
              1. Fill form with invalid data → 2. Try to submit → 3. See all
              errors appear at once
            }
            @case ('on-blur-or-submit') {
              1. Try both blur and submit behaviors → 2. Notice flexible error
              timing
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ErrorDisplayModeSelectorComponent {
  /** The currently selected error display mode */
  readonly selectedMode = input.required<NgxErrorDisplayMode>();

  /** Event emitted when the mode selection changes */
  readonly modeChange = output<NgxErrorDisplayMode>();

  protected readonly errorDisplayModes = ERROR_DISPLAY_MODES;

  protected readonly currentModeConfig = () =>
    this.errorDisplayModes.find((mode) => mode.mode === this.selectedMode()) ||
    this.errorDisplayModes[2];

  protected onModeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newMode = select.value as NgxErrorDisplayMode;
    this.modeChange.emit(newMode);
  }
}
