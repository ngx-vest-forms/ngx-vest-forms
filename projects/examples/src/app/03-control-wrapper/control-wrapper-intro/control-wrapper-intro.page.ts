import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { CONTROL_WRAPPER_INTRO_CONTENT } from './control-wrapper-intro.content';
import { ControlWrapperIntroWrapperFormComponent } from './control-wrapper-intro.wrapper-form';

/**
 * Control Wrapper Introduction Page Component
 *
 * This page demonstrates NgxControlWrapper automation and shows how it simplifies
 * form development compared to manual approaches covered in the fundamentals section.
 *
 * 🎯 Learning Objectives:
 * - Understanding NgxControlWrapper automation benefits
 * - Seeing advanced features like async validation, warnings, and error display modes
 * - Learning the progressive path from manual fundamentals to automation
 * - Comparing implementation complexity via code examples
 *
 * 🚀 Features Demonstrated:
 * - NgxControlWrapper automation with advanced validation
 * - Async validation states with proper UX
 * - Warning system for non-blocking feedback
 * - Error display mode configuration
 * - Complete accessibility compliance
 * - Code comparison examples showing complexity reduction
 */
@Component({
  selector: 'ngx-control-wrapper-intro-page',
  imports: [
    ExampleCardsComponent,
    FormStateDisplayComponent,
    ControlWrapperIntroWrapperFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8">
      <p class="page-subtitle">
        Learn NgxControlWrapper automation for streamlined form development. For
        manual error handling fundamentals, see the
        <a
          href="/01-fundamentals"
          class="text-blue-600 underline hover:text-blue-800"
        >
          fundamentals section
        </a>
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <!-- NgxControlWrapper Form -->
      <ngx-control-wrapper-intro-wrapper-form #wrapperForm />

      <!-- Form State Display -->
      <div class="mx-auto mt-8 max-w-2xl">
        <ngx-form-state-display
          [title]="'NgxControlWrapper Form State'"
          [formState]="wrapperFormState()"
          class="form-state-card"
        />
      </div>
    </ngx-example-cards>
  `,
  styles: `
    .form-demo-card {
      overflow: hidden;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      background-color: white;
    }

    .dark .form-demo-card {
      border-color: #374151;
      background-color: #1f2937;
    }

    .form-demo-header {
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
      padding: 1rem;
    }

    .dark .form-demo-header {
      border-color: #374151;
      background-color: #111827;
    }

    .form-demo-title {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .dark .form-demo-title {
      color: #f9fafb;
    }

    .automation-badge {
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      background-color: #bbf7d0;
      color: #166534;
    }

    .dark .automation-badge {
      background-color: #14532d;
      color: #bbf7d0;
    }

    .form-demo-description {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .dark .form-demo-description {
      color: #9ca3af;
    }

    .form-state-card {
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
      background-color: white;
    }

    .dark .form-state-card {
      border-color: #374151;
      background-color: #1f2937;
    }
  `,
})
export class ControlWrapperIntroPageComponent {
  protected readonly wrapperFormComponent =
    viewChild<ControlWrapperIntroWrapperFormComponent>('wrapperForm');

  readonly wrapperFormState = computed(() =>
    this.wrapperFormComponent()?.formState(),
  );

  protected readonly demonstratedContent =
    CONTROL_WRAPPER_INTRO_CONTENT.demonstrated;
  protected readonly learningContent = CONTROL_WRAPPER_INTRO_CONTENT.learning;
}
