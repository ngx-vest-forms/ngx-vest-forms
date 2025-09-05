import { JsonPipe, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { SCHEMA_COMPARISON_CONTENT } from './schema-comparison.content';
import { SchemaComparisonFormComponent } from './schema-comparison.form';
import type { SchemaType, UserProfile } from './user-profile.model';

/**
 * Schema Integration Showcase Page Component
 *
 * This page demonstrates the power of schema integration with ngx-vest-forms by
 * allowing users to dynamically switch between different schema libraries and
 * see how they compare in terms of features, performance, and developer experience.
 *
 * 🎯 Learning Objectives:
 * - Understanding when to use schema validation vs Vest-only validation
 * - Comparing different schema libraries (Zod, Valibot, ArkType, Custom)
 * - Seeing dual validation in action (Vest + Schema)
 * - Performance comparison between schema libraries
 * - Type safety benefits of schema-first development
 *
 * 🚀 Features Demonstrated:
 * - Dynamic schema switching at runtime
 * - Live code display for each schema library
 * - Performance metrics comparison
 * - Schema validation state inspection
 * - Type-safe form handling with different schema libraries
 * - Educational content about schema selection
 *
 * 📚 Educational Value:
 * This component serves as a comprehensive guide for developers choosing between
 * schema libraries and understanding the benefits of schema-driven validation.
 */
@Component({
  selector: 'ngx-schema-comparison-page',
  imports: [
    SchemaComparisonFormComponent,
    ExampleCardsComponent,
    FormStateDisplayComponent,
    JsonPipe,
    TitleCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <!-- Header Section -->
      <header class="mb-8">
        <p class="page-subtitle">
          {{ content.description }}
        </p>
      </header>

      <!-- Featured Sections (Demonstrated Features and Form) -->
      <ngx-example-cards
        [demonstrated]="demonstratedContent"
        [learning]="learningContent"
      >
        <!-- Main Form -->
        <ngx-schema-comparison-form
          [model]="model()"
          (formSubmitted)="onFormSubmit($event)"
          (formReset)="resetForm()"
          #formComponent
        />

        <!-- Form State Display - Right after the form, before Schema Selection Guide -->
        @if (formState()) {
          <div class="mt-8">
            <ngx-form-state-display
              [formState]="formState()!"
              title="Current Form State"
            />
          </div>
        }
      </ngx-example-cards>

      <!-- Submission Results -->
      @if (submissionResult(); as result) {
        <div
          class="mt-8 rounded-lg border p-6"
          [class]="getResultClasses(result.valid)"
          role="region"
          aria-live="polite"
          aria-label="Form submission result"
        >
          <h3
            class="mb-4 text-lg font-semibold"
            [class]="getResultTextClasses(result.valid)"
          >
            {{ result.schemaType | titlecase }} Schema Validation Result
          </h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <strong>Status:</strong>
              {{ result.valid ? 'Valid ✅' : 'Invalid ❌' }}
            </div>
            <div><strong>Schema Library:</strong> {{ result.schemaType }}</div>
          </div>
          @if (!result.valid) {
            <div class="mt-4">
              <strong>Validation failed:</strong> Please check the form errors
              above.
            </div>
          } @else {
            <div class="mt-4">
              <strong>Success!</strong> Form data validated successfully with
              {{ result.schemaType }}.
              <details class="mt-2">
                <summary class="cursor-pointer text-sm font-medium">
                  View submitted data
                </summary>
                <pre
                  class="mt-2 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800"
                  >{{ result.data | json }}</pre
                >
              </details>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SchemaComparisonPageComponent {
  // Content
  readonly content = SCHEMA_COMPARISON_CONTENT;

  // State
  model = signal<UserProfile>({
    name: '',
    email: '',
    age: 0,
    website: '',
    bio: '',
    preferences: {
      newsletter: false,
      notifications: false,
    },
  });
  submissionResult = signal<{
    data: UserProfile;
    valid: boolean;
    schemaType: SchemaType;
  } | null>(null);

  // Form component reference
  formComponent = viewChild<SchemaComparisonFormComponent>('formComponent');

  // Computed signal for stable form state access
  readonly formState = computed(() => {
    console.log(
      '[SchemaComparisonPageComponent] formState computed executing...',
    );
    const form = this.formComponent();
    console.log('[SchemaComparisonPageComponent] formComponent:', form);
    const formDirective = form?.formDirective();
    console.log(
      '[SchemaComparisonPageComponent] formDirective:',
      formDirective,
    );
    const formState = formDirective?.formState() ?? null;
    console.log(
      '[SchemaComparisonPageComponent] formState from directive:',
      formState,
    );
    return formState;
  });

  // Educational content configurations
  readonly demonstratedContent = SCHEMA_COMPARISON_CONTENT.demonstrated;
  readonly learningContent = {
    ...SCHEMA_COMPARISON_CONTENT.learning,
    nextStep: {
      text: SCHEMA_COMPARISON_CONTENT.learning.nextStep.text,
      link: SCHEMA_COMPARISON_CONTENT.learning.nextStep.route,
      linkText: SCHEMA_COMPARISON_CONTENT.learning.nextStep.label,
    },
  };

  // Minimal content for separated cards (removed empty placeholders)

  // Event handlers
  onFormSubmit(result: {
    data: UserProfile;
    valid: boolean;
    schemaType: SchemaType;
  }): void {
    this.submissionResult.set(result);

    // Log for debugging
    console.log('Form submitted with result:', result);
  }

  resetForm(): void {
    this.model.set({
      name: '',
      email: '',
      age: 0,
      website: '',
      bio: '',
      preferences: {
        newsletter: false,
        notifications: false,
      },
    });
    this.submissionResult.set(null);
  }

  // Helper methods for styling
  getResultClasses(valid: boolean): string {
    return valid
      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  }

  getResultTextClasses(valid: boolean): string {
    return valid
      ? 'text-green-800 dark:text-green-200'
      : 'text-red-800 dark:text-red-200';
  }
}
