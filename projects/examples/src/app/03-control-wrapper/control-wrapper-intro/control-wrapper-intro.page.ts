import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { createEmptyFormState } from 'ngx-vest-forms/core';
import { ExampleCardsComponent } from '../../ui';
import { ShikiHighlightDirective } from '../../ui/code-highlight/shiki-highlight.directive';
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
    ShikiHighlightDirective,
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
      <div class="mt-8">
        <ngx-form-state-display
          [title]="'NgxControlWrapper Form State:'"
          [formState]="wrapperFormState()"
          class="rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
        />
      </div>

      <!-- Code Implementation Example -->
      <div class="mt-8">
        <details
          class="code-example overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <summary
            class="cursor-pointer bg-gray-50 px-6 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            📋 NgxControlWrapper Implementation Examples
          </summary>
          <div class="p-6">
            <p class="mb-6 text-gray-600 dark:text-gray-400">
              See how NgxControlWrapper simplifies form implementation with
              automatic error handling, async validation states, and warning
              system integration:
            </p>
            <pre
              ngxShikiHighlight
              language="angular-html"
              class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"
              >{{ wrapperCodeExample }}</pre
            >
          </div>
        </details>
      </div>
    </ngx-example-cards>
  `,
})
export class ControlWrapperIntroPageComponent {
  protected readonly wrapperFormComponent =
    viewChild<ControlWrapperIntroWrapperFormComponent>('wrapperForm');

  readonly wrapperFormState = computed(() => {
    const state = this.wrapperFormComponent()?.formState();
    // Provide a default empty state to satisfy the required input
    return state ?? createEmptyFormState();
  });

  protected readonly demonstratedContent =
    CONTROL_WRAPPER_INTRO_CONTENT.demonstrated;
  protected readonly learningContent = CONTROL_WRAPPER_INTRO_CONTENT.learning;

  protected readonly wrapperCodeExample = `<!-- Async Validation with Pending States -->
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <label for="username">Username *</label>
  <input id="username" name="username" [ngModel]="model().username" />
  <!-- Automatically shows spinner, "Validating..." message -->
  <!-- Sets aria-busy="true" during async validation -->
</ngx-control-wrapper>

<!-- Warning System Integration -->
<ngx-control-wrapper [showWarnings]="'on-change'">
  <label for="email">Email *</label>
  <input id="email" name="email" [ngModel]="model().email" />
  <!-- Automatically displays warnings with role="status" -->
  <!-- Yellow styling for non-blocking feedback -->
  <!-- 180ms debounce for smooth UX -->
</ngx-control-wrapper>

<!-- Error Display Mode Configuration -->
<ngx-control-wrapper [errorDisplayMode]="'on-blur-or-submit'">
  <label for="password">Password *</label>
  <input id="password" name="password" [ngModel]="model().password" />
  <!-- Controls when errors appear: -->
  <!-- 'on-blur' | 'on-submit' | 'on-blur-or-submit' -->
</ngx-control-wrapper>`;
}
