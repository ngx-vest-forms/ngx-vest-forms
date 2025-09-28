import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  InputSignal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Configuration options for control wrapper display behavior
 */
export type NgxControlWrapperConfig = {
  /** Whether to show errors immediately when they exist */
  showErrorsImmediately?: boolean;
  /** Whether to show validation success state */
  showSuccessState?: boolean;
  /** Custom CSS classes to apply */
  customClasses?: string;
  /** Whether to use compact layout */
  compact?: boolean;
};

/**
 * NgxControlWrapper - Accessible field UI presentation component
 *
 * Provides consistent, accessible styling and behavior for form controls
 * integrated with ngx-vest-forms validation state.
 *
 * Features:
 * - Automatic error message display with proper ARIA associations
 * - Success state indication
 * - Consistent spacing and typography
 * - Full keyboard navigation support
 * - Screen reader optimized
 * - CSS custom properties for theming
 *
 * @example
 * ```html
 * <ngx-control-wrapper>
 *   <label for="email">Email Address</label>
 *   <input
 *     id="email"
 *     name="email"
 *     type="email"
 *     [ngModel]="model().email"
 *   />
 *   <!-- Error messages will be automatically displayed -->
 * </ngx-control-wrapper>
 * ```
 *
 * @example With custom configuration
 * ```html
 * <ngx-control-wrapper
 *   [config]="{ showSuccessState: true, compact: true }"
 * >
 *   <label for="username">Username</label>
 *   <input
 *     id="username"
 *     name="username"
 *     [ngModel]="model().username"
 *   />
 * </ngx-control-wrapper>
 * ```
 */
