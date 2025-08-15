import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { enforce, staticSuite, test } from 'vest';

type ContactForm = {
  name: string;
  email: string;
};

const contactFormSuite = staticSuite((data = {}) => {
  test('name', 'Name is required', () => {
    enforce(data.name).isNotEmpty();
  });
  test('email', 'Email is required', () => {
    enforce(data.email).isNotEmpty();
    enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
  });
});

@Component({
  selector: 'ngx-contact-form',
  imports: [ngxVestForms, NgxControlWrapper],
  styleUrls: ['./contact-form.component.scss'],
  template: `
    <section class="prose mb-4 max-w-none">
      <h2>Contact Form</h2>
      <p>
        Purpose: Demonstrates basic form with control wrapper, field-level
        validation, and accessible labeling. Showcases how
        <code>ngx-vest-forms</code> wires Vest to template-driven inputs.
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
    </section>
    <div class="info-box">
      <h4 class="info-box-title">ℹ️ Why use simple <code>ngModel</code>?</h4>
      <p class="info-box-text">
        This form uses the simple <code>ngModel</code> syntax for all controls.
        This approach provides automatic two-way binding between the form
        controls and the model signal, with minimal boilerplate.
        <code>ngx-vest-forms</code>
        handles all value syncing, error display, and validation logic. Use
        <code>[ngModel]</code> only if you need explicit control over the data
        flow or are working with computed values.
      </p>
    </div>

    <form
      ngxVestForm
      [vestSuite]="suite"
      [(formValue)]="formValue"
      #vestForm="ngxVestForm"
      autocomplete="off"
      class="form"
    >
      <section class="form-section">
        <ngx-control-wrapper
          errorDisplayMode="on-blur-or-submit"
          class="form-group"
        >
          <label for="name" class="form-label">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autocomplete="off"
            class="form-input"
            ngModel
            required
            aria-describedby="name-help"
            aria-invalid="false"
          />
          <span id="name-help" class="form-help">Enter your full name.</span>
        </ngx-control-wrapper>

        <ngx-control-wrapper
          errorDisplayMode="on-blur-or-submit"
          class="form-group"
        >
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="off"
            class="form-input"
            ngModel
            required
            aria-describedby="email-help"
            aria-invalid="false"
          />
          <span id="email-help" class="form-help"
            >Enter a valid email address.</span
          >
        </ngx-control-wrapper>

        <button type="submit" class="form-submit">Submit</button>
      </section>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly suite = contactFormSuite;
  protected readonly formValue = signal<ContactForm>({ name: '', email: '' });
}
