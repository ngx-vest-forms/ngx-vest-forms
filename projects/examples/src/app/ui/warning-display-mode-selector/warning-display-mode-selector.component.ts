import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgxWarningDisplayMode } from 'ngx-vest-forms/core';

export type WarningDisplayModeConfig = {
  mode: NgxWarningDisplayMode | 'disabled';
  label: string;
  description: string;
  whenToUse: string;
  pros: string[];
  cons: string[];
};

export const WARNING_DISPLAY_MODES: WarningDisplayModeConfig[] = [
  {
    mode: 'on-change',
    label: 'While Typing (Recommended)',
    description: 'Show warnings 180ms after user stops typing',
    whenToUse:
      'Most forms - provides real-time guidance without being intrusive',
    pros: [
      'Immediate helpful feedback',
      'Prevents bad decisions early',
      'Smooth 180ms debounce prevents flicker',
      'Non-blocking guidance',
    ],
    cons: ['Might feel "busy" to some users', 'Requires more processing power'],
  },
  {
    mode: 'on-blur',
    label: 'After Blur Only',
    description: 'Show warnings only when user leaves the field',
    whenToUse: 'Conservative approach or when warnings might be distracting',
    pros: [
      'Less visual noise',
      "Doesn't interrupt typing flow",
      'Lower processing overhead',
    ],
    cons: [
      'Delayed feedback',
      'User might miss important guidance',
      'Less proactive UX',
    ],
  },
  {
    mode: 'disabled',
    label: 'Disabled',
    description: 'Hide all warnings - show only blocking errors',
    whenToUse: 'When warnings add no value or cause confusion',
    pros: [
      'Clean, minimal interface',
      'Focus only on blocking issues',
      'Reduced cognitive load',
    ],
    cons: [
      'No proactive guidance',
      'Users miss helpful tips',
      'Less educational value',
    ],
  },
];

/**
 * Reusable Warning Display Mode Selector Component
 *
 * Allows switching between different warning display modes with
 * educational context about each mode's characteristics.
 */
@Component({
  selector: 'ngx-warning-display-mode-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Warning Mode Selector Section -->
    <div
      class="mb-8 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 p-6 dark:from-amber-900/20 dark:to-yellow-900/20"
      data-testid="warning-mode-selector"
    >
      <div class="mb-4">
        <fieldset>
          <legend
            class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            ⚡ Warning Display Mode
          </legend>
          <div class="flex flex-wrap gap-4">
            @for (modeConfig of warningDisplayModes; track modeConfig.mode) {
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="warningDisplayMode"
                  [value]="modeConfig.mode"
                  [checked]="selectedMode() === modeConfig.mode"
                  (change)="onModeChange($event)"
                  class="form-radio h-4 w-4 border-gray-300 text-amber-600 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800"
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
            @case ('on-change') {
              1. Click in email field → 2. Type "user&#64;gmail.com" → 3. Notice
              warning appears while typing (180ms delay) → 4. Warning persists
              even after blur
            }
            @case ('on-blur') {
              1. Click in password field → 2. Type "abc123" → 3. Tab away → 4.
              Notice warning appears only after blur
            }
            @case ('disabled') {
              1. Fill form with "user&#64;yahoo.com" and "password123" → 2.
              Notice no warnings appear → 3. Only blocking errors will show
            }
          }
        </div>
      </div>

      <!-- Pro Tips Section -->
      <div class="mt-4 rounded-lg bg-amber-100 p-3 dark:bg-amber-800/50">
        <div class="text-sm font-medium text-amber-800 dark:text-amber-200">
          💡 Pro Tip:
        </div>
        <div class="mt-1 text-xs text-amber-700 dark:text-amber-300">
          @switch (selectedMode()) {
            @case ('on-change') {
              "While Typing" provides the best user experience - immediate
              feedback helps users make better decisions without blocking their
              workflow.
            }
            @case ('on-blur') {
              Perfect for forms where you want conservative feedback. Users
              complete fields without distraction, then get guidance.
            }
            @case ('disabled') {
              Use sparingly - warnings provide valuable education. Only disable
              when warnings genuinely add no value.
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class WarningDisplayModeSelectorComponent {
  /** The currently selected warning display mode */
  readonly selectedMode = input.required<NgxWarningDisplayMode | 'disabled'>();

  /** Event emitted when the mode selection changes */
  readonly modeChange = output<NgxWarningDisplayMode | 'disabled'>();

  protected readonly warningDisplayModes = WARNING_DISPLAY_MODES;

  protected readonly currentModeConfig = () =>
    this.warningDisplayModes.find(
      (mode) => mode.mode === this.selectedMode(),
    ) || this.warningDisplayModes[0];

  protected onModeChange(event: Event): void {
    const radio = event.target as HTMLInputElement;
    const newMode = radio.value as NgxWarningDisplayMode | 'disabled';
    this.modeChange.emit(newMode);
  }
}
