import {
  ChangeDetectionStrategy,
  Component,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, only, staticSuite, test } from 'vest';

type FormStateDemoModel = {
  firstName: string;
  email: string;
  age: number | null;
  newsletter: boolean;
  favoriteColor: string;
};

const formStateDemoSuite = staticSuite(
  (data: Partial<FormStateDemoModel> = {}, field?: string) => {
    only(field);

    // Required field with multiple validation rules
    test('firstName', 'First name is required', () => {
      enforce(data.firstName).isNotEmpty();
    });

    test('firstName', 'Name must be at least 2 characters', () => {
      enforce(data.firstName).longerThanOrEquals(2);
    });

    test('firstName', 'Name cannot exceed 50 characters', () => {
      enforce(data.firstName).shorterThanOrEquals(50);
    });

    // Email with async validation simulation
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Please enter a valid email format', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    // Async email uniqueness check (simulated)
    test('email', 'Checking email availability...', async () => {
      if (!data.email || !data.email.includes('@')) return;

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate existing emails
      const existingEmails = ['admin@example.com', 'test@example.com'];
      if (existingEmails.includes(data.email)) {
        throw new Error('This email is already registered');
      }
    });

    // Age validation
    test('age', 'Age is required', () => {
      enforce(data.age).isNotEmpty();
    });

    test('age', 'Age must be a number', () => {
      enforce(data.age).isNumber();
    });

    test('age', 'Age must be at least 13', () => {
      enforce(data.age).greaterThanOrEquals(13);
    });

    // Color selection
    test('favoriteColor', 'Please select your favorite color', () => {
      enforce(data.favoriteColor).isNotEmpty();
    });
  },
);

/**
 * Form component demonstrating comprehensive state API usage
 */
