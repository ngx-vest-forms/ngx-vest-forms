import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxControlWrapper } from 'ngx-vest-forms/control-wrapper';
import { NgxFormDirective, ngxVestForms } from 'ngx-vest-forms/core';
import { CardComponent } from '../../ui';
import {
  Address,
  ContactInfo,
  createAddress,
  createContactInfo,
  DynamicContactFormModel,
  dynamicContactFormValidationSuite,
  generateId,
  validateArrayRequirements,
} from './dynamic-arrays.validations';

/**
 * Dynamic Arrays Form Component
 *
 * Advanced demonstration of Vest.js `each()` functionality with ngx-vest-forms.
 * Showcases complex array validation patterns and dynamic form management.
 *
 * 🚀 Key Features:
 * - Dynamic array management (add/remove/reorder)
 * - Complex nested validation within arrays
 * - Async validation for array items
 * - Stable ID management for performance
 * - Cross-array validation logic
 * - Primary contact designation
 *
 * @example
 * ```html
 * <app-dynamic-arrays-form />
 * ```
 */
@Component({
  selector: 'app-dynamic-arrays-form',
  imports: [FormsModule, ngxVestForms, NgxControlWrapper, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      ngxVestForm
      [vestSuite]="validationSuite"
      [(formValue)]="formData"
      #vestForm="ngxVestForm"
      (ngSubmit)="onSubmit()"
      class="space-y-8"
    >
      <!-- Basic Information Section -->
      <section class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Basic Information
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ngx-control-wrapper>
            <label for="firstName">First Name *</label>
            <input
              id="firstName"
              name="firstName"
              [ngModel]="formData().firstName"
              type="text"
              class="form-input"
            />
          </ngx-control-wrapper>

          <ngx-control-wrapper>
            <label for="lastName">Last Name *</label>
            <input
              id="lastName"
              name="lastName"
              [ngModel]="formData().lastName"
              type="text"
              class="form-input"
            />
          </ngx-control-wrapper>
        </div>

        <ngx-control-wrapper>
          <label for="company">Company</label>
          <input
            id="company"
            name="company"
            [ngModel]="formData().company"
            type="text"
            class="form-input"
          />
        </ngx-control-wrapper>
      </section>

      <!-- Contact Information Array Section -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Contact Information ({{ contactInfoCount() }})
          </h3>
          <div class="flex gap-2">
            <button
              type="button"
              (click)="addContactInfo('email')"
              class="btn btn-sm btn-secondary"
            >
              Add Email
            </button>
            <button
              type="button"
              (click)="addContactInfo('phone')"
              class="btn btn-sm btn-secondary"
            >
              Add Phone
            </button>
          </div>
        </div>

        @if (contactInfoCount() === 0) {
          <div
            class="rounded-lg bg-gray-50 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          >
            <p class="mb-2">No contact information added yet</p>
            <button
              type="button"
              (click)="addContactInfo('email')"
              class="btn btn-primary"
            >
              Add First Contact
            </button>
          </div>
        }

        @for (
          contact of formData().contactInfo;
          track contact.id;
          let i = $index
        ) {
          <ngx-card class="space-y-4" data-testid="contact-item">
            <div class="flex items-center justify-between">
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ getContactTypeLabel(contact.type) }} #{{ i + 1 }}
              </span>
              <div class="flex items-center gap-2">
                @if (contact.isPrimary) {
                  <span
                    class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    Primary
                  </span>
                }
                <button
                  type="button"
                  (click)="removeContactInfo(i)"
                  class="text-red-600 hover:text-red-800 dark:text-red-400"
                  title="Remove contact"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ngx-control-wrapper>
                <label [for]="'contactInfo.' + i + '.type'">Type</label>
                <select
                  [id]="'contactInfo.' + i + '.type'"
                  [name]="'contactInfo.' + i + '.type'"
                  [ngModel]="contact.type"
                  class="form-select"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label [for]="'contactInfo.' + i + '.label'">Label</label>
                <input
                  [id]="'contactInfo.' + i + '.label'"
                  [name]="'contactInfo.' + i + '.label'"
                  [ngModel]="contact.label"
                  type="text"
                  class="form-input"
                  placeholder="e.g., Work Email, Mobile Phone"
                />
              </ngx-control-wrapper>
            </div>

            <ngx-control-wrapper>
              <label [for]="'contactInfo.' + i + '.value'">
                {{
                  contact.type === 'email' ? 'Email Address' : 'Phone Number'
                }}
                *
              </label>
              <input
                [id]="'contactInfo.' + i + '.value'"
                [name]="'contactInfo.' + i + '.value'"
                [ngModel]="contact.value"
                [type]="contact.type === 'email' ? 'email' : 'tel'"
                class="form-input"
                [placeholder]="
                  contact.type === 'email' ? 'user@example.com' : '555-123-4567'
                "
              />
            </ngx-control-wrapper>

            <div class="flex items-center">
              <input
                [id]="'contactInfo.' + i + '.isPrimary'"
                [name]="'contactInfo.' + i + '.isPrimary'"
                [ngModel]="contact.isPrimary"
                type="checkbox"
                class="form-checkbox"
              />
              <label
                [for]="'contactInfo.' + i + '.isPrimary'"
                class="ml-2 text-sm"
              >
                Set as primary contact
              </label>
            </div>
          </ngx-card>
        }
      </section>

      <!-- Addresses Array Section -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Addresses ({{ addressCount() }})
          </h3>
          <div class="flex gap-2">
            <button
              type="button"
              (click)="addAddress('home')"
              class="btn btn-sm btn-secondary"
            >
              Add Home
            </button>
            <button
              type="button"
              (click)="addAddress('work')"
              class="btn btn-sm btn-secondary"
            >
              Add Work
            </button>
          </div>
        </div>

        @if (addressCount() === 0) {
          <div
            class="rounded-lg bg-gray-50 py-8 text-center text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          >
            <p class="mb-2">No addresses added yet</p>
            <button
              type="button"
              (click)="addAddress('home')"
              class="btn btn-primary"
            >
              Add First Address
            </button>
          </div>
        }

        @for (
          address of formData().addresses;
          track address.id;
          let i = $index
        ) {
          <ngx-card class="space-y-4" data-testid="address-item">
            <div class="flex items-center justify-between">
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ getAddressTypeLabel(address.type) }} Address #{{ i + 1 }}
              </span>
              <button
                type="button"
                (click)="removeAddress(i)"
                class="text-red-600 hover:text-red-800 dark:text-red-400"
                title="Remove address"
              >
                🗑️
              </button>
            </div>

            <ngx-control-wrapper>
              <label [for]="'addresses.' + i + '.type'">Address Type</label>
              <select
                [id]="'addresses.' + i + '.type'"
                [name]="'addresses.' + i + '.type'"
                [ngModel]="address.type"
                class="form-select"
              >
                <option value="home">🏠 Home</option>
                <option value="work">🏢 Work</option>
                <option value="billing">💳 Billing</option>
                <option value="shipping">📦 Shipping</option>
              </select>
            </ngx-control-wrapper>

            <ngx-control-wrapper>
              <label [for]="'addresses.' + i + '.street'"
                >Street Address *</label
              >
              <input
                [id]="'addresses.' + i + '.street'"
                [name]="'addresses.' + i + '.street'"
                [ngModel]="address.street"
                type="text"
                class="form-input"
                placeholder="123 Main Street"
              />
            </ngx-control-wrapper>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ngx-control-wrapper>
                <label [for]="'addresses.' + i + '.city'">City *</label>
                <input
                  [id]="'addresses.' + i + '.city'"
                  [name]="'addresses.' + i + '.city'"
                  [ngModel]="address.city"
                  type="text"
                  class="form-input"
                  placeholder="New York"
                />
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label [for]="'addresses.' + i + '.state'">State *</label>
                <input
                  [id]="'addresses.' + i + '.state'"
                  [name]="'addresses.' + i + '.state'"
                  [ngModel]="address.state"
                  type="text"
                  class="form-input"
                  placeholder="NY"
                />
              </ngx-control-wrapper>

              <ngx-control-wrapper>
                <label [for]="'addresses.' + i + '.zipCode'">ZIP Code *</label>
                <input
                  [id]="'addresses.' + i + '.zipCode'"
                  [name]="'addresses.' + i + '.zipCode'"
                  [ngModel]="address.zipCode"
                  type="text"
                  class="form-input"
                  placeholder="10001"
                />
              </ngx-control-wrapper>
            </div>

            <ngx-control-wrapper>
              <label [for]="'addresses.' + i + '.country'">Country *</label>
              <select
                [id]="'addresses.' + i + '.country'"
                [name]="'addresses.' + i + '.country'"
                [ngModel]="address.country"
                class="form-select"
              >
                <option value="US">🇺🇸 United States</option>
                <option value="CA">🇨🇦 Canada</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="DE">🇩🇪 Germany</option>
                <option value="FR">🇫🇷 France</option>
              </select>
            </ngx-control-wrapper>
          </ngx-card>
        }
      </section>

      <!-- Preferences Section -->
      <section class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Preferences
        </h3>

        <ngx-control-wrapper>
          <label for="preferredContactMethod">Preferred Contact Method</label>
          <select
            id="preferredContactMethod"
            name="preferredContactMethod"
            [ngModel]="formData().preferredContactMethod"
            class="form-select"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </ngx-control-wrapper>

        <div class="flex items-center">
          <input
            id="allowMarketing"
            name="allowMarketing"
            [ngModel]="formData().allowMarketing"
            type="checkbox"
            class="form-checkbox"
          />
          <label for="allowMarketing" class="ml-2">
            Allow marketing communications
          </label>
        </div>
      </section>

      <!-- Array Summary -->
      @if (arrayValidationSummary(); as summary) {
        <div
          class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <h4
            class="mb-2 text-sm font-semibold text-blue-800 dark:text-blue-200"
          >
            Array Validation Summary
          </h4>
          <div class="space-y-1 text-sm text-blue-700 dark:text-blue-300">
            <p>✅ Contacts: {{ contactInfoCount() }} (min 1 required)</p>
            <p>✅ Addresses: {{ addressCount() }} (min 1 required)</p>
            <p>
              {{ hasPrimaryContact() ? '✅' : '⚠️' }} Primary Contact:
              {{ hasPrimaryContact() ? 'Set' : 'Not set' }}
            </p>
            @if (!summary.isValid) {
              <div class="mt-2 text-red-600 dark:text-red-400">
                <p class="font-medium">Issues to resolve:</p>
                @for (error of summary.errors; track error) {
                  <p>• {{ error }}</p>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Form Actions -->
      <div class="form-actions">
        <button
          type="submit"
          [disabled]="!canSubmit() || vestForm.formState().pending"
          class="btn btn-primary"
        >
          @if (vestForm.formState().pending) {
            <span class="inline-flex items-center">
              <svg
                class="mr-3 -ml-1 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Validating...
            </span>
          } @else {
            Submit Contact Form
          }
        </button>

        <button type="button" (click)="resetForm()" class="btn btn-secondary">
          Reset Form
        </button>
      </div>
    </form>
  `,
})
export class DynamicArraysFormComponent {
  /**
   * Form model with reactive signal
   */
  protected readonly formData = signal<DynamicContactFormModel>({
    firstName: 'Jane',
    lastName: 'Smith',
    company: 'Acme Corp',
    contactInfo: [
      {
        id: generateId(),
        type: 'email',
        value: 'jane.smith@acme.com',
        label: 'Work Email',
        isPrimary: true,
      },
      {
        id: generateId(),
        type: 'phone',
        value: '555-123-4567',
        label: 'Mobile Phone',
        isPrimary: false,
      },
    ],
    addresses: [
      {
        id: generateId(),
        type: 'work',
        street: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
    ],
    preferredContactMethod: 'email',
    allowMarketing: false,
  });

  /**
   * Validation suite
   */
  protected readonly validationSuite = dynamicContactFormValidationSuite;

  /**
   * Form reference for external access
   */
  private readonly vestForm = viewChild(NgxFormDirective);

  /**
   * Computed properties for UI state
   */
  protected readonly contactInfoCount = computed(
    () => this.formData().contactInfo.length,
  );

  protected readonly addressCount = computed(
    () => this.formData().addresses.length,
  );

  protected readonly hasPrimaryContact = computed(() =>
    this.formData().contactInfo.some((contact) => contact.isPrimary),
  );

  protected readonly arrayValidationSummary = computed(() =>
    validateArrayRequirements(this.formData()),
  );

  protected readonly canSubmit = computed(() => {
    const summary = this.arrayValidationSummary();
    return (
      summary.isValid && this.contactInfoCount() > 0 && this.addressCount() > 0
    );
  });

  /**
   * Expose form state and value for parent component
   */
  formState = computed(() => this.vestForm()?.formState() || null);
  formValue = computed(() => this.formData());

  /**
   * Contact Info Management
   */
  protected addContactInfo(type: ContactInfo['type'] = 'email'): void {
    this.formData.update((current) => ({
      ...current,
      contactInfo: [...current.contactInfo, createContactInfo(type)],
    }));
  }

  protected removeContactInfo(index: number): void {
    this.formData.update((current) => ({
      ...current,
      contactInfo: current.contactInfo.filter((_, index_) => index_ !== index),
    }));
  }

  /**
   * Address Management
   */
  protected addAddress(type: Address['type'] = 'home'): void {
    this.formData.update((current) => ({
      ...current,
      addresses: [...current.addresses, createAddress(type)],
    }));
  }

  protected removeAddress(index: number): void {
    this.formData.update((current) => ({
      ...current,
      addresses: current.addresses.filter((_, index_) => index_ !== index),
    }));
  }

  /**
   * Form Management
   */
  protected resetForm(): void {
    this.formData.set({
      firstName: '',
      lastName: '',
      company: '',
      contactInfo: [createContactInfo('email')],
      addresses: [createAddress('home')],
      preferredContactMethod: 'email',
      allowMarketing: false,
    });
  }

  protected onSubmit(): void {
    const data = this.formData();
    const validation = validateArrayRequirements(data);

    if (!validation.isValid) {
      alert(
        `Please fix the following errors:\n${validation.errors.join('\n')}`,
      );
      return;
    }

    console.log('Form submitted with data:', data);
    alert('Form submitted successfully! Check console for data.');
  }

  /**
   * Utility Methods
   */
  protected getContactTypeLabel(type: ContactInfo['type']): string {
    switch (type) {
      case 'phone':
        return '📞 Phone';
      case 'email':
        return '✉️ Email';
      case 'address':
        return '🏠 Address';
      default:
        return type;
    }
  }

  protected getAddressTypeLabel(type: Address['type']): string {
    switch (type) {
      case 'home':
        return '🏠 Home';
      case 'work':
        return '🏢 Work';
      case 'billing':
        return '💳 Billing';
      case 'shipping':
        return '📦 Shipping';
      default:
        return type;
    }
  }
}
