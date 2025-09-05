import {
  ChangeDetectionStrategy,
  Component,
  isDevMode,
  signal,
} from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, only, staticSuite, test } from 'vest';
import { DevelopmentPanelComponent } from '../../projects/examples/src/app/ui/dev-panel/dev-panel.component';

/**
 * Field States Example - Foundation Level
 *
 * This example demonstrates how to access and display field states in ngx-vest-forms
 * without using automated wrapper components. It showcases the visual feedback
 * patterns that developers need to understand for custom UI implementations.
 *
 * Key Learning Objectives:
 * - Understanding field states (touched, dirty, pending, valid, invalid)
 * - Accessing form control state through template reference variables
 * - Visual state indicators and styling patterns
 * - Real-time state feedback for user experience
 * - Custom state-based CSS classes and styling
 *
 * Features Demonstrated:
 * - Field state visualization (touched, dirty, pending, valid)
 * - Custom CSS classes based on field states
 * - State-based icons and visual indicators
 * - Real-time validation feedback
 * - Form-level state aggregation
 * - Accessibility considerations for state communication
 */

type UserProfileModel = {
  username: string;
  email: string;
  fullName: string;
  bio: string;
  website: string;
};

type FormControl = {
  touched?: boolean | null;
  dirty?: boolean | null;
  value?: string;
};

type FormElement = {
  touched?: boolean | null;
  dirty?: boolean | null;
  controls?: Record<string, FormControl & { markAsTouched: () => void }>;
  resetForm?: () => void;
};

// Validation suite with different validation timings for demonstration
export const fieldStatesValidationSuite = staticSuite(
  (data: Partial<UserProfileModel> = {}, field?: string) => {
    only(field);

    // Username - immediate validation
    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });

    test('username', 'Username must be at least 3 characters', () => {
      enforce(data.username).longerThanOrEquals(3);
    });

    test(
      'username',
      'Username must be alphanumeric with underscores only',
      () => {
        enforce(data.username).matches(/^[a-zA-Z0-9_]+$/);
      },
    );

    // Email - format validation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email address', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // Full Name - simple validation
    test('fullName', 'Full name is required', () => {
      enforce(data.fullName).isNotEmpty();
    });

    test('fullName', 'Full name must be at least 2 characters', () => {
      enforce(data.fullName).longerThanOrEquals(2);
    });

    // Bio - optional with length validation
    if (data.bio && data.bio.length > 0) {
      test('bio', 'Bio must be at least 10 characters if provided', () => {
        enforce(data.bio).longerThanOrEquals(10);
      });

      test('bio', 'Bio must be less than 200 characters', () => {
        enforce(data.bio).shorterThanOrEquals(200);
      });
    }

    // Website - optional URL validation
    if (data.website && data.website.length > 0) {
      test('website', 'Please enter a valid URL', () => {
        enforce(data.website).matches(/^https?:\/\/.+\..+/);
      });
    }
  },
);

