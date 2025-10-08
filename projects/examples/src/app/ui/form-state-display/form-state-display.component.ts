import { Component, computed, input } from '@angular/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ShikiHighlightDirective } from '../code-highlight/shiki-highlight.directive';

/**
 * Form state type matching ngx-vest-forms structure
 */
type FormState = {
  valid: boolean;
  pending: boolean;
  errors: Record<string, string[]>;
  schemaErrors?: Record<string, string[]>;
  warnings?: Record<string, string[]>;
  errorCount?: number;
  [key: string]: unknown; // Allow additional properties
};

@Component({
  selector: 'ngx-form-state-display',
  imports: [ShikiHighlightDirective],
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

      <!-- Two-Layer Validation Status (if schema errors exist) -->
      @if (hasSchemaErrors()) {
        <div
          class="border-b border-gray-200 bg-orange-50 px-6 py-4 dark:border-gray-700 dark:bg-orange-900/20"
        >
          <div class="flex items-start gap-3">
            <div
              class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
            </div>
            <div class="flex-1">
              <h4
                class="mb-2 font-semibold text-orange-900 dark:text-orange-200"
              >
                {{ schemaVendorDisplay() }} Schema Errors (Layer 1)
              </h4>
              <div class="space-y-2">
                @for (entry of Object.entries(schemaErrors()); track entry[0]) {
                  <div
                    class="rounded-md bg-white p-3 dark:bg-gray-800"
                    role="alert"
                  >
                    <div
                      class="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      {{ entry[0] }}:
                    </div>
                    <ul class="list-inside list-disc space-y-1">
                      @for (error of entry[1]; track error) {
                        <li
                          class="text-sm text-orange-700 dark:text-orange-300"
                        >
                          {{ error }}
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
              <p class="mt-3 text-xs text-orange-800 dark:text-orange-300">
                💡
                @if (schemaVendor()) {
                  <strong>{{ schemaVendor() }}</strong> validation runs first
                  (Layer 1), then Vest business logic (Layer 2)
                } @else {
                  Schema validation runs first (Layer 1), then Vest business
                  logic (Layer 2)
                }
              </p>
            </div>
            <div
              class="rounded-full bg-orange-200 px-2 py-1 text-xs font-bold text-orange-900 dark:bg-orange-800 dark:text-orange-200"
            >
              {{ schemaErrorCount() }}
            </div>
          </div>
        </div>
      }

      <!-- Enhanced Content Area -->
      <div class="form-state-content relative">
        @if (formStateJson(); as stateJson) {
          <pre
            ngxShikiHighlight
            language="json"
            class="form-state-json min-h-[300px] overflow-auto p-6 text-sm leading-relaxed"
            data-testid="enhanced-form-state-json"
            >{{ stateJson }}</pre
          >
        } @else {
          <div class="flex min-h-[300px] items-center justify-center p-6">
            <div class="text-center">
              <div
                class="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 p-3 dark:bg-gray-700"
              >
                <svg
                  class="h-6 w-6 text-gray-400"
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
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No form state data available
              </p>
            </div>
          </div>
        }

        <!-- Error Count Overlay -->
        @if (errorCount() > 0) {
          <div
            class="absolute bottom-4 right-4 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-lg"
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
export class FormStateDisplayComponent {
  readonly title = input.required<string>();
  readonly formState = input.required<unknown>();
  readonly schema = input<StandardSchemaV1 | undefined>();

  /** Expose Object for template use */
  protected readonly Object = Object;

  /**
   * Detect schema vendor from StandardSchemaV1 specification.
   * Returns 'zod', 'valibot', 'arktype', or undefined.
   * No type guard needed - just check the vendor property!
   */
  protected readonly schemaVendor = computed(() => {
    const s = this.schema();
    if (!s || typeof s !== 'object' || !('~standard' in s)) return;
    return (s as StandardSchemaV1)['~standard'].vendor;
  });

  /**
   * Format vendor name for display (capitalize first letter)
   */
  protected readonly schemaVendorDisplay = computed(() => {
    const vendor = this.schemaVendor();
    if (!vendor) return 'Schema';
    return vendor.charAt(0).toUpperCase() + vendor.slice(1);
  });

  /**
   * Get schema-specific errors (Layer 1 validation)
   */
  protected readonly schemaErrors = computed(() => {
    const state = this.typedFormState();
    return state?.schemaErrors || {};
  });

  /**
   * Check if there are any schema errors
   */
  protected readonly hasSchemaErrors = computed(() => {
    const errors = this.schemaErrors();
    return Object.keys(errors).length > 0;
  });

  /**
   * Count total schema errors
   */
  protected readonly schemaErrorCount = computed(() => {
    const errors = this.schemaErrors();
    return Object.values(errors).reduce((total, errs) => {
      return total + (Array.isArray(errs) ? errs.length : 1);
    }, 0);
  });

  /**
   * Convert form state to formatted JSON string for syntax highlighting
   */
  protected readonly formStateJson = computed(() => {
    const state = this.formState();
    return state ? JSON.stringify(state, null, 2) : '';
  });

  /**
   * Get typed form state
   */
  private readonly typedFormState = computed(() => {
    const state = this.formState();
    // Type guard: check if state has the expected structure
    if (state && typeof state === 'object' && 'valid' in state) {
      return state as FormState;
    }
    return null;
  });

  /**
   * Check if form is valid
   */
  protected readonly isFormValid = computed(() => {
    const state = this.typedFormState();
    // Trust the form state's own validity flags. A form is valid when the
    // exposed state says so and it's not pending. We don't second-guess by
    // re-deriving from errors to avoid race conditions with async validation
    // or intermediate mutation states.
    return state?.valid === true && state?.pending !== true;
  });

  /**
   * Check if form is pending validation
   */
  protected readonly isFormPending = computed(() => {
    const state = this.typedFormState();
    return state?.pending === true;
  });

  /**
   * Count total errors
   */
  protected readonly errorCount = computed(() => {
    const state = this.typedFormState();
    if (!state) return 0;
    // Prefer provided aggregate errorCount when available
    if (typeof state.errorCount === 'number') return state.errorCount;

    // Otherwise derive from errors record (sum of array lengths)
    if (state.errors && typeof state.errors === 'object') {
      return Object.values(state.errors).reduce((total, errors) => {
        return total + (Array.isArray(errors) ? errors.length : 1);
      }, 0);
    }
    return 0;
  });

  /**
   * Count form fields (based on error keys, as that's what we have access to)
   */
  protected readonly fieldCount = computed(() => {
    const state = this.typedFormState();
    if (!state?.errors) return 0;
    return Object.keys(state.errors).length;
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