@Component({
  selector: 'ngx-form-state-demo-form',
  imports: [ngxVestForms],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-state-demo.component.scss',
  host: {
    class:
      'ngx-form-surface-flat form-surface-flat form-surface-flat-full surface-gradient-border surface-no-bg',
  },
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit(vestForm.formState())"
      class="demo-form nv-form"
      aria-labelledby="formStateDemoHeading"
      (input)="emitState(vestForm.formState())"
      (change)="emitState(vestForm.formState())"
    >
      <!-- Form State Indicators -->
      <div class="form-state-indicators">
        <div class="state-card" [class.active]="vestForm.formState().valid">
          <div class="state-icon">✓</div>
          <div class="state-label">Valid</div>
          <div class="state-value">
            {{ vestForm.formState().valid ? 'Yes' : 'No' }}
          </div>
        </div>

        <div class="state-card" [class.active]="vestForm.formState().pending">
          <div class="state-icon">⏳</div>
          <div class="state-label">Pending</div>
          <div class="state-value">
            {{ vestForm.formState().pending ? 'Yes' : 'No' }}
          </div>
        </div>

        <div
          class="state-card"
          [class.active]="getErrorCount(vestForm.formState().errors) > 0"
        >
          <div class="state-icon">⚠️</div>
          <div class="state-label">Errors</div>
          <div class="state-value">
            {{ getErrorCount(vestForm.formState().errors) }}
          </div>
        </div>

        <div
          class="state-card"
          [class.active]="getErrorCount(vestForm.formState().warnings) > 0"
        >
          <div class="state-icon">⚡</div>
          <div class="state-label">Warnings</div>
          <div class="state-value">
            {{ getErrorCount(vestForm.formState().warnings) }}
          </div>
        </div>
      </div>

      <!-- First Name Field -->
      <div
        class="nv-field"
        [attr.data-invalid]="
          vestForm.formState().errors['firstName'] ? 'true' : null
        "
      >
        <div class="input-group">
          <label for="firstName" class="floating-label">
            First Name <span class="required-asterisk">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            [ngModel]="model().firstName"
            placeholder=" "
            aria-describedby="firstName-errors firstName-hint"
            class="nv-input"
            autocomplete="given-name"
          />
        </div>
        <p id="firstName-hint" class="nv-hint">
          Enter your first name (demonstrates multiple validation rules)
        </p>
        @if (vestForm.formState().errors['firstName']; as errs) {
          <ul id="firstName-errors" class="nv-errors" role="alert">
            @for (e of errs; track e) {
              <li class="nv-error">{{ e }}</li>
            }
          </ul>
        }
      </div>

      <!-- Email Field (with async validation) -->
      <div
        class="nv-field"
        [attr.data-invalid]="
          vestForm.formState().errors['email'] ? 'true' : null
        "
      >
        <div class="input-group">
          <label for="email" class="floating-label">
            Email Address <span class="required-asterisk">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            [ngModel]="model().email"
            placeholder=" "
            aria-describedby="email-errors email-hint"
            class="nv-input"
            autocomplete="email"
          />
          @if (vestForm.formState().pending) {
            <div class="pending-indicator" aria-label="Validating email">
              <div class="spinner"></div>
            </div>
          }
        </div>
        <p id="email-hint" class="nv-hint">
          Email with async validation (demonstrates pending state)
        </p>
        @if (vestForm.formState().errors['email']; as errs) {
          <ul id="email-errors" class="nv-errors" role="alert">
            @for (e of errs; track e) {
              <li class="nv-error">{{ e }}</li>
            }
          </ul>
        }
      </div>

      <!-- Age Field (with warnings) -->
      <div
        class="nv-field"
        [attr.data-invalid]="vestForm.formState().errors['age'] ? 'true' : null"
      >
        <div class="input-group">
          <label for="age" class="floating-label">
            Age <span class="required-asterisk">*</span>
          </label>
          <input
            id="age"
            name="age"
            type="number"
            [ngModel]="model().age"
            placeholder=" "
            aria-describedby="age-errors age-warnings age-hint"
            class="nv-input"
            min="13"
            max="120"
          />
        </div>
        <p id="age-hint" class="nv-hint">
          Age validation (demonstrates warnings vs errors)
        </p>
        @if (vestForm.formState().errors['age']; as errs) {
          <ul id="age-errors" class="nv-errors" role="alert">
            @for (e of errs; track e) {
              <li class="nv-error">{{ e }}</li>
            }
          </ul>
        }
        @if (
          vestForm.formState().warnings && vestForm.formState().warnings['age'];
          as warnings
        ) {
          <ul id="age-warnings" class="nv-warnings" role="status">
            @for (w of warnings; track w) {
              <li class="nv-warning">{{ w }}</li>
            }
          </ul>
        }
      </div>

      <!-- Favorite Color (dropdown state demonstration) -->
      <div
        class="nv-field"
        [attr.data-invalid]="
          vestForm.formState().errors['favoriteColor'] ? 'true' : null
        "
      >
        <div class="input-group">
          <label for="favoriteColor" class="floating-label">
            Favorite Color <span class="required-asterisk">*</span>
          </label>
          <select
            id="favoriteColor"
            name="favoriteColor"
            [ngModel]="model().favoriteColor"
            aria-describedby="favoriteColor-errors favoriteColor-hint"
            class="nv-input"
          >
            <option value="" disabled hidden></option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
          </select>
        </div>
        <p id="favoriteColor-hint" class="nv-hint">
          Select your favorite color
        </p>
        @if (vestForm.formState().errors['favoriteColor']; as errs) {
          <ul id="favoriteColor-errors" class="nv-errors" role="alert">
            @for (e of errs; track e) {
              <li class="nv-error">{{ e }}</li>
            }
          </ul>
        }
      </div>

      <!-- Newsletter checkbox (boolean state) -->
      <div class="nv-field">
        <div class="checkbox-group">
          <input
            id="newsletter"
            name="newsletter"
            type="checkbox"
            [ngModel]="model().newsletter"
            class="nv-checkbox"
          />
          <label for="newsletter" class="checkbox-label">
            Subscribe to newsletter
          </label>
        </div>
        <p class="nv-hint">Demonstrates boolean field state handling</p>
      </div>

      <!-- Submit button (state-driven) -->
      <div class="nv-actions">
        <button
          type="submit"
          [disabled]="
            !vestForm.formState().valid || vestForm.formState().pending
          "
          class="nv-btn"
          [class.pending]="vestForm.formState().pending"
        >
          @if (vestForm.formState().pending) {
            <span class="btn-spinner"></span>
            Validating...
          } @else {
            Submit Form
          }
        </button>
        <button
          type="button"
          (click)="resetForm()"
          class="nv-btn nv-btn-secondary"
        >
          Reset
        </button>
      </div>
    </form>
  `,
})
export class FormStateDemoFormComponent {
  protected readonly formStateChange = output<unknown>();

  protected readonly model = signal<FormStateDemoModel>({
    firstName: '',
    email: '',
    age: null,
    newsletter: false,
    favoriteColor: '',
  });

  protected readonly suite = formStateDemoSuite;

  protected getErrorCount(
    errors: Partial<Record<string, string[]>> | undefined,
  ): number {
    return errors ? Object.keys(errors).length : 0;
  }

  protected emitState(state: unknown): void {
    this.formStateChange.emit(state);

    if (isDevMode()) {
      console.log('Form State Demo - Current state:', state);
    }
  }

  protected onSubmit(formState: unknown): void {
    console.log('Form State Demo - Submitted with state:', formState);
    console.log('Form State Demo - Model:', this.model());
  }

  protected resetForm(): void {
    this.model.set({
      firstName: '',
      email: '',
      age: null,
      newsletter: false,
      favoriteColor: '',
    });
  }
}
