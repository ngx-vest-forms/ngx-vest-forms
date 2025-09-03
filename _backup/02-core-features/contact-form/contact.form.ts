import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxFormCoreDirective,
  NgxFormModelDirective,
} from 'ngx-vest-forms/core';
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
  imports: [FormsModule, NgxFormCoreDirective, NgxFormModelDirective],
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
      ngxVestFormCore
      [vestSuite]="suite"
      [(formValue)]="formValue"
      #vestForm="ngxVestFormCore"
      autocomplete="off"
      class="nv-form"
    >
      <section class="nv-form-section">
        <div class="nv-field">
          <label for="name" class="nv-label">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autocomplete="off"
            class="nv-input"
            ngModel
            required
            aria-describedby="name-help"
            [attr.aria-invalid]="
              (vestForm.formState().errors['name']?.length || 0) > 0
                ? 'true'
                : 'false'
            "
          />
          <span id="name-help" class="nv-hint">Enter your full name.</span>
          <ul class="nv-errors" aria-live="polite">
            @for (msg of vestForm.formState().errors['name'] || []; track msg) {
              <li class="nv-error">{{ msg }}</li>
            }
          </ul>
        </div>

        <div class="nv-field">
          <label for="email" class="nv-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="off"
            class="nv-input"
            ngModel
            required
            aria-describedby="email-help"
            [attr.aria-invalid]="
              (vestForm.formState().errors['email']?.length || 0) > 0
                ? 'true'
                : 'false'
            "
          />
          <span id="email-help" class="nv-hint"
            >Enter a valid email address.</span
          >
          <ul class="nv-errors" aria-live="polite">
            @for (
              msg of vestForm.formState().errors['email'] || [];
              track msg
            ) {
              <li class="nv-error">{{ msg }}</li>
            }
          </ul>
        </div>

        <button type="submit" class="nv-btn">Submit</button>
      </section>
    </form>
  `,
})
export class ContactFormComponent {
  protected readonly suite = contactFormSuite;
  protected readonly formValue = signal<ContactForm>({ name: '', email: '' });
}
