import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
// Note: Zod integration example - requires zod to be installed
// import { z } from 'zod';
// import { InferSchemaType, ngxModelToStandardSchema } from 'ngx-vest-forms/schemas';

// Placeholder type until Zod is properly integrated
type UserProfile = {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
  };
  preferences: {
    newsletter: boolean;
    notifications: {
      email: boolean;
      sms: boolean;
    };
  };
  bio: string;
};

@Component({
  selector: 'ngx-zod-schema-form',
  imports: [ngxVestForms, NgxControlWrapper, JsonPipe],
  template: `
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Zod Schema Integration Example
      </h3>
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
        This example will demonstrate type-safe forms using Zod schemas with
        automatic TypeScript inference.
        <br />
        <strong>Note:</strong> This is a placeholder - full Zod integration
        requires additional setup.
      </p>

      <div class="mb-6 rounded border border-yellow-300 bg-yellow-50 p-4">
        <h4 class="font-medium text-yellow-800">🚧 Implementation Needed</h4>
        <p class="mt-1 text-sm text-yellow-700">
          This example demonstrates where Zod schema integration would be
          implemented. Key features would include:
        </p>
        <ul class="ml-4 mt-2 list-disc text-sm text-yellow-700">
          <li>Automatic TypeScript type inference from Zod schemas</li>
          <li>Schema-based validation with custom error messages</li>
          <li>Runtime type checking and validation</li>
          <li>Seamless integration with ngx-vest-forms</li>
        </ul>
      </div>

      <form
        ngxVestForm
        [(formValue)]="formValue"
        (ngSubmit)="onSubmit()"
        #vestForm="ngxVestForm"
        class="space-y-4"
      >
        <!-- Personal Info Section -->
        <div class="rounded border p-4">
          <h4 class="mb-3 font-medium">Personal Information</h4>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ngx-control-wrapper>
              <label class="block text-sm font-medium">
                First Name *
                <input
                  type="text"
                  name="personalInfo.firstName"
                  ngModel
                  placeholder="Enter first name"
                  class="mt-1 block w-full rounded border px-3 py-2"
                />
              </label>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label class="block text-sm font-medium">
                Last Name *
                <input
                  type="text"
                  name="personalInfo.lastName"
                  ngModel
                  placeholder="Enter last name"
                  class="mt-1 block w-full rounded border px-3 py-2"
                />
              </label>
            </ngx-control-wrapper>
          </div>

          <ngx-control-wrapper>
            <label class="block text-sm font-medium">
              Email *
              <input
                type="email"
                name="personalInfo.email"
                ngModel
                placeholder="Enter email address"
                class="mt-1 block w-full rounded border px-3 py-2"
              />
            </label>
          </ngx-control-wrapper>

          <ngx-control-wrapper>
            <label class="block text-sm font-medium">
              Date of Birth *
              <input
                type="date"
                name="personalInfo.dateOfBirth"
                ngModel
                class="mt-1 block w-full rounded border px-3 py-2"
              />
            </label>
          </ngx-control-wrapper>
        </div>

        <!-- Bio Section -->
        <ngx-control-wrapper>
          <label class="block text-sm font-medium">
            Bio *
            <textarea
              name="bio"
              ngModel
              rows="3"
              placeholder="Tell us about yourself (10-500 characters)"
              class="mt-1 block w-full rounded border px-3 py-2"
            ></textarea>
          </label>
        </ngx-control-wrapper>

        <!-- Preferences Section -->
        <div class="rounded border p-4">
          <h4 class="mb-3 font-medium">Preferences</h4>

          <ngx-control-wrapper>
            <label class="flex items-center">
              <input
                type="checkbox"
                name="preferences.newsletter"
                ngModel
                class="rounded"
              />
              <span class="ms-2">Subscribe to newsletter</span>
            </label>
          </ngx-control-wrapper>

          <div class="mt-3">
            <span class="mb-2 block text-sm font-medium">Notifications</span>

            <ngx-control-wrapper>
              <label class="mb-2 flex items-center">
                <input
                  type="checkbox"
                  name="preferences.notifications.email"
                  ngModel
                  class="rounded"
                />
                <span class="ms-2">Email notifications</span>
              </label>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label class="flex items-center">
                <input
                  type="checkbox"
                  name="preferences.notifications.sms"
                  ngModel
                  class="rounded"
                />
                <span class="ms-2">SMS notifications</span>
              </label>
            </ngx-control-wrapper>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Save Profile (Zod Validation)
        </button>

        <!-- Form State Debug -->
        <div class="mt-4 rounded bg-gray-50 p-3 text-xs">
          <div>Form Value: {{ formValue() | json }}</div>
        </div>
      </form>
    </div>
  `,
})
export class ZodSchemaFormComponent {
  /**
   * Form value with TypeScript type safety
   */
  protected readonly formValue = signal<UserProfile>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
    },
    preferences: {
      newsletter: false,
      notifications: {
        email: true,
        sms: false,
      },
    },
    bio: '',
  });

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    const data = this.formValue();
    alert('Profile saved (Zod validation would be applied here)!');
    console.log('Form data:', data);
  }
}