@Component({
  selector: 'ngx-control-wrapper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Allow CSS custom properties to be inherited
  template: `
    <div
      class="ngx-control-wrapper"
      [class.ngx-control-wrapper--compact]="isCompact()"
      [class.ngx-control-wrapper--has-errors]="hasErrors()"
      [class.ngx-control-wrapper--has-success]="hasSuccess()"
      [class.ngx-control-wrapper--custom]="hasCustomClasses()"
      [ngClass]="config()?.customClasses"
    >
      <!-- Content projection for label and input -->
      <div
        class="ngx-control-wrapper__content"
        [attr.data-field-name]="fieldName()"
      >
        <ng-content></ng-content>
      </div>

      <!-- Error messages container -->
      @if (shouldShowErrors()) {
        <div
          class="ngx-control-wrapper__errors"
          [id]="errorId()"
          role="alert"
          aria-live="polite"
        >
          @for (error of visibleErrors(); track error) {
            <div class="ngx-control-wrapper__error">
              {{ error }}
            </div>
          }
        </div>
      }

      <!-- Success indicator -->
      @if (shouldShowSuccess()) {
        <div
          class="ngx-control-wrapper__success"
          role="status"
          aria-live="polite"
        >
          <span class="ngx-control-wrapper__success-icon" aria-hidden="true"
            >✓</span
          >
          <span class="ngx-control-wrapper__success-text">Valid</span>
        </div>
      }

      <!-- Loading indicator for pending validations -->
      @if (isPending()) {
        <div
          class="ngx-control-wrapper__pending"
          role="status"
          aria-live="polite"
        >
          <span class="ngx-control-wrapper__pending-icon" aria-hidden="true"
            >⏳</span
          >
          <span class="ngx-control-wrapper__pending-text">Validating...</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* CSS Custom Properties for theming */
      :root {
        --ngx-control-wrapper-spacing: 0.5rem;
        --ngx-control-wrapper-spacing-compact: 0.25rem;
        --ngx-control-wrapper-border-radius: 0.25rem;

        /* Colors */
        --ngx-control-wrapper-error-color: #dc2626;
        --ngx-control-wrapper-success-color: #16a34a;
        --ngx-control-wrapper-pending-color: #ea580c;
        --ngx-control-wrapper-background: #ffffff;
        --ngx-control-wrapper-border-color: #d1d5db;
        --ngx-control-wrapper-border-color-error: var(
          --ngx-control-wrapper-error-color
        );
        --ngx-control-wrapper-border-color-success: var(
          --ngx-control-wrapper-success-color
        );

        /* Typography */
        --ngx-control-wrapper-font-size: 0.875rem;
        --ngx-control-wrapper-font-size-small: 0.75rem;
        --ngx-control-wrapper-line-height: 1.25;

        /* Transitions */
        --ngx-control-wrapper-transition: all 0.2s ease-in-out;
      }

      /* Base wrapper styles */
      .ngx-control-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--ngx-control-wrapper-spacing);
        width: 100%;
      }

      .ngx-control-wrapper--compact {
        gap: var(--ngx-control-wrapper-spacing-compact);
      }

      /* Content area */
      .ngx-control-wrapper__content {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      /* Enhance form controls within the wrapper */
      .ngx-control-wrapper input,
      .ngx-control-wrapper textarea,
      .ngx-control-wrapper select {
        border: 1px solid var(--ngx-control-wrapper-border-color);
        border-radius: var(--ngx-control-wrapper-border-radius);
        padding: 0.5rem;
        font-size: var(--ngx-control-wrapper-font-size);
        line-height: var(--ngx-control-wrapper-line-height);
        transition: var(--ngx-control-wrapper-transition);
        background-color: var(--ngx-control-wrapper-background);
      }

      .ngx-control-wrapper input:focus,
      .ngx-control-wrapper textarea:focus,
      .ngx-control-wrapper select:focus {
        outline: 2px solid var(--ngx-control-wrapper-border-color);
        outline-offset: 2px;
        border-color: var(--ngx-control-wrapper-border-color);
      }

      /* Error state styling */
      .ngx-control-wrapper--has-errors input,
      .ngx-control-wrapper--has-errors textarea,
      .ngx-control-wrapper--has-errors select {
        border-color: var(--ngx-control-wrapper-border-color-error);
      }

      .ngx-control-wrapper--has-errors input:focus,
      .ngx-control-wrapper--has-errors textarea:focus,
      .ngx-control-wrapper--has-errors select:focus {
        outline-color: var(--ngx-control-wrapper-border-color-error);
      }

      /* Success state styling */
      .ngx-control-wrapper--has-success input,
      .ngx-control-wrapper--has-success textarea,
      .ngx-control-wrapper--has-success select {
        border-color: var(--ngx-control-wrapper-border-color-success);
      }

      .ngx-control-wrapper--has-success input:focus,
      .ngx-control-wrapper--has-success textarea:focus,
      .ngx-control-wrapper--has-success select:focus {
        outline-color: var(--ngx-control-wrapper-border-color-success);
      }

      /* Label styling */
      .ngx-control-wrapper label {
        font-size: var(--ngx-control-wrapper-font-size);
        font-weight: 500;
        line-height: var(--ngx-control-wrapper-line-height);
        color: #374151;
      }

      /* Error messages */
      .ngx-control-wrapper__errors {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .ngx-control-wrapper__error {
        color: var(--ngx-control-wrapper-error-color);
        font-size: var(--ngx-control-wrapper-font-size-small);
        line-height: var(--ngx-control-wrapper-line-height);
        display: flex;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .ngx-control-wrapper__error::before {
        content: '⚠';
        flex-shrink: 0;
        margin-top: 0.125rem;
      }

      /* Success indicator */
      .ngx-control-wrapper__success {
        color: var(--ngx-control-wrapper-success-color);
        font-size: var(--ngx-control-wrapper-font-size-small);
        line-height: var(--ngx-control-wrapper-line-height);
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .ngx-control-wrapper__success-icon {
        flex-shrink: 0;
        font-weight: bold;
      }

      /* Pending indicator */
      .ngx-control-wrapper__pending {
        color: var(--ngx-control-wrapper-pending-color);
        font-size: var(--ngx-control-wrapper-font-size-small);
        line-height: var(--ngx-control-wrapper-line-height);
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .ngx-control-wrapper__pending-icon {
        flex-shrink: 0;
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .ngx-control-wrapper input,
        .ngx-control-wrapper textarea,
        .ngx-control-wrapper select {
          border-width: 2px;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .ngx-control-wrapper input,
        .ngx-control-wrapper textarea,
        .ngx-control-wrapper select,
        .ngx-control-wrapper__pending-icon {
          transition: none;
          animation: none;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        :root {
          --ngx-control-wrapper-background: #1f2937;
          --ngx-control-wrapper-border-color: #4b5563;
          --ngx-control-wrapper-error-color: #f87171;
          --ngx-control-wrapper-success-color: #4ade80;
          --ngx-control-wrapper-pending-color: #fb923c;
        }

        .ngx-control-wrapper label {
          color: #f3f4f6;
        }

        .ngx-control-wrapper input,
        .ngx-control-wrapper textarea,
        .ngx-control-wrapper select {
          color: #f3f4f6;
        }
      }
    `,
  ],
  host: {
    '[attr.data-ngx-control-wrapper]': 'true',
  },
})
export class NgxControlWrapper implements AfterViewInit {
  /**
   * Configuration options for the control wrapper
   */
  config: InputSignal<NgxControlWrapperConfig | undefined> =
    input<NgxControlWrapperConfig>();

