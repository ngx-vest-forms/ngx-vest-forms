import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { CardComponent } from '../../ui/card/card.component';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { BasicValidationFormComponent } from './basic-validation.form';

/**
 * Basic Validation Example - Foundation Level
 *
 * This example demonstrates the core fundamentals of ngx-vest-forms without any wrapper dependencies.
 * It shows manual error handling patterns that developers need to understand before using convenience helpers.
 *
 * 🎯 Learning Objectives:
 * - Understanding the three-part pattern: Model Signal + Vest Suite + Template
 * - Manual error display using formState.errors
 * - Proper one-way binding with [ngModel]
 * - Form submission handling with validation state
 * - Multiple field types with different validation rules
 * - Conditional validation logic in action
 *
 * 🚀 Features Demonstrated:
 * - Core ngxVestForm directive
 * - Manual error display (no NgxControlWrapper)
 * - Form state API (valid, pending, errors)
 * - Different field types (text, email, number, select, textarea)
 * - Conditional validation logic
 * - Proper accessibility patterns
 * - Modern glassmorphism design with floating labels
 *
 * 📚 Educational Value:
 * This component serves as the foundation example before adopting wrapper conveniences.
 * Understanding this raw API surface helps developers appreciate the convenience of higher-level helpers.
 *
 * @example
 * ```html
 * <ngx-basic-validation></ngx-basic-validation>
 * ```
 */

@Component({
  selector: 'ngx-basic-validation-page',
  imports: [
    BasicValidationFormComponent,
    CardComponent,
    FormStateDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page content without wrapper -->
    <div>
      <!-- Learning objectives wrapped in card -->
      <ngx-card
        variant="primary-outline"
        labelledBy="learningObjectivesHeading"
        class="mb-6 text-left"
      >
        <div card-header>
          <h2 id="learningObjectivesHeading" class="mb-4 text-lg font-semibold">
            🔧 What You'll See Demonstrated
          </h2>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Manual Error Handling
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>
                • Direct
                <code class="text-indigo-600 dark:text-indigo-400"
                  >formState().errors</code
                >
                access
              </li>
              <li>
                • One-way field bindings with
                <code class="text-indigo-600 dark:text-indigo-400"
                  >[ngModel]</code
                >
              </li>
              <li>• Custom error display patterns</li>
              <li>• Accessibility-first error messaging</li>
            </ul>
          </div>
          <div>
            <h3 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
              Validation Showcase
            </h3>
            <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Name length constraints (2-50 chars)</li>
              <li>• Email format validation</li>
              <li>• Age range limits (18-120)</li>
              <li>• Role selection with enums</li>
              <li>• Terms agreement validation</li>
            </ul>
          </div>
        </div>
      </ngx-card>

      <!-- The form component inside a reusable card -->
      <ngx-card variant="primary-outline" labelledBy="basicValidationHeading">
        <ngx-basic-validation-form #formComp />
      </ngx-card>

      <!-- Developer form state panel (reading child's computed formState) -->
      <ngx-form-state-display
        [title]="'Live Form State (parent read)'"
        [formState]="childFormState()"
      />

      <!-- Implementation Notes -->
      <ngx-card variant="educational" class="mt-8">
        <div card-header>🎯 Learning Journey & Next Steps</div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Why This Example Matters
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Foundation before using convenience wrappers</li>
              <li>• Understand the raw ngx-vest-forms API surface</li>
              <li>• Learn manual accessibility implementation</li>
              <li>• Master complex validation scenarios</li>
            </ul>
          </div>

          <div>
            <h3
              class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Key Learning Outcomes
            </h3>
            <ul class="space-y-1 text-xs text-gray-700 dark:text-gray-300">
              <li>• Manual error display timing control</li>
              <li>• Custom ARIA patterns for accessibility</li>
              <li>• Conditional validation with multiple fields</li>
              <li>• Appreciate convenience of wrapper helpers</li>
            </ul>
          </div>
        </div>

        <div
          class="mt-4 border-t border-indigo-200 pt-4 dark:border-indigo-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            📖 <strong>Next step:</strong> Try the
            <a
              href="/fundamentals/error-display-modes"
              class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >Error Display Modes</a
            >
            example to learn about different validation timing patterns.
          </div>
        </div>
      </ngx-card>
    </div>
  `,
})
export class BasicValidationPage {
  protected readonly formComponent =
    viewChild<BasicValidationFormComponent>('formComp');
  readonly childFormState = computed(() => this.formComponent()?.formState());
}