@Component({
  selector: 'ngx-field-states',
  imports: [ngxVestForms, DevelopmentPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'ngx-form-surface-flat form-surface-flat form-surface-flat-full surface-gradient-border',
  },
  template: `
    <div class="container-readable stack-lg">
      <h1 class="heading-accent text-xl font-semibold">Field States</h1>

      <section class="page-section" aria-labelledby="objectives-heading">
        <h2 id="objectives-heading" class="section-header">
          Learning Objectives
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm">
          <li>Understanding field states (touched, dirty, pending, valid)</li>
          <li>Accessing form control state via template refs</li>
          <li>Visual indicators & icons for state transitions</li>
          <li>Real-time validation feedback patterns</li>
          <li>Accessible state communication (aria attributes)</li>
        </ul>
      </section>

      <div class="page-grid">
        <!-- Form Section -->
        <section aria-labelledby="interactive-form-heading" class="stack-md">
          <h2 id="interactive-form-heading" class="section-header">
            Interactive Form
          </h2>
          <form
            ngxVestForm
            [vestSuite]="suite"
            [(formValue)]="model"
            #vestForm="ngxVestForm"
            #formElement="ngForm"
            novalidate
            class="stack-md"
          >
            <!-- Username Field -->
            <div class="nv-field" [attr.data-name]="'username'">
              <label for="username">Username *</label>
              <small class="text-foreground/60 mb-1 text-xs"
                >Try typing to see states change</small
              >
              <div class="relative flex items-center">
                <input
                  id="username"
                  name="username"
                  type="text"
                  [ngModel]="model().username"
                  [class]="
                    getFieldClasses('username', usernameControl) + ' nv-input'
                  "
                  placeholder="Enter username"
                  aria-describedby="username-error username-state"
                  #usernameControl="ngModel"
                />
                <div class="absolute inset-y-0 right-2 flex items-center">
                  @if (getFieldIcon('username', usernameControl); as icon) {
                    <span
                      [class]="icon.class"
                      [title]="icon.title"
                      aria-hidden="true"
                    >
                      {{ icon.symbol }}
                    </span>
                  }
                </div>
              </div>

              <!-- Error Messages -->
              @if (vestForm.formState().errors['username']) {
                <div
                  id="username-error"
                  class="text-sm text-red-600"
                  role="alert"
                >
                  @for (
                    error of vestForm.formState().errors['username'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }

              <!-- State Information -->
              <div id="username-state" class="text-xs text-gray-500">
                {{ getFieldStateText('username', usernameControl) }}
              </div>
            </div>

            <!-- Email Field -->
            <div class="nv-field" [attr.data-name]="'email'">
              <label for="email">Email Address *</label>
              <div class="relative flex items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  [ngModel]="model().email"
                  [class]="getFieldClasses('email', emailControl) + ' nv-input'"
                  placeholder="Enter email address"
                  aria-describedby="email-error email-state"
                  #emailControl="ngModel"
                />
                <div class="absolute inset-y-0 right-2 flex items-center">
                  @if (getFieldIcon('email', emailControl); as icon) {
                    <span
                      [class]="icon.class"
                      [title]="icon.title"
                      aria-hidden="true"
                    >
                      {{ icon.symbol }}
                    </span>
                  }
                </div>
              </div>

              @if (vestForm.formState().errors['email']) {
                <div id="email-error" class="text-sm text-red-600" role="alert">
                  @for (
                    error of vestForm.formState().errors['email'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }

              <div id="email-state" class="text-xs text-gray-500">
                {{ getFieldStateText('email', emailControl) }}
              </div>
            </div>

            <!-- Full Name Field -->
            <div class="nv-field" [attr.data-name]="'fullName'">
              <label for="fullName">Full Name *</label>
              <div class="relative flex items-center">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  [ngModel]="model().fullName"
                  [class]="
                    getFieldClasses('fullName', fullNameControl) + ' nv-input'
                  "
                  placeholder="Enter your full name"
                  aria-describedby="fullName-error fullName-state"
                  #fullNameControl="ngModel"
                />
                <div class="absolute inset-y-0 right-2 flex items-center">
                  @if (getFieldIcon('fullName', fullNameControl); as icon) {
                    <span
                      [class]="icon.class"
                      [title]="icon.title"
                      aria-hidden="true"
                    >
                      {{ icon.symbol }}
                    </span>
                  }
                </div>
              </div>

              @if (vestForm.formState().errors['fullName']) {
                <div
                  id="fullName-error"
                  class="text-sm text-red-600"
                  role="alert"
                >
                  @for (
                    error of vestForm.formState().errors['fullName'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }

              <div id="fullName-state" class="text-xs text-gray-500">
                {{ getFieldStateText('fullName', fullNameControl) }}
              </div>
            </div>

            <!-- Bio Field (Optional) -->
            <div class="nv-field" [attr.data-name]="'bio'">
              <label for="bio"
                >Bio
                <span class="text-foreground/50 text-xs font-normal"
                  >(Optional)</span
                ></label
              >
              <div class="relative">
                <textarea
                  id="bio"
                  name="bio"
                  [ngModel]="model().bio"
                  [class]="getFieldClasses('bio', bioControl) + ' nv-input'"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  aria-describedby="bio-error bio-state"
                  #bioControl="ngModel"
                ></textarea>
                <div class="absolute top-2 right-2">
                  @if (getFieldIcon('bio', bioControl); as icon) {
                    <span
                      [class]="icon.class"
                      [title]="icon.title"
                      aria-hidden="true"
                    >
                      {{ icon.symbol }}
                    </span>
                  }
                </div>
              </div>

              @if (vestForm.formState().errors['bio']) {
                <div id="bio-error" class="text-sm text-red-600" role="alert">
                  @for (
                    error of vestForm.formState().errors['bio'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }

              <div id="bio-state" class="text-xs text-gray-500">
                {{ getFieldStateText('bio', bioControl) }}
                @if (model().bio) {
                  • Characters: {{ model().bio.length }}/200
                }
              </div>
            </div>

            <!-- Website Field (Optional) -->
            <div class="nv-field" [attr.data-name]="'website'">
              <label for="website"
                >Website
                <span class="text-foreground/50 text-xs font-normal"
                  >(Optional)</span
                ></label
              >
              <div class="relative flex items-center">
                <input
                  id="website"
                  name="website"
                  type="url"
                  [ngModel]="model().website"
                  [class]="
                    getFieldClasses('website', websiteControl) + ' nv-input'
                  "
                  placeholder="https://example.com"
                  aria-describedby="website-error website-state"
                  #websiteControl="ngModel"
                />
                <div class="absolute inset-y-0 right-2 flex items-center">
                  @if (getFieldIcon('website', websiteControl); as icon) {
                    <span
                      [class]="icon.class"
                      [title]="icon.title"
                      aria-hidden="true"
                    >
                      {{ icon.symbol }}
                    </span>
                  }
                </div>
              </div>

              @if (vestForm.formState().errors['website']) {
                <div
                  id="website-error"
                  class="text-sm text-red-600"
                  role="alert"
                >
                  @for (
                    error of vestForm.formState().errors['website'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }

              <div id="website-state" class="text-xs text-gray-500">
                {{ getFieldStateText('website', websiteControl) }}
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                (click)="resetForm(formElement)"
                class="btn-outline"
              >
                Reset
              </button>
              <button
                type="button"
                (click)="markAllTouched(formElement)"
                class="nv-btn"
              >
                Mark All Touched
              </button>
            </div>
          </form>
        </section>

        <!-- State Information Panel -->
        <section aria-labelledby="live-state-heading" class="stack-md">
          <h2 id="live-state-heading" class="section-header">
            Live State Information
          </h2>
          <div class="surface-flat stack-md">
            <h3
              class="text-foreground/60 text-xs font-semibold tracking-wide uppercase"
            >
              Form States
            </h3>
            <ul class="grid grid-cols-2 gap-2 text-xs">
              <li class="flex items-center justify-between">
                <span>Valid</span>
                <span
                  class="state-badge"
                  [class]="
                    vestForm.formState().valid
                      ? 'text-green-600'
                      : 'text-red-600'
                  "
                  >{{ vestForm.formState().valid }}</span
                >
              </li>
              <li class="flex items-center justify-between">
                <span>Pending</span>
                <span
                  class="state-badge"
                  [class]="
                    vestForm.formState().pending
                      ? 'text-yellow-600'
                      : 'text-foreground/60'
                  "
                  >{{ vestForm.formState().pending }}</span
                >
              </li>
              <li class="flex items-center justify-between">
                <span>Touched</span>
                <span
                  class="state-badge"
                  [class]="
                    formElement.touched ? 'text-blue-600' : 'text-foreground/60'
                  "
                  >{{ formElement.touched }}</span
                >
              </li>
              <li class="flex items-center justify-between">
                <span>Dirty</span>
                <span
                  class="state-badge"
                  [class]="
                    formElement.dirty ? 'text-purple-600' : 'text-foreground/60'
                  "
                  >{{ formElement.dirty }}</span
                >
              </li>
            </ul>
          </div>

          @if (showDebugInfo()) {
            <ngx-dev-panel
              [state]="vestForm.formState()"
              title="Form State JSON"
            />
          }

          <div class="surface-flat stack-md">
            <h3
              class="text-foreground/60 text-xs font-semibold tracking-wide uppercase"
            >
              State Legend
            </h3>
            <ul class="space-y-1 text-xs">
              <li><strong>Touched:</strong> focused & blurred</li>
              <li><strong>Dirty:</strong> value differs from initial</li>
              <li><strong>Valid:</strong> passes all tests</li>
              <li><strong>Pending:</strong> async test running</li>
              <li><strong>Invalid:</strong> has one or more errors</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class FieldStatesComponent {
  protected readonly model = signal<UserProfileModel>({
    username: '',
    email: '',
    fullName: '',
    bio: '',
    website: '',
  });

  protected readonly suite = fieldStatesValidationSuite;

  /**
   * Determines if debug information should be shown
   */
  protected showDebugInfo(): boolean {
    return isDevMode();
  }

  /**
   * Gets CSS classes for input fields based on their state
   */
  protected getFieldClasses(fieldName: string, control: FormControl): string {
    const hasError = this.hasFieldError();
    const isValid = control?.touched && !hasError;

    if (hasError && control?.touched) {
      return 'nv-input border-red-600';
    }
    if (isValid) {
      return 'nv-input border-green-600';
    }
    if (control?.dirty) {
      return 'nv-input';
    }
    if (control?.touched) {
      return 'nv-input';
    }
    return 'nv-input';
  }

  /**
   * Gets icon information for field state visualization
   */
  protected getFieldIcon(
    fieldName: string,
    control: FormControl,
  ): { symbol: string; class: string; title: string } | null {
    const hasError = this.hasFieldError();
    const isValid = control?.touched && !hasError;

    if (hasError && control?.touched) {
      return {
        symbol: '✕',
        class: 'text-red-500',
        title: 'Field has errors',
      };
    }

    if (isValid) {
      return {
        symbol: '✓',
        class: 'text-green-500',
        title: 'Field is valid',
      };
    }

    if (control?.dirty) {
      return {
        symbol: '•',
        class: 'text-blue-500',
        title: 'Field has been modified',
      };
    }

    return null;
  }

  /**
   * Gets human-readable state text for a field
   */
  protected getFieldStateText(fieldName: string, control: FormControl): string {
    const states = [];
    const hasError = this.hasFieldError();

    if (control?.touched) states.push('Touched');
    if (control?.dirty) states.push('Dirty');
    if (control?.touched && !hasError) states.push('Valid');
    if (hasError && control?.touched) states.push('Invalid');

    if (states.length === 0) {
      return 'Pristine (not yet interacted with)';
    }

    return states.join(' • ');
  }

  /**
   * Checks if a field has validation errors
   */
  private hasFieldError(): boolean {
    // This is a simplified version - in a real implementation you'd access
    // the form state or use a service to get this information
    return false; // For now, we'll rely on template error checking
  }

  /**
   * Gets the error count for a field
   */
  protected getErrorCount(): number {
    // In a real implementation, this would access vestForm.formState().errors[fieldName]?.length
    return 0;
  }

  /**
   * Resets the form to initial state
   */
  protected resetForm(formElement: FormElement): void {
    this.model.set({
      username: '',
      email: '',
      fullName: '',
      bio: '',
      website: '',
    });

    formElement.resetForm?.();

    if (isDevMode()) {
      console.log('Form reset to initial state');
    }
  }

  /**
   * Marks all form controls as touched for demonstration
   */
  protected markAllTouched(formElement: FormElement): void {
    if (formElement.controls) {
      for (const key of Object.keys(formElement.controls)) {
        formElement.controls[key].markAsTouched();
      }
    }

    if (isDevMode()) {
      console.log('All form controls marked as touched');
    }
  }
}
