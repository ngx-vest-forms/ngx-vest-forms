import {
  ChangeDetectionStrategy,
  Component,
  computed,
  viewChild,
} from '@angular/core';
import { ExampleCardsComponent } from '../../ui';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { DYNAMIC_ARRAYS_CONTENT } from './dynamic-arrays.content';
import { DynamicArraysFormComponent } from './dynamic-arrays.form';

/**
 * Dynamic Arrays Example Page
 *
 * Demonstrates advanced Vest.js `each()` functionality for dynamic form arrays.
 * Shows complex nested validation, array management, and performance optimization.
 *
 * 🎯 Learning Objectives:
 * - Understanding Vest.js each() function for array validation
 * - Dynamic array management with add/remove/reorder operations
 * - Complex nested validation within dynamic arrays
 * - Performance optimization with stable IDs and conditional validation
 * - Cross-array validation logic and dependencies
 * - Advanced form state management for array-based forms
 *
 * 🚀 Advanced Features:
 * - Dynamic contact management (phone, email, multiple addresses)
 * - Async validation for array items with proper cancellation
 * - Stable ID management for performance and accessibility
 * - Cross-array validation rules and business logic
 * - Conditional rendering based on array validation state
 * - Drag-and-drop reordering with validation preservation
 *
 * 📚 Educational Value:
 * This component demonstrates enterprise-level dynamic form patterns
 * commonly found in contact management, shopping carts, and multi-item forms.
 *
 * @example
 * ```html
 * <app-dynamic-arrays-page />
 * ```
 */
@Component({
  selector: 'app-dynamic-arrays-page',
  imports: [
    ExampleCardsComponent,
    DynamicArraysFormComponent,
    FormStateDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="example-layout">
      <!-- Header Section -->
      <header class="example-header">
        <h1 class="example-title">Dynamic Arrays</h1>
        <p class="example-subtitle">
          Advanced array validation with Vest.js <code>each()</code> function
          and complex nested validation patterns.
        </p>
      </header>

      <!-- Example Cards -->
      <ngx-example-cards
        [demonstrated]="content.demonstrated"
        [learning]="content.learning"
        class="mb-8"
      />

      <!-- Form Demo -->
      <div class="example-demo">
        <div class="demo-form">
          <app-dynamic-arrays-form #formDemo />
        </div>

        <div class="demo-state">
          <ngx-form-state-display
            [formState]="formState()"
            title="Array Form State"
            class="sticky top-4"
          />
        </div>
      </div>

      <!-- Educational Content -->
      <section class="example-education">
        <div class="prose prose-sm dark:prose-invert max-w-none">
          <h2>Array Validation Patterns</h2>
          <p>
            This example showcases advanced array validation using Vest.js
            <code>each()</code>
            function. Learn how to validate dynamic arrays with complex nested
            structures, implement cross-array validation rules, and optimize
            performance with stable IDs.
          </p>

          <h3>Key Features</h3>
          <ul>
            <li>
              <strong>Dynamic Array Management:</strong> Add, remove, and
              reorder contact information
            </li>
            <li>
              <strong>Nested Validation:</strong> Complex validation within
              array items
            </li>
            <li>
              <strong>Async Validation:</strong> Real-time validation for email
              uniqueness
            </li>
            <li>
              <strong>Performance Optimization:</strong> Stable IDs and
              conditional validation
            </li>
            <li>
              <strong>Cross-Array Rules:</strong> Business logic spanning
              multiple array items
            </li>
          </ul>

          <h3>Testing Scenarios</h3>
          <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <h4
              class="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200"
            >
              Try These Patterns:
            </h4>
            <ul class="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>
                • Add multiple contacts with different types (phone, email,
                address)
              </li>
              <li>• Test email uniqueness validation across contacts</li>
              <li>• Try removing items and observe validation state updates</li>
              <li>• Test the primary contact designation logic</li>
              <li>• Observe performance with stable ID management</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class DynamicArraysPageComponent {
  protected readonly content = DYNAMIC_ARRAYS_CONTENT;
  private readonly formDemo = viewChild(DynamicArraysFormComponent);

  protected readonly formState = computed(() => {
    return this.formDemo()?.formState() || null;
  });

  protected readonly formValue = computed(() => {
    return this.formDemo()?.formValue() || null;
  });
}
