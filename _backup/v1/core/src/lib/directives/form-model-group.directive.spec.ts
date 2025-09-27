import { JsonPipe } from '@angular/common';
import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, staticSuite, test as vestTest } from 'vest';
import { describe, expect, test } from 'vitest';

import { NgxFormCoreDirective } from './form-core.directive';
import { NgxFormModelGroupDirective } from './form-model-group.directive';
import { NgxFormModelDirective } from './form-model.directive';

// Test validation suite for model groups
const addressFormSuite = staticSuite((data: Partial<AddressFormModel> = {}) => {
  vestTest('address.street', 'Street is required', () => {
    enforce(data.address?.street).isNotEmpty();
  });

  vestTest('address.city', 'City is required', () => {
    enforce(data.address?.city).isNotEmpty();
  });
});

type AddressFormModel = {
  address: {
    street: string;
    city: string;
  };
};

@Component({
  imports: [
    FormsModule,
    NgxFormCoreDirective,
    NgxFormModelDirective,
    NgxFormModelGroupDirective,
    JsonPipe,
  ],
  template: `
    <form
      ngxVestFormCore
      [vestSuite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestFormCore"
    >
      <div ngModelGroup="address" data-testid="address-group">
        <label for="street">Street</label>
        <input
          id="street"
          name="street"
          [ngModel]="model().address?.street"
          data-testid="street-input"
        />

        <label for="city">City</label>
        <input
          id="city"
          name="city"
          [ngModel]="model().address?.city"
          data-testid="city-input"
        />
      </div>

      <!-- Display form state for testing -->
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
    </form>
  `,
})
class TestGroupComponent {
  readonly vestForm = viewChild.required<NgxFormCoreDirective>('vestForm');

  model = signal<AddressFormModel>({
    address: {
      street: '',
      city: '',
    },
  });

  suite = addressFormSuite;
}

/**
 * Tests for NgxFormModelGroupDirective
 *
 * WHAT: Tests directive-specific behaviors that are not covered by E2E/integration tests
 * WHY: Focus on edge cases, error handling, and Angular-specific integration points
 *
 * NOTE: Full integration scenarios are covered by:
 * - E2E tests (Playwright)
 * - Integration examples in projects/examples (profile-form, purchase-form, etc.)
 * - Component tests in consuming applications
 *
 * This test suite focuses on directive-level concerns only.
 */
describe('NgxFormModelGroupDirective', () => {
  describe('Template-Driven Form Integration', () => {
    test('should properly register as async validator for ngModelGroup', async () => {
      await render(TestGroupComponent);

      // Verify the form renders correctly with ngModelGroup
      expect(screen.getByTestId('address-group')).toBeInTheDocument();
      expect(screen.getByTestId('street-input')).toBeInTheDocument();
      expect(screen.getByTestId('city-input')).toBeInTheDocument();

      // Initial form should be valid (empty validation)
      await expect
        .element(screen.getByTestId('form-valid'))
        .toHaveTextContent('true');
    });

    test('should validate nested form group fields correctly', async () => {
      await render(TestGroupComponent);

      const streetInput = screen.getByTestId('street-input');
      const cityInput = screen.getByTestId('city-input');

      // Trigger validation by interacting with fields
      await userEvent.click(streetInput);
      await userEvent.tab(); // blur to trigger validation

      await userEvent.click(cityInput);
      await userEvent.tab(); // blur to trigger validation

      // Wait for Angular to stabilize
      await TestBed.inject(ApplicationRef).whenStable();

      // Check that validation errors appear for the nested group fields
      const formErrors = screen.getByTestId('form-errors');
      await expect.element(formErrors).toHaveTextContent(/Street is required/);
      await expect.element(formErrors).toHaveTextContent(/City is required/);
    });

    test('should clear validation errors when fields are filled', async () => {
      await render(TestGroupComponent);

      const streetInput = screen.getByTestId('street-input');
      const cityInput = screen.getByTestId('city-input');

      // First trigger validation errors
      await userEvent.click(streetInput);
      await userEvent.tab();
      await userEvent.click(cityInput);
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      // Verify errors exist
      const formErrors = screen.getByTestId('form-errors');
      await expect.element(formErrors).toHaveTextContent(/Street is required/);

      // Fill in the fields
      await userEvent.clear(streetInput);
      await userEvent.type(streetInput, '123 Main St');
      await userEvent.clear(cityInput);
      await userEvent.type(cityInput, 'Anytown');

      await TestBed.inject(ApplicationRef).whenStable();

      // Verify errors are cleared
      await expect
        .element(formErrors)
        .not.toHaveTextContent(/Street is required/);
      await expect
        .element(formErrors)
        .not.toHaveTextContent(/City is required/);
      await expect
        .element(screen.getByTestId('form-valid'))
        .toHaveTextContent('true');
    });

    test('should handle form group path resolution correctly', async () => {
      await render(TestGroupComponent);

      const streetInput = screen.getByTestId('street-input');

      // Fill only street field
      await userEvent.clear(streetInput);
      await userEvent.type(streetInput, '123 Main St');
      await userEvent.tab();

      await TestBed.inject(ApplicationRef).whenStable();

      // Should still have error for city but not for street
      const formErrors = screen.getByTestId('form-errors');
      await expect
        .element(formErrors)
        .not.toHaveTextContent(/Street is required/);
      await expect.element(formErrors).toHaveTextContent(/City is required/);
    });
  });
});
