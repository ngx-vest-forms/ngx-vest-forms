import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Wizard navigation component
 * Provides Previous/Next/Submit buttons with configurable states
 *
 * A11y Best Practices:
 * - Buttons are NEVER disabled based on form validity (users can click to see errors)
 * - Only disable during active submission to prevent double-clicks
 * - Use aria-hidden for decorative icons
 * - Provide clear button labels
 */
@Component({
  selector: 'ngx-wizard-navigation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between pt-6" role="navigation" aria-label="Form navigation">
      <!-- Previous button -->
      @if (showPrevious()) {
        <button
          type="button"
          class="btn btn-secondary gap-2"
          (click)="previous.emit()"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>
      } @else {
        <!-- Spacer to maintain layout when Previous is hidden -->
        <div></div>
      }

      <div class="flex gap-3">
        <!-- Save & Continue button (for steps 1 and 2) -->
        @if (showSaveAndContinue()) {
          <button
            type="submit"
            class="btn btn-primary gap-2"
          >
            Save & Continue
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        }

        <!-- Final Submit button (for step 3) -->
        @if (showSubmit()) {
          <button
            type="button"
            class="btn btn-success gap-2 px-6"
            [disabled]="isSubmitting()"
            (click)="submitAll.emit()"
          >
            @if (isSubmitting()) {
              <svg
                class="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            } @else {
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            }
            {{ submitLabel() }}
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class WizardNavigationComponent {
  readonly showPrevious = input(true);
  readonly showSaveAndContinue = input(true);
  readonly showSubmit = input(false);
  /** Only disable during active submission to prevent double-clicks */
  readonly isSubmitting = input(false);
  readonly submitLabel = input('Submit All');

  readonly previous = output();
  readonly submitAll = output();
}
