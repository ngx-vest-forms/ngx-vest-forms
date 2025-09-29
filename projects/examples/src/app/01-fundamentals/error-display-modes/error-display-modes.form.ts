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
  type EnhancedVestForm,
  type ErrorDisplayStrategy,
} from 'ngx-vest-forms/core';
import { createFocusFirstInvalidField } from '../../ui';
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
  template: `
    <!-- Product Feedback Form -->
    <form
      (ngSubmit)="onSubmit()"
      class="form-container"
      aria-labelledby="productFeedbackHeading"
      [attr.aria-busy]="form.pending()"
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
            name="name"
            type="text"
            autocomplete="name"
            [value]="form.name() || ''"
            (input)="form.setName($event)"
            (blur)="form.touchName()"
            [attr.aria-invalid]="
              form.nameShowErrors() && !form.nameValid() ? 'true' : null
            "
            [attr.aria-describedby]="
              form.nameShowErrors() && form.nameErrors().length
                ? 'name-hint name-errors'
                : 'name-hint'
            "
            placeholder="Your full name"
          />
          <div class="form-hint" id="name-hint">
            We use this to personalize our response
          </div>
          @if (form.nameShowErrors() && form.nameErrors().length) {
            <div class="form-error" id="name-errors" role="alert">
              {{ form.nameErrors()[0] }}
            </div>
          }
        </div>

        <!-- Email Field -->
        <div class="form-field">
          <label class="form-label" for="email">Email Address *</label>
          <input
            class="form-input"
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            [value]="form.email() || ''"
            (input)="form.setEmail($event)"
            (blur)="form.touchEmail()"
            placeholder="your.email@company.com"
            [attr.aria-invalid]="
              form.emailShowErrors() && !form.emailValid() ? 'true' : null
            "
            [attr.aria-describedby]="
              form.emailShowErrors() && form.emailErrors().length
                ? 'email-hint email-errors'
                : 'email-hint'
            "
          />
          <div class="form-hint" id="email-hint">
            For follow-up questions (we respect your privacy)
          </div>
          @if (form.emailShowErrors() && form.emailErrors().length) {
            <div class="form-error" id="email-errors" role="alert">
              {{ form.emailErrors()[0] }}
            </div>
          }
        </div>

        <!-- Company Field -->
        <div class="form-field">
          <label class="form-label" for="company">Company</label>
          <input
            class="form-input"
            id="company"
            name="company"
            type="text"
            autocomplete="organization"
            [value]="form.company() || ''"
            (input)="form.setCompany($event)"
            (blur)="form.touchCompany()"
            placeholder="Your company (optional)"
            [attr.aria-invalid]="
              form.companyShowErrors() && !form.companyValid() ? 'true' : null
            "
            [attr.aria-describedby]="
              form.companyShowErrors() && form.companyErrors().length
                ? 'company-hint company-errors'
                : 'company-hint'
            "
          />
          <div class="form-hint" id="company-hint">
            Helps us understand your use case
          </div>
          @if (form.companyShowErrors() && form.companyErrors().length) {
            <div class="form-error" id="company-errors" role="alert">
              {{ form.companyErrors()[0] }}
            </div>
          }
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
            name="productUsed"
            [value]="form.productUsed() || ''"
            (change)="form.setProductUsed($event)"
            (blur)="form.touchProductUsed()"
            [attr.aria-invalid]="
              form.productUsedShowErrors() && !form.productUsedValid()
                ? 'true'
                : null
            "
            [attr.aria-describedby]="
              form.productUsedShowErrors() && form.productUsedErrors().length
                ? 'product-hint product-errors'
                : 'product-hint'
            "
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
          @if (
            form.productUsedShowErrors() && form.productUsedErrors().length
          ) {
            <div class="form-error" id="product-errors" role="alert">
              {{ form.productUsedErrors()[0] }}
            </div>
          }
        </div>

        <!-- Overall Rating -->
        <div class="form-field">
          <label class="form-label" for="overallRating">Overall Rating *</label>
          <input
            class="form-input"
            id="overallRating"
            name="overallRating"
            type="number"
            min="1"
            max="5"
            [value]="form.overallRating() > 0 ? form.overallRating() : ''"
            (input)="form.setOverallRating($event)"
            (blur)="form.touchOverallRating()"
            placeholder="Rate 1-5 stars"
            [attr.aria-invalid]="
              form.overallRatingShowErrors() && !form.overallRatingValid()
                ? 'true'
                : null
            "
            [attr.aria-describedby]="
              form.overallRatingShowErrors() &&
              form.overallRatingErrors().length
                ? 'rating-hint rating-errors'
                : 'rating-hint'
            "
          />
          <div class="form-hint" id="rating-hint">1 = Poor, 5 = Excellent</div>
          @if (
            form.overallRatingShowErrors() && form.overallRatingErrors().length
          ) {
            <div class="form-error" id="rating-errors" role="alert">
              {{ form.overallRatingErrors()[0] }}
            </div>
          }
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
              name="improvementSuggestions"
              rows="4"
              [value]="form.improvementSuggestions() || ''"
              (input)="form.setImprovementSuggestions($event)"
              (blur)="form.touchImprovementSuggestions()"
              placeholder="Please help us understand what went wrong..."
              [attr.aria-invalid]="
                form.improvementSuggestionsShowErrors() &&
                !form.improvementSuggestionsValid()
                  ? 'true'
                  : null
              "
              [attr.aria-describedby]="
                form.improvementSuggestionsShowErrors() &&
                form.improvementSuggestionsErrors().length
                  ? 'improvement-hint improvement-counter improvement-errors'
                  : 'improvement-hint improvement-counter'
              "
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
            @if (
              form.improvementSuggestionsShowErrors() &&
              form.improvementSuggestionsErrors().length
            ) {
              <div class="form-error" id="improvement-errors" role="alert">
                {{ form.improvementSuggestionsErrors()[0] }}
              </div>
            }
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
            name="detailedFeedback"
            rows="4"
            [value]="form.detailedFeedback() || ''"
            (input)="form.setDetailedFeedback($event)"
            (blur)="form.touchDetailedFeedback()"
            placeholder="Share your detailed experience..."
            [attr.aria-invalid]="
              form.detailedFeedbackShowErrors() && !form.detailedFeedbackValid()
                ? 'true'
                : null
            "
            [attr.aria-describedby]="
              form.detailedFeedbackShowErrors() &&
              form.detailedFeedbackErrors().length
                ? 'detailed-hint detailed-counter detailed-errors'
                : 'detailed-hint detailed-counter'
            "
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
          @if (
            form.detailedFeedbackShowErrors() &&
            form.detailedFeedbackErrors().length
          ) {
            <div class="form-error" id="detailed-errors" role="alert">
              {{ form.detailedFeedbackErrors()[0] }}
            </div>
          }
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
          [disabled]="form.submitting()"
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

  async onSubmit(): Promise<void> {
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
    return createVestForm(productFeedbackValidationSuite, this.model, {
      errorStrategy: strategy,
      enhancedFieldSignals: true,
    });
  }
}
