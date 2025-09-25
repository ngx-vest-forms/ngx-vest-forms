import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NgxFormState } from 'ngx-vest-forms/core';
import { ShikiHighlightDirective } from '../code-highlight/shiki-highlight.directive';

@Component({
  selector: 'ngx-form-state-display',
  imports: [ShikiHighlightDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="form-state-container overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      data-testid="enhanced-form-state-display"
    >
      <!-- Enhanced Header -->
      <div
        class="form-state-header border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700"
      >
        <div class="flex items-center justify-between px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
            >
              <svg
                class="h-4 w-4 text-blue-600 dark:text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                {{ title() }}:
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Live form validation state with error tracking
              </p>
            </div>
          </div>
          <!-- Form Status Badge -->
          <div class="form-status-badge">
            @if (isFormValid()) {
              <span
                class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                data-testid="enhanced-form-state-status"
              >
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Valid
              </span>
            } @else if (isFormPending()) {
              <span
                class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                data-testid="enhanced-form-state-status"
              >
                <svg
                  class="h-3 w-3 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
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
                Validating
              </span>
            } @else {
              <span
                class="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300"
                data-testid="enhanced-form-state-status"
              >
                <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Invalid
              </span>
            }
          </div>
        </div>
      </div>

      <!-- Enhanced Content Area -->
      <div class="form-state-content relative">
        <div
          ngxShikiHighlight
          language="json"
          [code]="formStateJson()"
          class="form-state-json min-h-[300px] overflow-auto p-6 text-sm leading-relaxed"
          data-testid="enhanced-form-state-json"
        ></div>

        <!-- Error Count Overlay -->
        @if (hasErrors()) {
          <div
            class="absolute right-4 bottom-4 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-lg"
          >
            {{ errorCount() }} error{{ errorCount() === 1 ? '' : 's' }}
          </div>
        }
      </div>

      <!-- Footer with metadata -->
      <div
        class="border-t border-gray-200 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-700"
      >
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <div class="flex items-center gap-4">
            <span>Updated: {{ lastUpdated() }}</span>
            @if (fieldCount() > 0) {
              <span>Fields: {{ fieldCount() }}</span>
            }
          </div>
          <div class="flex items-center gap-1">
            <span
              class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400"
            ></span>
            <span>Live updating</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .state-item {
      transition: all 0.2s ease;
    }

    .state-item:hover {
      background-color: rgba(59, 130, 246, 0.1);
    }
  `,
})
export class FormStateDisplayComponent<T = unknown> {
  readonly title = input.required<string>();
  // Strict generic typing - no null checks needed
  readonly formState = input.required<NgxFormState<T>>();

  /**
   * Convert form state to formatted JSON string for syntax highlighting
   */
  protected readonly formStateJson = computed<string>(() => {
    const state = this.formState();
    // No null check needed - input is required
    const preview = {
      valid: Boolean(state.valid),
      pending: Boolean(state.pending),
      value: state.value ?? {},
      errors: state.errors ?? {},
      warnings: state.warnings ?? {},
      errorCount:
        typeof state.errorCount === 'number'
          ? state.errorCount
          : Object.values(state.errors ?? {}).reduce<number>(
              (total, array) =>
                total + (Array.isArray(array) ? array.length : 0),
              0,
            ),
      status: state.status ?? 'VALID',
    };
    return JSON.stringify(preview, null, 2);
  });

  /**
   * Get typed form state
   */
  /**
   * Check if form is valid
   */
  protected readonly isFormValid = computed(() => {
    const state = this.formState();
    return state.valid && !state.pending;
  });

  /**
   * Check if form is pending validation
   */
  protected readonly isFormPending = computed<boolean>(() => {
    const state = this.formState();
    return state.pending === true;
  });

  /**
   * Count total errors
   */
  protected readonly errorCount = computed<number>(() => {
    const state = this.formState();
    if (typeof state.errorCount === 'number') return state.errorCount;
    const errors = state.errors ?? {};
    return Object.values(errors).reduce<number>((total, errorArray) => {
      return total + (Array.isArray(errorArray) ? errorArray.length : 0);
    }, 0);
  });

  /**
   * Whether there are any errors (for template conditions)
   */
  protected readonly hasErrors = computed<boolean>(() => {
    const count = this.errorCount();
    return count > 0;
  });

  /**
   * Count form fields (based on error keys, as that's what we have access to)
   */
  protected readonly fieldCount = computed(() => {
    const state = this.formState();
    const errors = state.errors ?? {};
    return Object.keys(errors).length;
  });

  /**
   * Last updated timestamp
   */
  protected readonly lastUpdated = computed(() => {
    // Trigger recomputation when formState changes
    this.formState();
    return new Date().toLocaleTimeString();
  });
}
