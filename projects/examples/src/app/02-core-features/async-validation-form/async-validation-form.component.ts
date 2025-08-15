import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

type AsyncValidationForm = {
  username: string;
  email: string;
  website: string;
};

@Component({
  selector: 'ngx-async-validation-form',
  imports: [ngxVestForms, NgxControlWrapper],
  styleUrls: ['./async-validation-form.component.scss'],
  template: `
    <section class="form-section">
      <div class="prose mb-4 max-w-none">
        <h2>Async Validation Form</h2>
        <p>
          Purpose: Demonstrates debounced server checks and async validation
          patterns with Vest and ngx-vest-forms.
        </p>
        <p class="text-sm">
          See:
          <a
            href="https://github.com/simplifiedcourses/ngx-vest-forms"
            target="_blank"
            >README</a
          >
          · <a href="https://vestjs.dev" target="_blank">Vest Docs</a>
        </p>
      </div>
      <div class="form-section-description">
        Demonstrates server-side validation with debounced async checks for
        username availability and email uniqueness.
      </div>

      <div class="info-box">
        <h4 class="info-box-title">🔄 Implementation Needed</h4>
        <p class="info-box-text">
          This example will demonstrate async validation features:
        </p>
        <ul class="info-box-list">
          <li>Debounced username availability checking</li>
          <li>Email uniqueness validation against server</li>
          <li>Website URL validation with actual HTTP checks</li>
          <li>Loading states and error handling</li>
          <li>Proper async validation patterns with Vest</li>
        </ul>
      </div>
    </section>

    <form
      ngxVestForm
      [(formValue)]="formValue"
      (ngSubmit)="onSubmit()"
      #vestForm="ngxVestForm"
      class="form"
    >
      <section class="form-section">
        <ngx-control-wrapper class="form-group">
          <label for="username" class="form-label"> Username * </label>
          <input
            id="username"
            type="text"
            name="username"
            ngModel
            placeholder="Enter unique username"
            class="form-input"
          />
          <div class="form-help">Will check availability on server</div>
        </ngx-control-wrapper>

        <ngx-control-wrapper class="form-group">
          <label for="email" class="form-label"> Email * </label>
          <input
            id="email"
            type="email"
            name="email"
            ngModel
            placeholder="Enter unique email"
            class="form-input"
          />
          <div class="form-help">
            Will verify email is not already registered
          </div>
        </ngx-control-wrapper>

        <ngx-control-wrapper class="form-group">
          <label for="website" class="form-label"> Website </label>
          <input
            id="website"
            type="url"
            name="website"
            ngModel
            placeholder="https://your-website.com"
            class="form-input"
          />
          <div class="form-help">Will check if URL is reachable</div>
        </ngx-control-wrapper>

        <button type="submit" class="form-submit">
          Register (Async Validation)
        </button>
      </section>
    </form>
  `,
})
export class AsyncValidationFormComponent {
  protected readonly formValue = signal<AsyncValidationForm>({
    username: '',
    email: '',
    website: '',
  });

  protected onSubmit(): void {
    alert('Registration would proceed after async validation!');
  }
}
