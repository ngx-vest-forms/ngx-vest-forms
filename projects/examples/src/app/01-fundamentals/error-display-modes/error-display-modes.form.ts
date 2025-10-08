import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  createVestForm,
  NgxVestForms,
  type EnhancedVestForm,
  type ErrorDisplayStrategy,
} from 'ngx-vest-forms';
import { asDebuggerForm, createFocusFirstInvalidField } from '../../ui';
import {
  ProductFeedbackModel,
  productFeedbackValidationSuite,
} from './error-display-modes.validations';

const INITIAL_MODEL: ProductFeedbackModel = {
  name: '',
  email: '',
  company: '',
  productUsed: '',
  overallRating: 0,
  improvementSuggestions: '',
  detailedFeedback: '',
  allowFollowUp: false,
  newsletter: false,
};

const DEFAULT_STRATEGY: ErrorDisplayStrategy = 'on-touch';

/**
 * Modern Error Display Modes Demo using Vest.js-first approach
 *
 * Demonstrates different error display strategies with the Enhanced Field
 * Signals API using a realistic product feedback form scenario.
 */
@Component({
  selector: 'ngx-error-display-modes-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxVestForms],
  template: `
    <!-- Product Feedback Form -->
    <form
      [ngxVestForm]="form"
      (ngSubmit)="save()"
      class="form-container"
      aria-labelledby="productFeedbackHeading"
      novalidate
    >
      <!-- Personal Information Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          👤 Personal Information
        </legend>

        <!-- Name Field -->
        <div class="form-field">
          <label class="form-label" for="name">Full Name *</label>
          <input
            class="form-input"
            id="name"
            type="text"
            autocomplete="name"
            [value]="form.name() || ''"
            (input)="form.setName($event)"
            aria-describedby="name-hint"
            placeholder="Your full name"
          />
          <div class="form-hint" id="name-hint">
            We use this to personalize our response
          </div>
          <ngx-form-error [field]="form.nameField()" />
        </div>

        <!-- Email Field -->
        <div class="form-field">
          <label class="form-label" for="email">Email Address *</label>
          <input
            class="form-input"
            id="email"
            type="email"
            autocomplete="email"
            [value]="form.email() || ''"
            (input)="form.setEmail($event)"
            placeholder="your.email@company.com"
            aria-describedby="email-hint"
          />
          <div class="form-hint" id="email-hint">
            For follow-up questions (we respect your privacy)
          </div>
          <ngx-form-error [field]="form.emailField()" />
        </div>

        <!-- Company Field -->
        <div class="form-field">
          <label class="form-label" for="company">Company</label>
          <input
            class="form-input"
            id="company"
            type="text"
            autocomplete="organization"
            [value]="form.company() || ''"
            (input)="form.setCompany($event)"
            placeholder="Your company (optional)"
            aria-describedby="company-hint"
          />
          <div class="form-hint" id="company-hint">
            Helps us understand your use case
          </div>
          <ngx-form-error [field]="form.companyField()" />
        </div>
      </fieldset>

      <!-- Feedback Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          📝 Your Feedback
        </legend>

        <!-- Product Used -->
        <div class="form-field">
          <label class="form-label" for="productUsed"
            >Which product did you use? *</label
          >
          <select
            class="form-input"
            id="productUsed"
            [value]="form.productUsed() || ''"
            (change)="form.setProductUsed($event)"
            aria-describedby="product-hint"
          >
            <option value="">Select a product...</option>
            <option value="Web App">Web Application</option>
            <option value="Mobile App">Mobile Application</option>
            <option value="API">API Documentation</option>
            <option value="Documentation">User Documentation</option>
            <option value="Other">Other</option>
          </select>
          <div class="form-hint" id="product-hint">
            Which product are you providing feedback about?
          </div>
          <ngx-form-error [field]="form.productUsedField()" />
        </div>

        <!-- Overall Rating -->
        <div class="form-field">
          <label class="form-label" for="overallRating">Overall Rating *</label>
          <input
            class="form-input"
            id="overallRating"
            type="number"
            min="1"
            max="5"
            [value]="form.overallRating() > 0 ? form.overallRating() : ''"
            (input)="form.setOverallRating($event)"
            placeholder="Rate 1-5 stars"
            aria-describedby="rating-hint"
          />
          <div class="form-hint" id="rating-hint">1 = Poor, 5 = Excellent</div>
          <ngx-form-error [field]="form.overallRatingField()" />
        </div>

        <!-- Conditional Improvement Suggestions -->
        @if (form.overallRating() && form.overallRating() <= 3) {
          <div class="form-field">
            <label class="form-label" for="improvementSuggestions">
              What could we improve? *
            </label>
            <textarea
              class="form-input"
              id="improvementSuggestions"
              rows="4"
              [value]="form.improvementSuggestions() || ''"
              (input)="form.setImprovementSuggestions($event)"
              placeholder="Please help us understand what went wrong..."
              aria-describedby="improvement-hint improvement-counter"
            ></textarea>
            <div class="mt-1 flex items-center justify-between">
              <div class="form-hint" id="improvement-hint">
                Please help us understand what went wrong
              </div>
              <span
                id="improvement-counter"
                class="text-xs text-gray-500 dark:text-gray-400"
                [class.text-red-600]="improvementLength() > 500"
                [class.dark:text-red-400]="improvementLength() > 500"
              >
                {{ improvementLength() }}/500
              </span>
            </div>
            <ngx-form-error [field]="form.improvementSuggestionsField()" />
          </div>
        }

        <!-- Detailed Feedback -->
        <div class="form-field">
          <label class="form-label" for="detailedFeedback">
            Additional Comments
          </label>
          <textarea
            class="form-input"
            id="detailedFeedback"
            rows="4"
            [value]="form.detailedFeedback() || ''"
            (input)="form.setDetailedFeedback($event)"
            placeholder="Share your detailed experience..."
            aria-describedby="detailed-hint detailed-counter"
          ></textarea>
          <div class="mt-1 flex items-center justify-between">
            <div class="form-hint" id="detailed-hint">
              Any additional thoughts or suggestions
            </div>
            <span
              id="detailed-counter"
              class="text-xs text-gray-500 dark:text-gray-400"
              [class.text-red-600]="detailedLength() > 1000"
              [class.dark:text-red-400]="detailedLength() > 1000"
            >
              {{ detailedLength() }}/1000
            </span>
          </div>
          <ngx-form-error [field]="form.detailedFeedbackField()" />
        </div>
      </fieldset>

      <!-- Preferences Section -->
      <fieldset class="mb-8">
        <legend
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100"
        >
          ⚙️ Preferences
        </legend>

        <!-- Allow Follow Up -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="allowFollowUp"
              class="form-checkbox"
              [checked]="form.allowFollowUp()"
              (change)="form.setAllowFollowUp($event)"
            />
            <span class="ml-2"
              >Allow us to contact you for follow-up questions</span
            >
          </label>
          <div class="form-hint ml-6">We promise not to spam you</div>
        </div>

        <!-- Newsletter -->
        <div class="form-field">
          <label class="form-checkbox-label">
            <input
              type="checkbox"
              name="newsletter"
              class="form-checkbox"
              [checked]="form.newsletter()"
              (change)="form.setNewsletter($event)"
            />
            <span class="ml-2">Subscribe to product updates</span>
          </label>
          <div class="form-hint ml-6">
            Monthly digest of new features and improvements
          </div>
        </div>
      </fieldset>

      <!-- Submit Section -->
      <div class="form-actions">
        @if (showSubmissionError()) {
          <div
            id="submission-error"
            class="feedback-alert feedback-alert--error"
            role="alert"
          >
            <div class="text-sm font-medium text-red-800 dark:text-red-200">
              Please fix the errors above before submitting.
            </div>
          </div>
        }

        @if (showPendingMessage()) {
          <div
            class="feedback-alert feedback-alert--pending"
            role="status"
            aria-live="polite"
          >
            <div class="text-sm font-medium text-blue-800 dark:text-blue-200">
              Still validating... Please wait a moment.
            </div>
          </div>
        }

        <button
          type="submit"
          class="btn-primary"
          [disabled]="form.pending() || form.submitting()"
          [attr.aria-describedby]="
            showSubmissionError() ? 'submission-error' : null
          "
        >
          @if (form.submitting()) {
            <span class="inline-block animate-spin" aria-hidden="true">⏳</span>
            Submitting Feedback...
          } @else {
            Submit Feedback
          }
        </button>
      </div>
    </form>
  `,
})
export class ErrorDisplayModesFormComponent implements OnDestroy {
  /** Focus utility for better testability and Angular best practices */
  private readonly focusFirstInvalidField = createFocusFirstInvalidField();

