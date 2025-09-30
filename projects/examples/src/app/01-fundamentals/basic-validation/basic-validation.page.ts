import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { BASIC_VALIDATION_CONTENT } from './basic-validation.content';
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
  imports: [BasicValidationFormComponent, ExampleCardsComponent, Debugger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Essential validation patterns and manual error handling - building from
        the minimal example with explicit error display timing
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-basic-validation-form #formComp />
        @if (formComponent()?.debugFormState(); as debugForm) {
          <ngx-debugger [form]="debugForm" />
        }
      </div>
    </ngx-example-cards>
  `,
})
export class BasicValidationPage {
  protected readonly formComponent =
    viewChild<BasicValidationFormComponent>('formComp');

  protected readonly demonstratedContent =
    BASIC_VALIDATION_CONTENT.demonstrated;
  protected readonly learningContent = BASIC_VALIDATION_CONTENT.learning;
}
