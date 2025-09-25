import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { createEmptyFormState, type NgxFormState } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { MULTI_STEP_FORM_CONTENT } from './multi-step-form.content';
import { MultiStepFormComponent } from './multi-step-form.form';

/**
 * Multi-Step Form Example Page
 *
 * Demonstrates advanced Vest.js group validation for wizard-style forms.
 * Shows step isolation, progress tracking, and conditional validation.
 *
 * 🎯 Learning Objectives:
 * - Understanding Vest.js group() function for step isolation
 * - Step-by-step validation with performance optimization
 * - Advanced TypeScript integration with generic validation suites
 * - Cross-step dependencies and conditional validation logic
 * - Real-world multi-step form patterns and UX considerations
 *
 * 🚀 Advanced Features:
 * - Group-based validation with only.group() optimization
 * - Async validation with proper cancellation handling
 * - TypeScript generics for compile-time type safety
 * - Step navigation with validation state management
 * - Progressive disclosure with conditional field logic
 * - Performance optimizations for complex multi-step scenarios
 *
 * 📚 Educational Value:
 * This component demonstrates enterprise-level form validation patterns
 * that scale to complex registration, onboarding, and checkout workflows.
 *
 * @example
 * ```html
 * <app-multi-step-form-page />
 * ```
 */
@Component({
  selector: 'ngx-multi-step-form-page',
  imports: [
    MultiStepFormComponent,
    ExampleCardsComponent,
    FormStateDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Advanced Vest.js group validation for wizard-style forms with step
        isolation, progress tracking, and performance optimization
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- The form component -->
      <ngx-multi-step-form #formComp />

      <!-- Developer form state panel -->
      <ngx-form-state-display
        [title]="'Live Form State (parent read)'"
        [formState]="childFormState()"
      />
    </ngx-example-cards>
  `,
})
export class MultiStepFormPageComponent {
  protected readonly formComponent =
    viewChild<MultiStepFormComponent>('formComp');
  readonly childFormState = computed(() => {
    const state = this.formComponent()?.formState();
    // Cast to NgxFormState for strict typing or provide empty fallback
    return (state as NgxFormState<unknown>) ?? createEmptyFormState();
  });

  protected readonly demonstratedContent = MULTI_STEP_FORM_CONTENT.demonstrated;
  protected readonly learningContent = MULTI_STEP_FORM_CONTENT.learning;
}