  /** The error display strategy to use for form validation */
  readonly errorDisplayMode = input.required<ErrorDisplayStrategy>();

  private readonly model = signal<ProductFeedbackModel>({ ...INITIAL_MODEL });
  private readonly activeStrategy =
    signal<ErrorDisplayStrategy>(DEFAULT_STRATEGY);
  private readonly formRef = signal<EnhancedVestForm<ProductFeedbackModel>>(
    this.createForm(DEFAULT_STRATEGY),
  );

  protected readonly improvementLength = computed(() => {
    const current = this.formRef().improvementSuggestions();
    return (current ?? '').length;
  });

  protected readonly detailedLength = computed(() => {
    const current = this.formRef().detailedFeedback();
    return (current ?? '').length;
  });

  protected readonly showSubmissionError = signal(false);
  protected readonly showPendingMessage = signal(false);

  private readonly syncErrorStrategy = effect(() => {
    const requestedStrategy = this.errorDisplayMode();
    const currentStrategy = this.activeStrategy();

    if (requestedStrategy === currentStrategy) {
      return;
    }

    const previousForm = this.formRef();
    const nextForm = this.createForm(requestedStrategy);

    this.formRef.set(nextForm);
    this.activeStrategy.set(requestedStrategy);

    previousForm.dispose();
  });

  protected get form(): EnhancedVestForm<ProductFeedbackModel> {
    return this.formRef();
  }

  async save(): Promise<void> {
    this.showSubmissionError.set(false);
    this.showPendingMessage.set(false);

    try {
      const formData = await this.form.submit();

      if (isDevMode()) {
        console.group('📋 Product Feedback Submission');
        console.log('Form Data:', formData);
        console.log('Current Error Display Strategy:', this.errorDisplayMode());
        console.groupEnd();
      }

      alert('Thank you for your feedback! 🎉');
    } catch {
      if (this.form.pending()) {
        this.showPendingMessage.set(true);
        return;
      }

      this.showSubmissionError.set(true);
      this.focusFirstInvalidField(this.form.errors());
    }
  }

  ngOnDestroy(): void {
    this.formRef().dispose();
  }

  private createForm(
    strategy: ErrorDisplayStrategy,
  ): EnhancedVestForm<ProductFeedbackModel> {
    return createVestForm(this.model, {
      suite: productFeedbackValidationSuite,
      errorStrategy: strategy,
      enhancedFieldSignals: true,
    });
  }

  // Debug support for development
  readonly debugFormState = () => asDebuggerForm(this.form);
}
