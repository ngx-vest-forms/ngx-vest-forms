import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { CardComponent, ExampleCardsComponent } from '../../ui';
import { RULE_COMPOSITION_CONTENT } from './rule-composition.content';
import {
  SecuritySettingsModel,
  emailValidation,
  passwordValidation,
  securitySettingsValidationSuite,
} from './rule-composition.validations';

/**
 * Rule Composition Demo Component
 *
 * Demonstrates advanced Vest.js enforce rule composition patterns:
 *
 * 🚀 Features Demonstrated:
 * - Reusable validation rule libraries
 * - Composable validation patterns
 * - Custom validation factories
 * - Security-focused validation rules
 * - Cross-field validation with rule composition
 * - Type-safe validation rule chaining
 *
 * 📋 Rule Composition Patterns:
 * - Email validation composition (format + business rules)
 * - Password strength validation with configurable levels
 * - Phone number validation with country-specific patterns
 * - URL validation with security requirements
 * - Custom validation rule factories
 * - Validation rule combiners and builders
 *
 * 🎯 Advanced Concepts:
 * - ValidationComposer class for building complex rules
 * - Conditional validation with rule factories
 * - Async validation composition
 * - Cross-field validation patterns
 * - Centralized validation rule libraries
 */
@Component({
  selector: 'app-rule-composition',
  standalone: true,
  imports: [CommonModule, ngxVestForms, ExampleCardsComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Rule Composition Example with Educational Structure -->
    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <!-- Form Implementation -->
      <form
        ngxVestForm
        [vestSuite]="validationSuite"
        [(formValue)]="formData"
        #vestForm="ngxVestForm"
        (ngSubmit)="onSubmit()"
        class="space-y-6"
        novalidate
      >
        <!-- Password Management Section -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">
              🔐 Password Management
            </h3>
            <p class="text-sm text-gray-600">
              Advanced password validation with configurable strength levels
            </p>
          </div>

          <div class="space-y-4">
            <!-- Current Password -->
            <div>
              <label for="currentPassword" class="form-label">
                Current Password *
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                [ngModel]="formData().currentPassword"
                (ngModelChange)="updateField('currentPassword', $event)"
                class="form-input"
                placeholder="Enter current password"
              />
              @if (vestForm.formState().errors['currentPassword']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['currentPassword'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">
                💡 Try "current123" as the correct current password
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="form-label">
                New Password *
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                [ngModel]="formData().newPassword"
                (ngModelChange)="updateField('newPassword', $event)"
                class="form-input"
                placeholder="Enter new password"
              />
              @if (vestForm.formState().errors['newPassword']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['newPassword'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">
                🔐 Must be 10+ chars with uppercase, lowercase, and numbers
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="form-label">
                Confirm New Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                [ngModel]="formData().confirmPassword"
                (ngModelChange)="updateField('confirmPassword', $event)"
                class="form-input"
                placeholder="Confirm new password"
              />
              @if (vestForm.formState().errors['confirmPassword']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['confirmPassword'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
            </div>

            <!-- Password Strength Indicator -->
            <div class="rounded-lg bg-gray-50 p-4">
              <h4 class="mb-2 text-sm font-medium text-gray-700">
                Password Strength Requirements:
              </h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      passwordChecks().minLength
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ passwordChecks().minLength ? '✅' : '⭕' }}
                  </span>
                  <span>At least 10 characters</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      passwordChecks().hasUppercase
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ passwordChecks().hasUppercase ? '✅' : '⭕' }}
                  </span>
                  <span>Uppercase letter</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      passwordChecks().hasLowercase
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ passwordChecks().hasLowercase ? '✅' : '⭕' }}
                  </span>
                  <span>Lowercase letter</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      passwordChecks().hasNumber
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ passwordChecks().hasNumber ? '✅' : '⭕' }}
                  </span>
                  <span>Number</span>
                </div>
              </div>
            </div>
          </div>
        </ngx-card>

        <!-- Security Email Section -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">
              📧 Security Email
            </h3>
            <p class="text-sm text-gray-600">
              Email validation with business rules and security patterns
            </p>
          </div>

          <div class="space-y-4">
            <!-- Security Email -->
            <div>
              <label for="email" class="form-label">
                Security Notification Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                [ngModel]="formData().email"
                (ngModelChange)="updateField('email', $event)"
                class="form-input"
                placeholder="Enter your business email"
              />
              @if (vestForm.formState().errors['email']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['email'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">
                📧 Must be a business email (no personal domains like gmail.com)
              </div>
            </div>

            <!-- Recovery Email -->
            <div>
              <label for="recoveryEmail" class="form-label">
                Recovery Email
              </label>
              <input
                id="recoveryEmail"
                name="recoveryEmail"
                type="email"
                [ngModel]="formData().recoveryEmail"
                (ngModelChange)="updateField('recoveryEmail', $event)"
                class="form-input"
                placeholder="Enter recovery email"
              />
              @if (vestForm.formState().errors['recoveryEmail']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['recoveryEmail'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
            </div>

            <!-- Email Rules Demo -->
            <div class="rounded-lg bg-blue-50 p-4">
              <h4 class="mb-2 text-sm font-medium text-blue-900">
                📧 Email Rule Composition Demo:
              </h4>
              <div class="space-y-1 text-xs text-blue-800">
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      formData().email ? 'text-green-600' : 'text-gray-400'
                    "
                  >
                    {{ formData().email ? '✅' : '⭕' }}
                  </span>
                  <span>Format validation (RFC 5322 compliant)</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      emailChecks().businessDomain
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ emailChecks().businessDomain ? '✅' : '⭕' }}
                  </span>
                  <span>Business domain required (no gmail, yahoo, etc.)</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      emailChecks().validLength
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ emailChecks().validLength ? '✅' : '⭕' }}
                  </span>
                  <span>Email length requirements (5-100 characters)</span>
                </div>
              </div>
            </div>
          </div>
        </ngx-card>

        <!-- Contact Information Section -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">
              📞 Contact Information
            </h3>
            <p class="text-sm text-gray-600">
              Phone validation with country-specific patterns
            </p>
          </div>

          <div class="space-y-4">
            <!-- Primary Phone -->
            <div>
              <label for="phoneNumber" class="form-label">
                Primary Phone Number *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                [ngModel]="formData().phoneNumber"
                (ngModelChange)="updateField('phoneNumber', $event)"
                class="form-input"
                placeholder="+1 (555) 123-4567"
              />
              @if (vestForm.formState().errors['phoneNumber']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['phoneNumber'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">
                📞 US format: +1 (555) 123-4567 or international format
              </div>
            </div>

            <!-- Two Factor Authentication -->
            <div>
              <label class="flex items-center space-x-2">
                <input
                  name="twoFactorEnabled"
                  type="checkbox"
                  [ngModel]="formData().twoFactorEnabled"
                  (ngModelChange)="updateField('twoFactorEnabled', $event)"
                  class="form-checkbox"
                />
                <span class="form-label">Enable Two-Factor Authentication</span>
              </label>
              @if (vestForm.formState().errors['twoFactorEnabled']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['twoFactorEnabled'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">
                🔐 Recommended for enhanced account security
              </div>
            </div>

            <!-- Phone Validation Demo -->
            <div class="rounded-lg bg-green-50 p-4">
              <h4 class="mb-2 text-sm font-medium text-green-900">
                📞 Phone Rule Composition Demo:
              </h4>
              <div class="space-y-1 text-xs text-green-800">
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      phoneChecks().hasValidFormat
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ phoneChecks().hasValidFormat ? '✅' : '⭕' }}
                  </span>
                  <span>Valid phone format (US or international)</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      phoneChecks().hasCountryCode
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ phoneChecks().hasCountryCode ? '✅' : '⭕' }}
                  </span>
                  <span>Country code required</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      phoneChecks().correctLength
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ phoneChecks().correctLength ? '✅' : '⭕' }}
                  </span>
                  <span>Correct length for phone numbers</span>
                </div>
              </div>
            </div>
          </div>
        </ngx-card>

        <!-- API Access Section -->
        <ngx-card variant="primary-outline">
          <div card-header>
            <h3 class="text-lg font-semibold text-gray-900">🔑 API Access</h3>
            <p class="text-sm text-gray-600">
              API key management with security validation
            </p>
          </div>

          <div class="space-y-4">
            <!-- API Key Name -->
            <div>
              <label for="apiKeyName" class="form-label"> API Key Name </label>
              <input
                id="apiKeyName"
                name="apiKeyName"
                type="text"
                [ngModel]="formData().apiKeyName"
                (ngModelChange)="updateField('apiKeyName', $event)"
                class="form-input"
                placeholder="Production API Key"
              />
              @if (vestForm.formState().errors['apiKeyName']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['apiKeyName'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">🔑 Descriptive name for your API key</div>
            </div>

            <!-- Allowed Origins -->
            <div>
              <label for="allowedOrigins" class="form-label">
                Allowed Origins (comma-separated)
              </label>
              <input
                id="allowedOrigins"
                name="allowedOrigins"
                type="text"
                [ngModel]="allowedOriginsString()"
                (ngModelChange)="updateAllowedOrigins($event)"
                class="form-input"
                placeholder="https://app.example.com, https://staging.example.com"
              />
              @if (vestForm.formState().errors['allowedOrigins']) {
                <div class="form-error" role="alert">
                  @for (
                    error of vestForm.formState().errors['allowedOrigins'];
                    track error
                  ) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
              <div class="form-help">🌐 HTTPS URLs separated by commas</div>
            </div>

            <!-- API Security Demo -->
            <div class="rounded-lg bg-purple-50 p-4">
              <h4 class="mb-2 text-sm font-medium text-purple-900">
                🔑 API Security Rules Demo:
              </h4>
              <div class="space-y-1 text-xs text-purple-800">
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      apiChecks().hasValidName
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ apiChecks().hasValidName ? '✅' : '⭕' }}
                  </span>
                  <span>Valid API key name</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      apiChecks().hasValidOrigins
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ apiChecks().hasValidOrigins ? '✅' : '⭕' }}
                  </span>
                  <span>HTTPS origins only</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    [class]="
                      apiChecks().originsNotEmpty
                        ? 'text-green-600'
                        : 'text-gray-400'
                    "
                  >
                    {{ apiChecks().originsNotEmpty ? '✅' : '⭕' }}
                  </span>
                  <span>At least one origin specified</span>
                </div>
              </div>
            </div>
          </div>
        </ngx-card>

        <!-- Form Actions -->
        <ngx-card>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              @if (vestForm.formState().pending) {
                <span class="text-blue-600">⏳ Validating...</span>
              } @else if (vestForm.formState().valid) {
                <span class="text-green-600">✅ All fields valid</span>
              } @else {
                <span class="text-red-600">❌ Please fix errors above</span>
              }
            </div>

            <button
              type="submit"
              [disabled]="
                !vestForm.formState().valid || vestForm.formState().pending
              "
              class="btn-primary"
            >
              @if (vestForm.formState().pending) {
                Validating...
              } @else {
                Update Security Settings
              }
            </button>
          </div>
        </ngx-card>
      </form>
    </ngx-example-cards>
  `,
  styles: [
    `
      /* Custom styles for rule composition demo */
      .password-strength-bar {
        @apply h-1 rounded-sm transition-all duration-300;
      }

      .strength-weak {
        @apply bg-red-400;
        width: 25%;
      }

      .strength-basic {
        @apply bg-yellow-400;
        width: 50%;
      }

      .strength-standard {
        @apply bg-blue-400;
        width: 75%;
      }

      .strength-strong {
        @apply bg-green-400;
        width: 100%;
      }

      .rule-demo-card {
        @apply border-l-4 pl-4;
      }

      .rule-demo-card.email {
        @apply border-l-blue-400;
      }

      .rule-demo-card.password {
        @apply border-l-green-400;
      }

      .rule-demo-card.phone {
        @apply border-l-purple-400;
      }

      .rule-demo-card.url {
        @apply border-l-orange-400;
      }

      /* Form section spacing */
      .form-section {
        @apply space-y-6;
      }

      .validation-indicator {
        @apply flex items-center space-x-2 text-xs transition-colors duration-200;
      }

      .validation-indicator.valid {
        @apply text-green-600;
      }

      .validation-indicator.invalid {
        @apply text-gray-400;
      }

      /* Rule composition highlights */
      .rule-highlight {
        @apply rounded bg-gray-100 px-2 py-1 font-mono text-xs;
      }

      .composition-demo {
        @apply rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4;
      }

      .composition-demo h4 {
        @apply mb-2 text-sm font-medium text-gray-900;
      }

      .composition-demo .rule-item {
        @apply flex items-center space-x-2 text-xs text-gray-700;
      }
    `,
  ],
})
export class RuleCompositionComponent {
  protected readonly content = RULE_COMPOSITION_CONTENT;
  protected readonly validationSuite = securitySettingsValidationSuite;

  // Form data signal
  protected readonly formData = signal<SecuritySettingsModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    email: '',
    recoveryEmail: '',
    phoneNumber: '',
    twoFactorEnabled: false,
    securityQuestions: [],
    apiKeyName: '',
    allowedOrigins: [],
  });

  // Password strength indicator
  protected readonly passwordChecks = computed(() => {
    const password = this.formData().newPassword || '';
    return {
      minLength: password.length >= 10,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      notCommon: !['password', '123456789', 'qwerty'].includes(
        password.toLowerCase(),
      ),
    };
  });

  // Email validation checks
  protected readonly emailChecks = computed(() => {
    const email = this.formData().email || '';
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    const domain = email.split('@')[1] || '';

    return {
      businessDomain: email && !personalDomains.includes(domain.toLowerCase()),
      validLength: email.length >= 5 && email.length <= 100,
    };
  });

  // Phone validation checks
  protected readonly phoneChecks = computed(() => {
    const phone = this.formData().phoneNumber || '';
    return {
      hasValidFormat: /^\+?[\d\s\-()]+$/.test(phone),
      hasCountryCode: phone.startsWith('+'),
      correctLength: phone.replaceAll(/\D/g, '').length >= 10,
    };
  });

  // API validation checks
  protected readonly apiChecks = computed(() => {
    const name = this.formData().apiKeyName || '';
    const origins = this.formData().allowedOrigins || [];

    return {
      hasValidName: name.length >= 3,
      hasValidOrigins: origins.every((origin) => origin.startsWith('https://')),
      originsNotEmpty: origins.length > 0,
    };
  });

  // Convert allowedOrigins array to string for display
  protected readonly allowedOriginsString = computed(() => {
    return this.formData().allowedOrigins.join(', ');
  });

  /**
   * Updates allowed origins from comma-separated string
   */
  protected updateAllowedOrigins(value: string): void {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    this.updateField('allowedOrigins', origins);
  }

  /**
   * Updates a specific field in the form data
   */
  protected updateField<K extends keyof SecuritySettingsModel>(
    field: K,
    value: SecuritySettingsModel[K],
  ): void {
    this.formData.update((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /**
   * Handles form submission with rule composition demo
   */
  protected onSubmit(): void {
    const data = this.formData();
    console.log('Security settings updated:', data);

    // Demonstrate rule composition validation results
    console.log('Email validation result:', {
      isValidFormat: this.testEmailFormat(data.email),
      meetsRequirements: this.testEmailRequirements(data.email),
    });

    console.log('Password validation result:', {
      strengthLevel: this.testPasswordStrength(data.newPassword),
      meetsStandard: this.testPasswordMeetsStandard(data.newPassword),
    });

    alert(
      'Security settings updated successfully! Check console for rule composition details.',
    );
  }

  /**
   * Rule composition testing methods (for demo purposes)
   */
  private testEmailFormat(email: string): boolean {
    try {
      emailValidation.isValidFormat(email);
      return true;
    } catch {
      return false;
    }
  }

  private testEmailRequirements(email: string): boolean {
    try {
      emailValidation.meetsSizeRequirements(email);
      return true;
    } catch {
      return false;
    }
  }

  private testPasswordStrength(password: string): string {
    const checks = this.passwordChecks();
    if (!password) return 'none';
    if (
      checks.minLength &&
      checks.hasUppercase &&
      checks.hasLowercase &&
      checks.hasNumber &&
      checks.hasSymbol
    )
      return 'strong';
    if (
      checks.minLength &&
      checks.hasUppercase &&
      checks.hasLowercase &&
      checks.hasNumber
    )
      return 'standard';
    if (checks.minLength && (checks.hasUppercase || checks.hasLowercase))
      return 'basic';
    return 'weak';
  }

  private testPasswordMeetsStandard(password: string): boolean {
    try {
      passwordValidation.meetsStrengthLevel(password, 'standard');
      return true;
    } catch {
      return false;
    }
  }
}
