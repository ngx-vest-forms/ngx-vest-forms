import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Debugger } from '../../ui/debugger/debugger';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FieldStatesTableComponent } from '../../ui/field-states-table/public-api';
import { FIELD_STATES_CONTENT } from './field-states.content';
import { FieldStatesForm } from './field-states.form';

/**
 * Field State Management Example Page
 * Demonstrates dirty, touched, invalid, valid states and programmatic control
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleCardsComponent,
    FieldStatesForm,
    FieldStatesTableComponent,
    Debugger,
  ],
  template: `
    <!-- Header Section -->
    <header class="mb-8">
      <p class="page-subtitle">
        Understanding dirty, touched, invalid, and valid states with interactive
        examples and programmatic control
      </p>
    </header>

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Side-by-side layout for form and debugger -->
      <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <!-- Interactive Form -->
        <ngx-field-states-form #formComponent />

        <!-- Real-time Form State Debugger -->
        @if (formComponent.debugFormState(); as debugForm) {
          <ngx-debugger [form]="debugForm" />
        }
      </div>

      <!-- Educational Content Below Form -->
      <div class="mt-8 space-y-6">
        <!-- Critical Distinctions -->
        <div>
          <h3
            class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            🔑 Critical Distinctions
          </h3>

          <div class="grid gap-4 lg:grid-cols-2">
            <!-- dirty vs touched -->
            <div
              class="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"
            >
              <h4
                class="mb-3 text-base font-bold text-amber-900 dark:text-amber-100"
              >
                dirty() vs touched()
              </h4>
              <div class="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <div class="rounded bg-amber-100 p-2 dark:bg-amber-900">
                  <strong>dirty():</strong> Tracks <em>value changes</em><br />
                  <span class="text-xs"
                    >Triggers: Typing in field, programmatic updates</span
                  >
                </div>
                <div class="rounded bg-amber-100 p-2 dark:bg-amber-900">
                  <strong>touched():</strong> Tracks <em>user interaction</em
                  ><br />
                  <span class="text-xs"
                    >Triggers: Focus then blur (tab out)</span
                  >
                </div>
                <div class="mt-2 rounded bg-amber-200 p-2 dark:bg-amber-800">
                  <strong>💡 When to use:</strong><br />
                  <span class="text-xs">
                    • dirty → Unsaved changes warning<br />
                    • touched → Progressive error disclosure
                  </span>
                </div>
              </div>
            </div>

            <!-- invalid vs !valid -->
            <div
              class="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
            >
              <h4
                class="mb-3 text-base font-bold text-red-900 dark:text-red-100"
              >
                invalid() vs !valid()
              </h4>
              <div class="space-y-2 text-sm text-red-800 dark:text-red-200">
                <div class="rounded bg-red-100 p-2 dark:bg-red-900">
                  <strong>invalid():</strong> Has errors (sync or async)<br />
                  <span class="text-xs">Use for: Error UI display</span>
                </div>
                <div class="rounded bg-red-100 p-2 dark:bg-red-900">
                  <strong>!valid():</strong> Has errors OR async pending<br />
                  <span class="text-xs">Use for: Disable submit buttons</span>
                </div>
                <div class="mt-2 rounded bg-red-200 p-2 dark:bg-red-800">
                  <strong>💡 Key difference:</strong><br />
                  <span class="text-xs">
                    valid() waits for async validation to complete
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live State Tracking Table -->
        @if (formComponent.form; as form) {
          <div
            class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3
              class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              📊 Live State Tracking
            </h3>
            <ngx-field-states-table
              [form]="form"
              [fields]="['email', 'username', 'password']"
            />
            <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
              T = true, F = false. Watch states change as you interact with the
              form.
            </p>
          </div>
        }
      </div>
    </ngx-example-cards>
  `,
})
export class FieldStatesPage {
  protected readonly content = FIELD_STATES_CONTENT;
}
