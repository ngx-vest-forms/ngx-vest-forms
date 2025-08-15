import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxFormCoreDirective } from 'ngx-vest-forms/core';
import {
  createRegistrationValidationSuite,
  RegistrationFormData,
} from '../../02-core-features/registration-form/registration-form.validations';

@Component({
  selector: 'ngx-registration-with-wrapper',
  imports: [FormsModule, NgxFormCoreDirective, NgxControlWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="prose mb-4 max-w-none">
        <h2>Registration (with Control Wrapper)</h2>
        <p>
          Mirrors the Registration Form but wraps each control with
          <code>&lt;ngx-control-wrapper&gt;</code> to simplify error handling
          and pending state UI.
        </p>
        <p class="text-sm">
          See:
          <a
            href="https://github.com/simplifiedcourses/ngx-vest-forms"
            target="_blank"
            >README</a
          >
          ·
          <a
            href="https://github.com/simplifiedcourses/ngx-vest-forms/tree/master/projects/ngx-vest-forms/control-wrapper"
            target="_blank"
            >Control Wrapper Docs</a
          >
        </p>
      </div>

      <form
        ngxVestFormCore
        [vestSuite]="suite"
        [(formValue)]="model"
        autocomplete="off"
        class="simple-form"
      >
        <ngx-control-wrapper>
          <label for="email" class="form-label">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            class="form-input"
            autocomplete="email"
            [ngModel]="model().email"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            class="form-input"
            autocomplete="new-password"
            aria-describedby="passwordHelp"
            [ngModel]="model().password"
          />
          <div id="passwordHelp" class="form-help">
            Password must be at least 8 characters with uppercase letter and
            number
          </div>
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label for="confirmPassword" class="form-label"
            >Confirm Password</label
          >
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            class="form-input"
            autocomplete="new-password"
            [ngModel]="model().confirmPassword"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper>
          <label class="inline-flex items-center gap-2">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              class="form-checkbox"
              [ngModel]="model().agreeToTerms"
            />
            <span
              >I agree to the <a href="#">Terms and Conditions</a> and
              <a href="#">Privacy Policy</a></span
            >
          </label>
        </ngx-control-wrapper>

        <button type="button" class="form-submit" disabled>
          Register (example focuses on wrapper UI)
        </button>
      </form>
    </section>
  `,
})
export class RegistrationWithWrapperComponent {
  protected readonly model = signal<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  protected readonly suite = createRegistrationValidationSuite();
}
