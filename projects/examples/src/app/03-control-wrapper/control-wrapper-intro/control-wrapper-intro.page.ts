import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { ExampleCardsComponent, ShikiHighlightDirective } from '../../ui';
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
      <div class="mx-auto mt-8 max-w-2xl">
        <ngx-form-state-display
          [title]="'NgxControlWrapper Form State:'"
          [formState]="wrapperFormState()"
          class="form-state-card"
        />
      </div>

      <!-- NgxControlWrapper Complete Guide -->
      <div class="mx-auto mt-8 max-w-4xl">
        <details
          class="code-example overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <summary
            class="cursor-pointer bg-gray-50 px-6 py-4 text-lg font-semibold text-gray-900 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            🚀 NgxControlWrapper Complete Guide & Benefits
          </summary>
          <div class="p-6">
            <p class="mb-6 text-gray-600 dark:text-gray-400">
              NgxControlWrapper provides comprehensive form automation with zero
              configuration. See how simple it is compared to manual error
              handling:
            </p>
            <pre
              ngxShikiHighlight
              language="angular-html"
              class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"
              >{{ wrapperCodeExample }}</pre
            >
            <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div
                class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <h4
                  class="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
                >
                  ✨ Advanced Features:
                </h4>
                <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-500">⏳</span>
                    Async validation states (spinner, aria-busy)
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-yellow-500">⚠️</span>
                    Warning system (role="status", yellow styling)
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-purple-500">⚙️</span>
                    Error display mode configuration
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500">♿</span>
                    Complete accessibility support
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-pink-500">🎨</span>
                    Consistent error/warning styling
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-gray-500">📝</span>
                    Zero boilerplate code
                  </li>
                </ul>
              </div>
              <div
                class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <h4
                  class="mb-3 flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100"
                >
                  🎉 Automation Benefits:
                </h4>
                <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-500">✨</span>
                    Automatic error/warning display
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-purple-500">🎨</span>
                    Consistent styling and behavior
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500">♿</span>
                    Built-in accessibility compliance
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-yellow-500">⏳</span>
                    Automatic async state management
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-pink-500">🔄</span>
                    Zero repetitive code
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-gray-500">🛠️</span>
                    Minimal maintenance overhead
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-500">⚙️</span>
                    Configurable error display modes
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-green-500">📦</span>
                    Single wrapper for all field logic
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </ngx-example-cards>

    <!-- Additional Benefits Section -->
    <section class="mt-8">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Key Benefits Card -->
        <div
          class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 flex items-center gap-3 text-lg font-semibold">
            {{ keyBenefitsContent.icon }} {{ keyBenefitsContent.title }}
          </h3>
          <div class="space-y-4">
            @for (section of keyBenefitsContent.sections; track section.title) {
              <div>
                <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  {{ section.title }}
                </h4>
                <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  @for (item of section.items; track item) {
                    <li class="leading-relaxed" [innerHTML]="item"></li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>

        <!-- Implementation Details Card -->
        <div
          class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 flex items-center gap-3 text-lg font-semibold">
            {{ implementationContent.icon }} {{ implementationContent.title }}
          </h3>
          <div class="space-y-4">
            @for (
              section of implementationContent.sections;
              track section.title
            ) {
              <div>
                <h4 class="mb-2 font-medium text-gray-900 dark:text-gray-100">
                  {{ section.title }}
                </h4>
                <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  @for (item of section.items; track item) {
                    <li class="leading-relaxed" [innerHTML]="item"></li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
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
  protected readonly keyBenefitsContent =
    CONTROL_WRAPPER_INTRO_CONTENT.keyBenefits;
  protected readonly implementationContent =
    CONTROL_WRAPPER_INTRO_CONTENT.implementation;

  protected readonly wrapperCodeExample = `<!-- Async Validation with Pending States -->
<ngx-control-wrapper [errorDisplayMode]="'on-blur'">
  <label for="username">Username *</label>
  <input id="username" name="username" [ngModel]="model().username" />
  <!-- Automatically shows spinner, "Validating..." message -->
  <!-- Sets aria-busy="true" during async validation -->
</ngx-control-wrapper>

<!-- Warning System -->
<ngx-control-wrapper>
  <label for="email">Email *</label>
  <input id="email" name="email" [ngModel]="model().email" />
  <!-- Automatically displays warnings with role="status" -->
  <!-- Yellow styling for non-blocking feedback -->
</ngx-control-wrapper>

<!-- Error Display Mode Configuration -->
<ngx-control-wrapper [errorDisplayMode]="'on-blur-or-submit'">
  <!-- Controls when errors appear: -->
  <!-- 'on-blur' | 'on-submit' | 'on-blur-or-submit' -->
</ngx-control-wrapper>`;
}
