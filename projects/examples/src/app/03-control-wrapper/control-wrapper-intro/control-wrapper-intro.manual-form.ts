import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxErrorDisplayMode,
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  ngxVestForms,
} from 'ngx-vest-forms/core';
import {
  ControlWrapperIntroFormModel,
  controlWrapperIntroValidationSuite,
} from './control-wrapper-intro.validations';

/**
 * Manual Error Display Form Component
 *
 * Demonstrates the traditional manual approach to error handling using ngxFormErrorDisplay.
 * This enhanced component shows the complexity required to manually implement:
 * - Async validation states (spinner, aria-busy, pending messages)
 * - Warning system (role="status", yellow styling)
 * - Error display mode configuration
 * - Accessibility attributes (aria-invalid, aria-describedby, role attributes)
 *
 * Compare this complexity with NgxControlWrapper's automatic approach!
 */
@Component({
  selector: 'ngx-control-wrapper-intro-manual-form',
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
      aria-labelledby="manualFormHeading"
    >
      <div class="form-header">
        <h3 id="manualFormHeading" class="form-title">
          Enhanced Registration Form
        </h3>
        <p class="form-description">
          Manual error display - see the complexity required!
        </p>
      </div>

      <!-- Error Display Mode Configuration (Manual Implementation) -->
      <div
        class="config-section mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
      >
        <h4 class="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          🎛️ Error Display Mode (Manual Setup Required)
        </h4>
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="manualErrorDisplayMode"
              value="on-blur"
              [(ngModel)]="errorDisplayMode"
              class="form-radio"
            />
            <span class="text-sm">On Blur</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="manualErrorDisplayMode"
              value="on-submit"
              [(ngModel)]="errorDisplayMode"
              class="form-radio"
            />
            <span class="text-sm">On Submit</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="manualErrorDisplayMode"
              value="on-blur-or-submit"
              [(ngModel)]="errorDisplayMode"
              class="form-radio"
            />
            <span class="text-sm">On Blur or Submit</span>
          </label>
        </div>
      </div>

      <!-- Username Field with Manual Async State Handling -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        [errorDisplayMode]="errorDisplayMode()"
        #usernameDisplay="formErrorDisplay"
      >
        <label class="form-label" for="manual-username">
          Username *
          @if (formState().pending) {
            <span class="ml-2 text-xs text-blue-500" aria-live="polite">
              🔄 Checking availability...
            </span>
          }
        </label>
        <input
          class="form-input"
          id="manual-username"
          name="username"
          type="text"
          [ngModel]="model().username"
          placeholder="Enter unique username"
          [attr.aria-invalid]="
            usernameDisplay.shouldShowErrors() ? 'true' : null
          "
          [attr.aria-busy]="formState().pending ? 'true' : null"
          [attr.aria-describedby]="
            'manual-username-hint ' +
            (usernameDisplay.shouldShowErrors()
              ? 'manual-username-errors '
              : '') +
            (usernameDisplay.warnings().length
              ? 'manual-username-warnings'
              : '')
          "
          autocomplete="username"
        />
        <div class="form-hint" id="manual-username-hint">
          Username must be 3-20 characters (letters, numbers, underscore only).
          Taken usernames: admin, user, test, demo, john, jane
        </div>
        @if (
          usernameDisplay.shouldShowErrors() && usernameDisplay.errors().length
        ) {
          <div class="form-errors" id="manual-username-errors" role="alert">
            @for (error of usernameDisplay.errors(); track error) {
              <div class="form-error">{{ error }}</div>
            }
          </div>
        }
        <!-- Manual Warning Display Implementation -->
        @if (usernameDisplay.warnings().length) {
          <div
            class="form-warnings"
            id="manual-username-warnings"
            role="status"
          >
            @for (warning of usernameDisplay.warnings(); track warning) {
              <div class="form-warning text-yellow-600">⚠️ {{ warning }}</div>
            }
          </div>
        }
      </div>

      <!-- Email Field with Manual Warning System -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        [errorDisplayMode]="errorDisplayMode()"
        #emailDisplay="formErrorDisplay"
      >
        <label class="form-label" for="manual-email"> Email Address * </label>
        <input
          class="form-input"
          id="manual-email"
          name="email"
          type="email"
          [ngModel]="model().email"
          placeholder="you@example.com"
          [attr.aria-invalid]="emailDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'manual-email-hint ' +
            (emailDisplay.shouldShowErrors() ? 'manual-email-errors ' : '') +
            (emailDisplay.warnings().length ? 'manual-email-warnings' : '')
          "
          autocomplete="email"
        />
        <div class="form-hint" id="manual-email-hint">
          Try gmail.com, yahoo.com, or hotmail.com to see warning system
        </div>
        @if (emailDisplay.shouldShowErrors() && emailDisplay.errors().length) {
          <div class="form-errors" id="manual-email-errors" role="alert">
            @for (error of emailDisplay.errors(); track error) {
              <div class="form-error">{{ error }}</div>
            }
          </div>
        }
        <!-- Manual Warning Display - Complex Implementation -->
        @if (emailDisplay.warnings().length) {
          <div class="form-warnings" id="manual-email-warnings" role="status">
            @for (warning of emailDisplay.warnings(); track warning) {
              <div class="form-warning text-yellow-600">⚠️ {{ warning }}</div>
            }
          </div>
        }
      </div>

      <!-- Password Field with Manual Warning System -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        [errorDisplayMode]="errorDisplayMode()"
        #passwordDisplay="formErrorDisplay"
      >
        <label class="form-label" for="manual-password"> Password * </label>
        <input
          class="form-input"
          id="manual-password"
          name="password"
          type="password"
          [ngModel]="model().password"
          placeholder="Enter strong password"
          [attr.aria-invalid]="
            passwordDisplay.shouldShowErrors() ? 'true' : null
          "
          [attr.aria-describedby]="
            'manual-password-hint ' +
            (passwordDisplay.shouldShowErrors()
              ? 'manual-password-errors '
              : '') +
            (passwordDisplay.warnings().length
              ? 'manual-password-warnings'
              : '')
          "
          autocomplete="new-password"
        />
        <div class="form-hint" id="manual-password-hint">
          Password must be 8+ characters with uppercase, number. Try without
          special chars to see warnings.
        </div>
        @if (
          passwordDisplay.shouldShowErrors() && passwordDisplay.errors().length
        ) {
          <div class="form-errors" id="manual-password-errors" role="alert">
            @for (error of passwordDisplay.errors(); track error) {
              <div class="form-error">{{ error }}</div>
            }
          </div>
        }
        <!-- Manual Warning Display - Notice the Repetition -->
        @if (passwordDisplay.warnings().length) {
          <div
            class="form-warnings"
            id="manual-password-warnings"
            role="status"
          >
            @for (warning of passwordDisplay.warnings(); track warning) {
              <div class="form-warning text-yellow-600">⚠️ {{ warning }}</div>
            }
          </div>
        }
      </div>

      <!-- Phone Field -->
      <div
        class="form-field"
        ngxFormErrorDisplay
        [errorDisplayMode]="errorDisplayMode()"
        #phoneDisplay="formErrorDisplay"
      >
        <label class="form-label" for="manual-phone"> Phone Number * </label>
        <input
          class="form-input"
          id="manual-phone"
          name="phone"
          type="tel"
          [ngModel]="model().phone"
          placeholder="123-456-7890"
          [attr.aria-invalid]="phoneDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            'manual-phone-hint ' +
            (phoneDisplay.shouldShowErrors() ? 'manual-phone-errors' : '')
          "
          autocomplete="tel"
        />
        <div class="form-hint" id="manual-phone-hint">
          Enter phone number in format: 123-456-7890
        </div>
        @if (phoneDisplay.shouldShowErrors() && phoneDisplay.errors().length) {
          <div class="form-errors" id="manual-phone-errors" role="alert">
            @for (error of phoneDisplay.errors(); track error) {
              <div class="form-error">{{ error }}</div>
            }
          </div>
        }
      </div>

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

      <!-- Manual Implementation Code Example -->
      <details class="code-example">
        <summary class="code-example-title">
          😰 Manual Implementation Complexity
        </summary>
        <div class="code-example-content">
          <p class="code-example-description">
            See how much code is needed for manual error handling:
          </p>
          <pre class="shiki-code-block">{{ manualCodeExample }}</pre>
          <div class="code-drawbacks">
            <h4 class="benefits-title">😭 Manual Approach Drawbacks:</h4>
            <ul class="benefits-list">
              <li>🔄 Repetitive error display logic for each field</li>
              <li>🐛 Easy to forget accessibility attributes</li>
              <li>📝 Verbose template code</li>
              <li>🎨 Inconsistent error styling across forms</li>
              <li>⚠️ Manual warning system implementation</li>
              <li>⏳ Complex async state management</li>
              <li>🛠️ High maintenance overhead</li>
            </ul>
          </div>
        </div>
      </details>
    </form>
  `,
})
export class ControlWrapperIntroManualFormComponent {
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
  protected readonly submitButtonId = 'manual-submit-status';

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

  protected readonly manualCodeExample = `<!-- Manual async validation state (complex!) -->
<div ngxFormErrorDisplay #display="formErrorDisplay"
     [errorDisplayMode]="errorDisplayMode()">
  <label for="username">
    Username *
    @if (formState().pending) {
      <span class="text-blue-500 text-xs ml-2">🔄 Checking...</span>
    }
  </label>
  <input
    id="username"
    name="username"
    [ngModel]="model().username"
    [attr.aria-invalid]="display.shouldShowErrors() ? 'true' : null"
    [attr.aria-busy]="formState().pending ? 'true' : null"
    [attr.aria-describedby]="display.shouldShowErrors() ?
      'username-errors' : 'username-hint'"
  />

  <!-- Manual error display -->
  @if (display.shouldShowErrors() && display.errors().length) {
    <div id="username-errors" role="alert">
      @for (error of display.errors(); track error) {
        <div class="text-red-600">{{ error }}</div>
      }
    </div>
  }

  <!-- Manual warning display -->
  @if (display.warnings && display.warnings().length) {
    <div role="status">
      @for (warning of display.warnings(); track warning) {
        <div class="text-yellow-600">{{ warning }}</div>
      }
    </div>
  }
</div>

<!-- Compare this complexity with NgxControlWrapper! -->`;

  protected onSubmit() {
    this.submitAttempted.set(true);
    if (this.formState().valid) {
      this.submitted.set(true);
      console.log('Manual registration submitted:', this.model());
    }
  }
}
