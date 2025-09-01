import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  ngxVestForms,
} from 'ngx-vest-forms/core';
import { createFocusFirstInvalidField } from '../../ui';
import {
  FormStateDemoModel,
  formStateDemoValidationSuite,
} from './form-state-demo.validations';

/**
 * Form State Demo Component
 *
 * Demonstrates comprehensive form state management with ngx-vest-forms.
 * This component showcases all aspects of the NgxFormState interface
 * with real-time monitoring and interactive state visualization.
 */
@Component({
  selector: 'ngx-form-state-demo-form',
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Form Section -->
      <div class="min-w-0">
        <form
          ngxVestForm
          [vestSuite]="suite"
          [(formValue)]="model"
          #vestForm="ngxVestForm"
          (ngSubmit)="onSubmit()"
          class="form-container"
          aria-labelledby="formStateDemoHeading"
        >
          <!-- Username Field with Async Validation -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #usernameDisplay="formErrorDisplay"
          >
            <label class="form-label" for="username">
              Username *
              @if (vestForm.formState().pending && isFieldPending()) {
                <span
                  class="ml-2 text-xs text-yellow-600 dark:text-yellow-400"
                  aria-label="Checking availability"
                >
                  ⏳ Checking...
                </span>
              }
            </label>
            <input
              class="form-input"
              id="username"
              name="username"
              type="text"
              [ngModel]="model().username"
              placeholder="Enter a unique username"
              aria-required="true"
              [attr.aria-invalid]="usernameDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                usernameDisplay.shouldShowErrors() ? 'username-errors' : null
              "
            />
            @if (usernameDisplay.shouldShowErrors()) {
              <ul id="username-errors" class="form-error" role="alert">
                @for (error of usernameDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Email Field -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #emailDisplay="formErrorDisplay"
          >
            <label class="form-label" for="email">Email Address *</label>
            <input
              class="form-input"
              id="email"
              name="email"
              type="email"
              [ngModel]="model().email"
              placeholder="your.email@example.com"
              aria-required="true"
              [attr.aria-invalid]="emailDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                emailDisplay.shouldShowErrors() ? 'email-errors' : null
              "
            />
            @if (emailDisplay.shouldShowErrors()) {
              <ul id="email-errors" class="form-error" role="alert">
                @for (error of emailDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Password Field -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #passwordDisplay="formErrorDisplay"
          >
            <label class="form-label" for="password">Password *</label>
            <input
              class="form-input"
              id="password"
              name="password"
              type="password"
              [ngModel]="model().password"
              placeholder="Create a strong password"
              aria-required="true"
              [attr.aria-invalid]="passwordDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                passwordDisplay.shouldShowErrors() ? 'password-errors' : null
              "
            />
            @if (passwordDisplay.shouldShowErrors()) {
              <ul id="password-errors" class="form-error" role="alert">
                @for (error of passwordDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Confirm Password Field -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #confirmPasswordDisplay="formErrorDisplay"
          >
            <label class="form-label" for="confirmPassword"
              >Confirm Password *</label
            >
            <input
              class="form-input"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              [ngModel]="model().confirmPassword"
              placeholder="Repeat your password"
              aria-required="true"
              [attr.aria-invalid]="confirmPasswordDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                confirmPasswordDisplay.shouldShowErrors()
                  ? 'confirm-password-errors'
                  : null
              "
            />
            @if (confirmPasswordDisplay.shouldShowErrors()) {
              <ul id="confirm-password-errors" class="form-error" role="alert">
                @for (error of confirmPasswordDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Age Field -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #ageDisplay="formErrorDisplay"
          >
            <label class="form-label" for="age">Age *</label>
            <input
              class="form-input"
              id="age"
              name="age"
              type="number"
              [ngModel]="model().age"
              placeholder="Your age"
              aria-required="true"
              [attr.aria-invalid]="ageDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                ageDisplay.shouldShowErrors() ? 'age-errors' : null
              "
            />
            @if (ageDisplay.shouldShowErrors()) {
              <ul id="age-errors" class="form-error" role="alert">
                @for (error of ageDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Preferences Field -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #preferencesDisplay="formErrorDisplay"
          >
            <label class="form-label" for="preferences"
              >Notification Preferences *</label
            >
            <select
              class="form-select"
              id="preferences"
              name="preferences"
              [ngModel]="model().preferences"
              aria-required="true"
              [attr.aria-invalid]="preferencesDisplay.shouldShowErrors()"
              [attr.aria-describedby]="
                preferencesDisplay.shouldShowErrors()
                  ? 'preferences-errors'
                  : null
              "
            >
              <option value="">Choose your preference</option>
              <option value="minimal">Minimal notifications</option>
              <option value="balanced">Balanced notifications</option>
              <option value="comprehensive">All notifications</option>
            </select>
            @if (preferencesDisplay.shouldShowErrors()) {
              <ul id="preferences-errors" class="form-error" role="alert">
                @for (error of preferencesDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Newsletter Checkbox -->
          <div
            class="form-field"
            ngxFormErrorDisplay
            #newsletterDisplay="formErrorDisplay"
          >
            <label class="form-checkbox-label" for="newsletter">
              <input
                class="form-checkbox"
                id="newsletter"
                name="newsletter"
                type="checkbox"
                [ngModel]="model().newsletter"
                [attr.aria-invalid]="newsletterDisplay.shouldShowErrors()"
                [attr.aria-describedby]="
                  newsletterDisplay.shouldShowErrors()
                    ? 'newsletter-errors'
                    : null
                "
              />
              Subscribe to newsletter
            </label>
            @if (newsletterDisplay.shouldShowErrors()) {
              <ul id="newsletter-errors" class="form-error" role="alert">
                @for (error of newsletterDisplay.errors(); track error) {
                  <li>{{ error }}</li>
                }
              </ul>
            }
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn-primary"
              aria-describedby="form-state-info"
            >
              @if (vestForm.formState().pending) {
                ⏳ Validating...
              } @else {
                Submit Form
              }
            </button>
            <button type="button" class="btn-secondary" (click)="onReset()">
              Reset Form
            </button>
          </div>
        </form>
      </div>

      <!-- Real-time State Monitor Panel -->
      <div class="min-w-0">
        <div
          class="sticky top-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            🔍 Real-time Form State
          </h3>

          <!-- Core State Properties -->
          <div class="mb-6 border-b border-gray-200 pb-4 dark:border-gray-600">
            <h4
              class="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
            >
              Core State
            </h4>
            <div class="space-y-2">
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Valid:</span
                >
                <span
                  class="font-mono font-semibold"
                  [class.text-green-600]="formState().valid"
                  [class.dark:text-green-400]="formState().valid"
                  [class.text-gray-500]="!formState().valid"
                  [class.dark:text-gray-400]="!formState().valid"
                >
                  {{ formState().valid ? '✅' : '❌' }} {{ formState().valid }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Invalid:</span
                >
                <span
                  class="font-mono font-semibold"
                  [class.text-red-600]="formState().invalid"
                  [class.dark:text-red-400]="formState().invalid"
                  [class.text-gray-500]="!formState().invalid"
                  [class.dark:text-gray-400]="!formState().invalid"
                >
                  {{ formState().invalid ? '❌' : '✅' }}
                  {{ formState().invalid }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Pending:</span
                >
                <span
                  class="font-mono font-semibold"
                  [class.text-yellow-600]="formState().pending"
                  [class.dark:text-yellow-400]="formState().pending"
                  [class.text-gray-500]="!formState().pending"
                  [class.dark:text-gray-400]="!formState().pending"
                >
                  {{ formState().pending ? '⏳' : '✅' }}
                  {{ formState().pending }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Status:</span
                >
                <span
                  class="rounded px-2 py-1 text-xs font-semibold uppercase"
                  [class.bg-green-100]="formState().status === 'VALID'"
                  [class.text-green-800]="formState().status === 'VALID'"
                  [class.dark:bg-green-900]="formState().status === 'VALID'"
                  [class.dark:text-green-200]="formState().status === 'VALID'"
                  [class.bg-red-100]="formState().status === 'INVALID'"
                  [class.text-red-800]="formState().status === 'INVALID'"
                  [class.dark:bg-red-900]="formState().status === 'INVALID'"
                  [class.dark:text-red-200]="formState().status === 'INVALID'"
                  [class.bg-yellow-100]="formState().status === 'PENDING'"
                  [class.text-yellow-800]="formState().status === 'PENDING'"
                  [class.dark:bg-yellow-900]="formState().status === 'PENDING'"
                  [class.dark:text-yellow-200]="
                    formState().status === 'PENDING'
                  "
                  [class.bg-gray-100]="formState().status === 'DISABLED'"
                  [class.text-gray-800]="formState().status === 'DISABLED'"
                  [class.dark:bg-gray-700]="formState().status === 'DISABLED'"
                  [class.dark:text-gray-200]="formState().status === 'DISABLED'"
                >
                  {{ formState().status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Interaction State -->
          <div class="mb-6 border-b border-gray-200 pb-4 dark:border-gray-600">
            <h4
              class="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
            >
              Interaction State
            </h4>
            <div class="space-y-2">
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Dirty:</span
                >
                <span
                  class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >
                  {{ formState().dirty ? '📝' : '✨' }} {{ formState().dirty }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Submitted:</span
                >
                <span
                  class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >
                  {{ formState().submitted ? '📤' : '📝' }}
                  {{ formState().submitted }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Disabled:</span
                >
                <span
                  class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >
                  {{ formState().disabled ? '🚫' : '✅' }}
                  {{ formState().disabled }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Idle:</span
                >
                <span
                  class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >
                  {{ formState().idle ? '😴' : '⚡' }} {{ formState().idle }}
                </span>
              </div>
            </div>
          </div>

          <!-- Error & Warning Counts -->
          <div class="mb-6 border-b border-gray-200 pb-4 dark:border-gray-600">
            <h4
              class="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
            >
              Error Tracking
            </h4>
            <div class="space-y-2">
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Error Count:</span
                >
                <span
                  class="font-mono font-semibold text-red-600 dark:text-red-400"
                >
                  {{ formState().errorCount }} errors
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >Warning Count:</span
                >
                <span
                  class="font-mono font-semibold text-yellow-600 dark:text-yellow-400"
                >
                  {{ formState().warningCount }} warnings
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
              >
                <span
                  class="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >First Invalid:</span
                >
                <span
                  class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >
                  {{ formState().firstInvalidField }}
                </span>
              </div>
            </div>
          </div>

          <!-- Current Errors -->
          <div class="mb-6 border-b border-gray-200 pb-4 dark:border-gray-600">
            <h4
              class="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
            >
              Current Errors
            </h4>
            <div
              class="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-700"
            >
              @if (errorEntries().length === 0) {
                <p class="text-sm text-gray-500 italic dark:text-gray-400">
                  No errors
                </p>
              } @else {
                @for (entry of errorEntries(); track entry.field) {
                  <div class="mb-2 last:mb-0">
                    <strong
                      class="text-xs tracking-wide text-red-600 uppercase dark:text-red-400"
                      >{{ entry.field }}:</strong
                    >
                    <ul class="mt-1 space-y-1">
                      @for (error of entry.errors; track error) {
                        <li class="pl-2 text-xs text-red-600 dark:text-red-400">
                          {{ error }}
                        </li>
                      }
                    </ul>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Performance Metrics -->
          <div>
            <h4
              class="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300"
            >
              Performance
            </h4>
            <div
              class="flex items-center justify-between rounded-md bg-gray-50 p-3 dark:bg-gray-700"
            >
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300"
                >Last Validation:</span
              >
              <span
                class="font-mono font-semibold text-gray-700 dark:text-gray-300"
                >{{ lastValidationTime() }}ms</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FormStateDemoFormComponent {
  /** Focus utility for better testability and Angular best practices */
  private readonly focusFirstInvalidField = createFocusFirstInvalidField();

  /** Form model signal */
  protected readonly model = signal<FormStateDemoModel>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 0,
    preferences: '',
    newsletter: false,
  });

  /** Validation suite */
  protected readonly suite = formStateDemoValidationSuite;

  /** Form reference for state access */
  protected readonly vestForm =
    viewChild.required<NgxFormDirective>('vestForm');

  /** Performance tracking */
  private readonly validationStartTime = signal<number>(0);
  protected readonly lastValidationTime = signal<number>(0);

  /** Computed form state accessor */
  readonly formState = computed(() => this.vestForm().formState());

  /** Computed error entries for display */
  protected readonly errorEntries = computed(() => {
    const errors = this.formState().errors;
    return Object.entries(errors).map(([field, fieldErrors]) => ({
      field,
      errors: fieldErrors || [],
    }));
  });

  constructor() {
    // Track validation performance
    effect(() => {
      const pending = this.formState().pending;
      if (pending && this.validationStartTime() === 0) {
        this.validationStartTime.set(performance.now());
      } else if (!pending && this.validationStartTime() > 0) {
        const endTime = performance.now();
        const duration = Math.round(endTime - this.validationStartTime());
        this.lastValidationTime.set(duration);
        this.validationStartTime.set(0);
      }
    });
  }

  /** Check if a specific field is currently pending validation */
  protected isFieldPending(): boolean {
    // This is a simplified check - in a real implementation, you might want
    // more granular pending state tracking per field
    return this.formState().pending;
  }

  /** Handle form submission */
  protected onSubmit(): void {
    const formState = this.formState();

    if (formState.valid) {
      console.log('✅ Form submitted successfully!', formState.value);
      alert('Form submitted successfully! Check the console for details.');
    } else {
      console.log('❌ Form has validation errors:', formState.errors);

      // Focus the first invalid field for better accessibility
      this.focusFirstInvalidField(formState.errors);

      // Provide user feedback
      alert(
        'Please fix validation errors before submitting. Focus has been moved to the first invalid field.',
      );
    }
  }

  /** Handle form reset */
  protected onReset(): void {
    this.model.set({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      age: 0,
      preferences: '',
      newsletter: false,
    });
    console.log('🔄 Form reset');
  }
}