  /**
   * Field name for identification and ARIA associations
   * If not provided, attempts to extract from content
   */
  fieldName: InputSignal<string | undefined> = input<string>();

  /**
   * Array of error messages to display
   */
  errors: InputSignal<string[]> = input<string[]>([]);

  /**
   * Whether the field has been touched/tested
   */
  touched: InputSignal<boolean> = input<boolean>(false);

  /**
   * Whether the field is currently valid
   */
  valid: InputSignal<boolean> = input<boolean>(true);

  /**
   * Whether validation is currently pending
   */
  pending: InputSignal<boolean> = input<boolean>(false);

  /**
   * Whether to show errors (computed from touch state and errors)
   */
  showErrors: InputSignal<boolean> = input<boolean>(false);

  // Content child references for automatic field detection
  private inputElement = contentChild<ElementRef<HTMLInputElement>>('input');
  private textareaElement =
    contentChild<ElementRef<HTMLTextAreaElement>>('textarea');
  private selectElement = contentChild<ElementRef<HTMLSelectElement>>('select');

  // Computed properties for template logic
  protected readonly isCompact = computed(
    () => this.config()?.compact === true,
  );
  protected readonly hasCustomClasses = computed(
    () => !!this.config()?.customClasses,
  );

  protected readonly hasErrors = computed(() => this.errors().length > 0);
  protected readonly hasSuccess = computed(
    () =>
      this.config()?.showSuccessState === true &&
      this.valid() &&
      this.touched() &&
      !this.pending(),
  );

  protected readonly shouldShowErrors = computed(() => {
    const config = this.config();
    const hasErrors = this.hasErrors();

    if (config?.showErrorsImmediately) {
      return hasErrors;
    }

    return hasErrors && (this.touched() || this.showErrors());
  });

  protected readonly shouldShowSuccess = computed(() => this.hasSuccess());
  protected readonly isPending = computed(() => this.pending());

  protected readonly visibleErrors = computed(() => {
    return this.shouldShowErrors() ? this.errors() : [];
  });

  protected readonly errorId = computed(() => {
    const fieldName = this.fieldName();
    return fieldName ? `${fieldName}-errors` : 'ngx-control-wrapper-errors';
  });

  /**
   * Get the form control element if available
   */
  getControlElement(): HTMLElement | null {
    return (
      this.inputElement()?.nativeElement ||
      this.textareaElement()?.nativeElement ||
      this.selectElement()?.nativeElement ||
      null
    );
  }

  /**
   * Associate error messages with the form control via aria-describedby
   */
  ngAfterViewInit(): void {
    const controlElement = this.getControlElement();
    if (controlElement && this.shouldShowErrors()) {
      const existingDescribedBy =
        controlElement.getAttribute('aria-describedby') || '';
      const errorId = this.errorId();

      if (!existingDescribedBy.includes(errorId)) {
        const newDescribedBy = existingDescribedBy
          ? `${existingDescribedBy} ${errorId}`
          : errorId;
        controlElement.setAttribute('aria-describedby', newDescribedBy);
      }
    }
  }
}
