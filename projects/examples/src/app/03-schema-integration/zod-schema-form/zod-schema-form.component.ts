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
  styleUrls: ['./zod-schema-form.component.scss'],
  template: `
    <section class="form-section">
      <div class="form-section-description">
        This example will demonstrate type-safe forms using Zod schemas with
        automatic TypeScript inference.
        <strong>Note:</strong> This is a placeholder - full Zod integration
        requires additional setup.
      </div>

      <div class="info-box">
        <h4 class="info-box-title">🚧 Implementation Needed</h4>
        <ul class="info-box-list">
          <li>Automatic TypeScript type inference from Zod schemas</li>
          <li>Schema-based validation with custom error messages</li>
          <li>Runtime type checking and validation</li>
          <li>Seamless integration with ngx-vest-forms</li>
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
      <!-- Personal Info Section -->
      <section class="form-section">
        <h4 class="form-section-title">Personal Information</h4>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ngx-control-wrapper class="form-group">
            <label for="firstName" class="form-label">First Name *</label>
            <input
              id="firstName"
              type="text"
              name="personalInfo.firstName"
              ngModel
              placeholder="Enter first name"
              class="form-input"
            />
          </ngx-control-wrapper>

          <ngx-control-wrapper class="form-group">
            <label for="lastName" class="form-label">Last Name *</label>
            <input
              id="lastName"
              type="text"
              name="personalInfo.lastName"
              ngModel
              placeholder="Enter last name"
              class="form-input"
            />
          </ngx-control-wrapper>
        </div>

        <ngx-control-wrapper class="form-group">
          <label for="email" class="form-label">Email *</label>
          <input
            id="email"
            type="email"
            name="personalInfo.email"
            ngModel
            placeholder="Enter email address"
            class="form-input"
          />
        </ngx-control-wrapper>

        <ngx-control-wrapper class="form-group">
          <label for="dateOfBirth" class="form-label">Date of Birth *</label>
          <input
            id="dateOfBirth"
            type="date"
            name="personalInfo.dateOfBirth"
            ngModel
            class="form-input"
          />
        </ngx-control-wrapper>
      </section>

      <!-- Bio Section -->
      <section class="form-section">
        <ngx-control-wrapper class="form-group">
          <label for="bio" class="form-label">Bio *</label>
          <textarea
            id="bio"
            name="bio"
            ngModel
            rows="3"
            placeholder="Tell us about yourself (10-500 characters)"
            class="form-textarea"
          ></textarea>
        </ngx-control-wrapper>
      </section>

      <!-- Preferences Section -->
      <section class="form-section">
        <h4 class="form-section-title">Preferences</h4>

        <ngx-control-wrapper class="form-group">
          <label class="form-label flex items-center">
            <input
              type="checkbox"
              name="preferences.newsletter"
              ngModel
              class="form-checkbox"
            />
            <span class="ms-2">Subscribe to newsletter</span>
          </label>
        </ngx-control-wrapper>

        <div class="form-group">
          <span class="form-label">Notifications</span>
          <div class="space-y-2">
            <ngx-control-wrapper class="form-group">
              <label class="form-label flex items-center">
                <input
                  type="checkbox"
                  name="preferences.notifications.email"
                  ngModel
                  class="form-checkbox"
                />
                <span class="ms-2">Email notifications</span>
              </label>
            </ngx-control-wrapper>

            <ngx-control-wrapper class="form-group">
              <label class="form-label flex items-center">
                <input
                  type="checkbox"
                  name="preferences.notifications.sms"
                  ngModel
                  class="form-checkbox"
                />
                <span class="ms-2">SMS notifications</span>
              </label>
            </ngx-control-wrapper>
          </div>
        </div>
      </section>

      <button type="submit" class="form-submit">
        Save Profile (Zod Validation)
      </button>

      <section class="form-section">
        <div class="form-help">Form Value: {{ formValue() | json }}</div>
      </section>
    </form>
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
