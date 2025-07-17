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
  template: `
    <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
      Demonstrates server-side validation with debounced async checks for
      username availability and email uniqueness.
    </p>

    <div class="mb-6 rounded border border-blue-300 bg-blue-50 p-4">
      <h4 class="font-medium text-blue-800">🔄 Implementation Needed</h4>
      <p class="mt-1 text-sm text-blue-700">
        This example will demonstrate async validation features:
      </p>
      <ul class="ml-4 mt-2 list-disc text-sm text-blue-700">
        <li>Debounced username availability checking</li>
        <li>Email uniqueness validation against server</li>
        <li>Website URL validation with actual HTTP checks</li>
        <li>Loading states and error handling</li>
        <li>Proper async validation patterns with Vest</li>
      </ul>
    </div>

    <form
      ngxVestForm
      [(formValue)]="formValue"
      (ngSubmit)="onSubmit()"
      #vestForm="ngxVestForm"
      class="space-y-4"
    >
      <ngx-control-wrapper>
        <label class="block text-sm font-medium">
          Username *
          <input
            type="text"
            name="username"
            ngModel
            placeholder="Enter unique username"
            class="mt-1 block w-full rounded border px-3 py-2"
          />
        </label>
        <div class="mt-1 text-xs text-gray-500">
          Will check availability on server
        </div>
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label class="block text-sm font-medium">
          Email *
          <input
            type="email"
            name="email"
            ngModel
            placeholder="Enter unique email"
            class="mt-1 block w-full rounded border px-3 py-2"
          />
        </label>
        <div class="mt-1 text-xs text-gray-500">
          Will verify email is not already registered
        </div>
      </ngx-control-wrapper>

      <ngx-control-wrapper>
        <label class="block text-sm font-medium">
          Website
          <input
            type="url"
            name="website"
            ngModel
            placeholder="https://your-website.com"
            class="mt-1 block w-full rounded border px-3 py-2"
          />
        </label>
        <div class="mt-1 text-xs text-gray-500">
          Will check if URL is reachable
        </div>
      </ngx-control-wrapper>

      <button
        type="submit"
        class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Register (Async Validation)
      </button>
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
