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
  template: `
    <div
      class="w-full rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 class="mb-4 text-2xl font-bold">Contact Form</h2>
      <form
        ngxVestForm
        [vestSuite]="suite"
        [(formValue)]="formValue"
        #vestForm="ngxVestForm"
        autocomplete="off"
        class="space-y-6"
      >
        <ngx-control-wrapper
          errorDisplayMode="on-blur-or-submit"
          class="space-y-1"
        >
          <label
            for="name"
            class="block font-medium text-gray-700 dark:text-gray-200"
            >Name</label
          >
          <input
            id="name"
            name="name"
            type="text"
            autocomplete="off"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            ngModel
            required
            aria-describedby="name-help"
            aria-invalid="false"
          />
          <span id="name-help" class="text-xs text-gray-500"
            >Enter your full name.</span
          >
        </ngx-control-wrapper>
        <ngx-control-wrapper
          errorDisplayMode="on-blur-or-submit"
          class="space-y-1"
        >
          <label
            for="email"
            class="block font-medium text-gray-700 dark:text-gray-200"
            >Email</label
          >
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="off"
            class="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            ngModel
            required
            aria-describedby="email-help"
            aria-invalid="false"
          />
          <span id="email-help" class="text-xs text-gray-500"
            >Enter a valid email address.</span
          >
        </ngx-control-wrapper>
        <button
          type="submit"
          class="mt-4 w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
    </div>
  `,
})
export class ContactFormComponent {
  protected readonly suite = contactFormSuite;
  protected readonly formValue = signal<ContactForm>({ name: '', email: '' });
}
