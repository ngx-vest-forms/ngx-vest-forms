import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
} from '@angular/core';
import { createVestForm, NgxVestForms } from 'ngx-vest-forms';
import { asDebuggerForm } from '../../ui/debugger/debugger';
import {
  createInitialFieldStatesModel,
  type FieldStatesModel,
} from './field-states.model';
import { fieldStatesValidations } from './field-states.validations';

/**
 * Field State Management Demo Form
 * Demonstrates dirty, touched, invalid, valid states and programmatic control
 */
@Component({
  selector: 'ngx-field-states-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <form
      [ngxVestForm]="form"
      (submit)="save()"
      class="form-container"
      novalidate
    >
      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Unsaved Changes Warning -->
      @if (form.dirty()) {
        <div
          class="mb-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-400 dark:bg-amber-900/20"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-2">
            <span class="text-amber-600 dark:text-amber-400">⚠️</span>
            <span
              class="text-sm font-medium text-amber-800 dark:text-amber-300"
            >
              Unsaved changes
            </span>
          </div>
        </div>
      }

      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Email Field -->
      <div class="form-field">
        <label class="form-label" for="email">Email Address *</label>
        <input
          id="email"
          type="email"
          class="form-input"
          [value]="form.email()"
          (input)="form.setEmail($event)"
          placeholder="you@example.com"
          aria-required="true"
        />
        <ngx-form-error [field]="form.emailField()" />
      </div>

      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Username Field -->
      <div class="form-field">
        <label class="form-label" for="username">Username *</label>
        <input
          id="username"
          type="text"
          class="form-input"
          [value]="form.username()"
          (input)="form.setUsername($event)"
          placeholder="johndoe"
          aria-required="true"
        />
        <ngx-form-error [field]="form.usernameField()" />
      </div>

      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Password Field -->
      <div class="form-field">
        <label class="form-label" for="password">Password *</label>
        <input
          id="password"
          type="password"
          class="form-input"
          [value]="form.password()"
          (input)="form.setPassword($event)"
          placeholder="••••••••"
          aria-required="true"
        />
        <ngx-form-error [field]="form.passwordField()" />

        <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Password Warnings (dirty + warnings pattern) -->
        <!-- Reserved space wrapper prevents layout shift when warnings appear/disappear -->
        <div class="min-h-[0px] transition-all duration-200">
          @if (
            form.passwordDirty() && form.passwordValidation().warnings.length
          ) {
            <div
              class="mt-2 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950"
            >
              <p
                class="text-xs font-semibold text-amber-800 dark:text-amber-200"
              >
                💡 Password Strength Suggestions:
              </p>
              @for (
                warning of form.passwordValidation().warnings;
                track warning
              ) {
                <p
                  class="text-sm text-amber-700 dark:text-amber-300"
                  role="status"
                >
                  • {{ warning }}
                </p>
              }
              <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                These are suggestions, not requirements
              </p>
            </div>
          }
        </div>
      </div>

      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Programmatic Control Buttons -->
      <div class="form-field">
        <p class="form-label">Programmatic State Control</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="markAllTouched()"
            class="btn-secondary text-sm"
          >
            Mark All Touched
          </button>
          <button
            type="button"
            (click)="markAllDirty()"
            class="btn-secondary text-sm"
          >
            Mark All Dirty
          </button>
          <button
            type="button"
            (click)="prefillForm()"
            class="btn-secondary text-sm"
          >
            Prefill Form
          </button>
          <button
            type="button"
            (click)="resetForm()"
            class="btn-secondary text-sm"
          >
            Reset
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Try these buttons to see programmatic state control in action
        </p>
      </div>

      <!-- ✅ Testing: Vitest browser testing + comprehensive E2E with Submit Button -->
      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          [disabled]="!form.valid() || form.pending()"
        >
          @if (form.submittedStatus() === 'submitting') {
            Submitting...
          } @else if (form.submittedStatus() === 'submitted') {
            ✓ Submitted!
          } @else {
            Submit
          }
        </button>

        @if (form.pending()) {
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Validating...
          </span>
        }
      </div>
    </form>
  `,
})
export class FieldStatesForm implements OnDestroy {
  /** Public form instance for state tracking in parent page */
  readonly form = createVestForm<FieldStatesModel>(
    signal(createInitialFieldStatesModel()),
    {
      suite: fieldStatesValidations,
    },
  );

  /** Debug form accessor for debugger component */
  readonly debugFormState = () => asDebuggerForm(this.form);

  /**
   * Mark all fields as touched programmatically
   * Use case: "Validate All" button, show all errors on submit
   */
  protected markAllTouched(): void {
    this.form.markAsTouchedEmail();
    this.form.markAsTouchedUsername();
    this.form.markAsTouchedPassword();
  }

  /**
   * Mark all fields as dirty programmatically
   * Use case: After loading data from server, mark pre-filled fields
   */
  protected markAllDirty(): void {
    this.form.markAsDirtyEmail();
    this.form.markAsDirtyUsername();
    this.form.markAsDirtyPassword();
  }

  /**
   * Simulate loading data from server and marking as dirty
   * Use case: Edit form - load existing data and mark as modified
   */
  protected prefillForm(): void {
    // Simulate server data - set values directly on model
    this.form.model.update((current) => ({
      ...current,
      email: 'user@example.com',
      username: 'johndoe',
      password: 'securepass123',
    }));

    // Validate the form
    this.form.validate();

    // Mark all fields as dirty (simulate pre-filled edit form)
    this.markAllDirty();
  }

  /**
   * Reset form to initial state
   */
  protected resetForm(): void {
    this.form.reset();
  }

  /**
   * Handle form submission
   *
   * Note: No need for event.preventDefault() - handled automatically by [ngxVestForm] directive
   */
  protected async save(): Promise<void> {
    const result = await this.form.submit();
    if (result.valid) {
      console.log('✅ Form submitted successfully!', result.data);
      alert('Form submitted! Check console for data.');
    }
  }

  ngOnDestroy(): void {
    this.form.dispose();
  }
}
