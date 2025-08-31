import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  NgxFormDirective,
  NgxFormErrorDisplayDirective,
  ngxVestForms,
} from 'ngx-vest-forms';
import {
  MinimalFormModel,
  minimalFormValidationSuite,
} from './minimal-form.validations';

@Component({
  selector: 'ngx-minimal-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ngxVestForms, NgxFormErrorDisplayDirective],
  template: `
    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="form-container"
    >
      <div
        class="form-field"
        ngxFormErrorDisplay
        #emailDisplay="formErrorDisplay"
      >
        <label class="form-label" for="email"> Email Address </label>
        <input
          id="email"
          class="form-input"
          name="email"
          type="email"
          [ngModel]="model().email"
          placeholder="you@example.com"
          [attr.aria-invalid]="emailDisplay.shouldShowErrors() ? 'true' : null"
          [attr.aria-describedby]="
            emailDisplay.shouldShowErrors() ? 'email-error' : null
          "
        />

        @if (emailDisplay.shouldShowErrors()) {
          @if (emailDisplay.errors().length) {
            <div class="form-error" id="email-error" role="alert">
              {{ emailDisplay.errors()[0] }}
            </div>
          }
        }
      </div>

      <div class="form-actions">
        <button
          class="btn-primary"
          type="submit"
          [disabled]="
            !vestForm.formState().valid || vestForm.formState().pending
          "
        >
          Submit
        </button>
      </div>
    </form>
  `,
})
export class MinimalForm {
  protected readonly suite = minimalFormValidationSuite;
  protected readonly model = signal<MinimalFormModel>({ email: '' });
  protected readonly vestFormRef =
    viewChild.required<NgxFormDirective>('vestForm');
  /**
   * Expose the form state
   * This allows the parent component to access the current form state.
   */
  readonly formState = computed(() => this.vestFormRef().formState());

  // Form submission handler
  onSubmit() {
    console.log('Form submitted:', this.model());
  }
}
