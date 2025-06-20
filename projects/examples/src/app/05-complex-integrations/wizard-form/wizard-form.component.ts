import { Component, signal } from '@angular/core';
import { ngxVestForms } from 'ngx-vest-forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';

type WizardForm = {
  // Step 1: Personal Info
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  // Step 2: Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  // Step 3: Preferences
  preferences: {
    newsletter: boolean;
    notifications: string;
    interests: string[];
  };
};

@Component({
  selector: 'ngx-wizard-form',
  imports: [ngxVestForms, NgxControlWrapper],
  template: `
    <div
      class="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Multi-step Wizard Form Example
      </h3>
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Complex multi-step form with navigation, progress indicator, and step
        validation.
      </p>

      <!-- Progress Indicator -->
      <div class="mb-6">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium"
            >Step {{ currentStep() }} of {{ totalSteps }}</span
          >
          <span class="text-sm text-gray-500"
            >{{ Math.round((currentStep() / totalSteps) * 100) }}%
            Complete</span
          >
        </div>
        <div class="h-2 w-full rounded-full bg-gray-200">
          <div
            class="h-2 rounded-full bg-blue-600 transition-all duration-300"
            [style.width.%]="(currentStep() / totalSteps) * 100"
          ></div>
        </div>

        <div class="mt-3 flex justify-between">
          <span
            class="text-xs"
            [class.font-medium]="currentStep() >= 1"
            [class.text-blue-600]="currentStep() >= 1"
            >Personal</span
          >
          <span
            class="text-xs"
            [class.font-medium]="currentStep() >= 2"
            [class.text-blue-600]="currentStep() >= 2"
            >Address</span
          >
          <span
            class="text-xs"
            [class.font-medium]="currentStep() >= 3"
            [class.text-blue-600]="currentStep() >= 3"
            >Preferences</span
          >
        </div>
      </div>

      <div class="mb-6 rounded border border-purple-300 bg-purple-50 p-4">
        <h4 class="font-medium text-purple-800">🧙‍♂️ Implementation Needed</h4>
        <p class="mt-1 text-sm text-purple-700">
          This example will demonstrate multi-step form features:
        </p>
        <ul class="ml-4 mt-2 list-disc text-sm text-purple-700">
          <li>Step-by-step validation with conditional progress</li>
          <li>Data persistence across steps</li>
          <li>Dynamic navigation with step validation</li>
          <li>Progress indicator and breadcrumbs</li>
          <li>Summary and review step</li>
          <li>Form state management across complex workflows</li>
        </ul>
      </div>

      <form
        ngxVestForm
        [(formValue)]="formValue"
        (ngSubmit)="onSubmit()"
        #vestForm="ngxVestForm"
        class="space-y-4"
      >
        <!-- Step 1: Personal Information -->
        @if (currentStep() === 1) {
          <div class="space-y-4">
            <h4 class="text-lg font-medium">Personal Information</h4>

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
          </div>
        }

        <!-- Step 2: Address -->
        @if (currentStep() === 2) {
          <div class="space-y-4">
            <h4 class="text-lg font-medium">Address Information</h4>

            <ngx-control-wrapper>
              <label class="block text-sm font-medium">
                Street Address *
                <input
                  type="text"
                  name="address.street"
                  ngModel
                  placeholder="Enter street address"
                  class="mt-1 block w-full rounded border px-3 py-2"
                />
              </label>
            </ngx-control-wrapper>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ngx-control-wrapper>
                <label class="block text-sm font-medium">
                  City *
                  <input
                    type="text"
                    name="address.city"
                    ngModel
                    placeholder="City"
                    class="mt-1 block w-full rounded border px-3 py-2"
                  />
                </label>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label class="block text-sm font-medium">
                  State *
                  <input
                    type="text"
                    name="address.state"
                    ngModel
                    placeholder="State"
                    class="mt-1 block w-full rounded border px-3 py-2"
                  />
                </label>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label class="block text-sm font-medium">
                  ZIP Code *
                  <input
                    type="text"
                    name="address.zipCode"
                    ngModel
                    placeholder="ZIP"
                    class="mt-1 block w-full rounded border px-3 py-2"
                  />
                </label>
              </ngx-control-wrapper>
            </div>
          </div>
        }

        <!-- Step 3: Preferences -->
        @if (currentStep() === 3) {
          <div class="space-y-4">
            <h4 class="text-lg font-medium">Preferences</h4>

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

            <ngx-control-wrapper>
              <label class="block text-sm font-medium">
                Notification Preference
                <select
                  name="preferences.notifications"
                  ngModel
                  class="mt-1 block w-full rounded border px-3 py-2"
                >
                  <option value="">Select preference</option>
                  <option value="email">Email only</option>
                  <option value="sms">SMS only</option>
                  <option value="both">Both email and SMS</option>
                  <option value="none">No notifications</option>
                </select>
              </label>
            </ngx-control-wrapper>
          </div>
        }

        <!-- Navigation Buttons -->
        <div class="flex justify-between pt-6">
          <button
            type="button"
            (click)="previousStep()"
            [disabled]="currentStep() === 1"
            class="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          @if (currentStep() < totalSteps) {
            <button
              type="button"
              (click)="nextStep()"
              class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Next
            </button>
          } @else {
            <button
              type="submit"
              class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Complete
            </button>
          }
        </div>
      </form>
    </div>
  `,
})
export class WizardFormComponent {
  protected readonly currentStep = signal(1);
  protected readonly totalSteps = 3;

  protected readonly formValue = signal<WizardForm>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    preferences: {
      newsletter: false,
      notifications: '',
      interests: [],
    },
  });

  protected readonly Math = Math;

  protected nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
    }
  }

  protected previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  protected onSubmit(): void {
    alert('Wizard completed! All data collected.');
    console.log('Wizard data:', this.formValue());
  }
}
