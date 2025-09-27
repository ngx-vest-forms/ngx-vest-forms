import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import {
  NgxErrorDisplayMode,
  NgxFormDirective,
  ngxVestForms,
} from 'ngx-vest-forms/core';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import {
  ControlWrapperIntroFormModel,
  controlWrapperIntroValidationSuite,
} from './control-wrapper-intro.validations';

/**
 * NgxControlWrapper Form Component
 *
 * Demonstrates the automated approach to error handling using NgxControlWrapper.
 * This enhanced component showcases ALL NgxControlWrapper capabilities:
 * - Async validation with pending states (username availability)
 * - Warning system (email provider, password strength)
 * - Error display mode configuration (on-blur, on-submit, on-blur-or-submit)
 * - Accessibility features (aria-busy, role="alert", role="status")
 * - Superior UX compared to manual error handling
 */
@Component({
  selector: 'ngx-control-wrapper-intro-wrapper-form',
  imports: [ngxVestForms, NgxControlWrapper, ErrorDisplayModeSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-8">
      <div class="mb-6 text-center">
        <h3 class="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <span
            class="mr-2 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Automated
          </span>
          NgxControlWrapper
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Complete form automation with
          <code class="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800"
            >&lt;ngx-control-wrapper&gt;</code
          >
          - no manual error handling required
        </p>
      </div>
    </div>

    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
      aria-labelledby="wrapperFormHeading"
    >
      <div class="form-header">
        <h3 id="wrapperFormHeading" class="form-title">
          Enhanced Registration Form
        </h3>
        <p class="form-description">
          NgxControlWrapper with async validation, warnings & error display
          modes
        </p>
      </div>

      <!-- Error Display Mode Configuration -->
      <ngx-error-display-mode-selector
        [selectedMode]="errorDisplayMode()"
        (modeChange)="onErrorDisplayModeChange($event)"
        class="mb-6"
      />

      <!-- Username Field with Async Validation -->
      <ngx-control-wrapper [errorDisplayMode]="errorDisplayMode()">
        <label class="form-label" for="wrapper-username">
          Username *
          @if (formState().pending) {
            <span class="ml-2 text-xs text-blue-500" aria-live="polite">
              🔄 Checking availability...
            </span>
          }
        </label>
        <input
          class="form-input"
          id="wrapper-username"
          name="username"
          type="text"
          [ngModel]="model().username"
          placeholder="Enter unique username"
          autocomplete="username"
        />
        <div class="form-hint">
          Username must be 3-20 characters (letters, numbers, underscore only).
          Taken usernames: admin, user, test, demo, john, jane
        </div>
      </ngx-control-wrapper>

      <!-- Email Field with Warning System -->
      <ngx-control-wrapper [errorDisplayMode]="errorDisplayMode()">
        <label class="form-label" for="wrapper-email"> Email Address * </label>
        <input
          class="form-input"
          id="wrapper-email"
          name="email"
          type="email"
          [ngModel]="model().email"
          placeholder="you@example.com"
          autocomplete="email"
        />
        <div class="form-hint">
          Try gmail.com, yahoo.com, or hotmail.com to see warning system
        </div>
      </ngx-control-wrapper>

      <!-- Password Field with Strength Warnings -->
      <ngx-control-wrapper [errorDisplayMode]="errorDisplayMode()">
        <label class="form-label" for="wrapper-password"> Password * </label>
        <input
          class="form-input"
          id="wrapper-password"
          name="password"
          type="password"
          [ngModel]="model().password"
          placeholder="Enter strong password"
          autocomplete="new-password"
        />
        <div class="form-hint">
          Password must be 8+ characters with uppercase, number. Try without
          special chars to see warnings.
        </div>
      </ngx-control-wrapper>

      <!-- Phone Field -->
      <ngx-control-wrapper [errorDisplayMode]="errorDisplayMode()">
        <label class="form-label" for="wrapper-phone"> Phone Number * </label>
        <input
          class="form-input"
          id="wrapper-phone"
          name="phone"
          type="tel"
          [ngModel]="model().phone"
          placeholder="123-456-7890"
          autocomplete="tel"
        />
        <div class="form-hint">Enter phone number in format: 123-456-7890</div>
      </ngx-control-wrapper>

      <!-- Submit Button -->
      <div class="form-actions">
        <button
          type="submit"
          class="form-submit"
          [disabled]="!formState().valid || formState().pending"
          [attr.aria-describedby]="submitButtonId"
        >
          @if (formState().pending) {
            <span class="submit-spinner" aria-hidden="true">⏳</span>
            Validating...
          } @else {
            Submit Registration
          }
        </button>
        <div class="submit-status" [id]="submitButtonId">
          @if (submitAttempted() && !formState().valid) {
            <span class="submit-error" role="alert">
              Please fix the errors above before submitting
            </span>
          }
          @if (submitted()) {
            <span class="submit-success" role="status">
              ✅ Registration submitted successfully!
            </span>
          }
        </div>
      </div>
    </form>
  `,
})
export class ControlWrapperIntroWrapperFormComponent {
  protected readonly suite = controlWrapperIntroValidationSuite;
  protected readonly model = signal<ControlWrapperIntroFormModel>({
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  // Error display mode configuration
  protected readonly errorDisplayMode = signal<NgxErrorDisplayMode>('on-blur');

  protected readonly submitted = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly submitButtonId = 'wrapper-submit-status';

  // Get form state reference
  protected readonly formRef = viewChild<NgxFormDirective>('vestForm');
  readonly formState = computed(
    () =>
      this.formRef()?.formState() ?? {
        valid: false,
        pending: false,
        errors: {},
        warnings: {},
      },
  );

  protected onSubmit() {
    this.submitAttempted.set(true);
    if (this.formState().valid) {
      this.submitted.set(true);
      console.log('Enhanced registration submitted:', this.model());
    }
  }

  protected onErrorDisplayModeChange(mode: NgxErrorDisplayMode): void {
    this.errorDisplayMode.set(mode);
  }
}
