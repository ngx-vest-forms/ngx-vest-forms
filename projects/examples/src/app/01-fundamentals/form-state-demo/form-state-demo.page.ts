import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { createEmptyFormState } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { FORM_STATE_DEMO_CONTENT } from './form-state-demo.content';
import { FormStateDemoFormComponent } from './form-state-demo.form.js';

/**
 * Form State Demo Page Component
 *
 * This page demonstrates comprehensive form state management with ngx-vest-forms.
 * It showcases real-time monitoring of all form state properties including:
 * - Form validity and status tracking
 * - Error and warning management
 * - Async validation states
 * - Performance monitoring
 * - Interactive state visualization
 *
 * ## Usage
 *
 * ```html
 * <ngx-form-state-demo-page></ngx-form-state-demo-page>
 * ```
 */

@Component({
  selector: 'ngx-form-state-demo-page',
  imports: [
    ExampleCardsComponent,
    FormStateDemoFormComponent,
    FormStateDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Comprehensive demonstration of ngx-vest-forms state management with
        real-time monitoring, async validation, and performance tracking
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- The form component -->
      <ngx-form-state-demo-form #formComp />

      <!-- Developer form state panel -->
      <ngx-form-state-display
        [title]="'Live Form State (parent read)'"
        [formState]="childFormState()"
      />
    </ngx-example-cards>
  `,
})
export class FormStateDemoPageComponent {
  protected readonly formComponent =
    viewChild<FormStateDemoFormComponent>('formComp');
  readonly childFormState = computed(
    () => this.formComponent()?.formState() ?? createEmptyFormState(),
  );

  /** Educational content for the example cards */
  protected readonly demonstratedContent = FORM_STATE_DEMO_CONTENT.demonstrated;
  protected readonly learningContent = FORM_STATE_DEMO_CONTENT.learning;
}
