import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { NgxVestSuite } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { createSimpleFormValidationSuite } from '../../02-core-features/simple-form/simple-form.validations';

@Component({
  selector: 'ngx-control-wrapper-basics',
  imports: [ngxVestForms, NgxControlWrapper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <div class="prose mb-4 max-w-none">
        <h2>Simple Form (with Control Wrapper)</h2>
        <p>
          Same as the Simple Form, but using
          <code>&lt;ngx-control-wrapper&gt;</code>
          for error/pending display to reduce boilerplate and standardize UX.
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
        ngxVestForm
        [vestSuite]="suite"
        [(formValue)]="model"
        autocomplete="off"
        class="simple-form"
      >
        <div ngxControlWrapper class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            class="form-input"
            autocomplete="email"
            [ngModel]="model().email"
            aria-describedby="email-help"
          />
          <span id="email-help" class="form-help"
            >Enter a valid email address.</span
          >
        </div>

        <button type="button" class="form-submit" disabled>
          Submit (example focuses on wrapper UI)
        </button>
      </form>
    </section>
  `,
})
export class ControlWrapperBasicsComponent {
  protected readonly model = signal<{ email: string }>({ email: '' });
  protected readonly suite =
    createSimpleFormValidationSuite() as unknown as NgxVestSuite;
}
