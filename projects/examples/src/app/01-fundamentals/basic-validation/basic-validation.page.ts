import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ErrorDisplayStrategy } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { Debugger } from '../../ui/debugger/debugger';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
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
  imports: [
    BasicValidationFormComponent,
    ExampleCardsComponent,
    Debugger,
    ErrorDisplayModeSelectorComponent,
  ],
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
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [selectedMode]="selectedMode()"
        (modeChange)="onModeChange($event)"
        class="mb-6"
      />

      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <ngx-basic-validation-form
          #formComp
          [errorDisplayMode]="selectedMode()"
        />
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

  protected readonly selectedMode = signal<ErrorDisplayStrategy>('on-touch');

  protected readonly demonstratedContent =
    BASIC_VALIDATION_CONTENT.demonstrated;
  protected readonly learningContent = BASIC_VALIDATION_CONTENT.learning;

  protected onModeChange(mode: ErrorDisplayStrategy): void {
    this.selectedMode.set(mode);
  }
}
