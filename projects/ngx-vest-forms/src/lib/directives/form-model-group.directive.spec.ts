import { JsonPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import { FormDirective } from './form.directive';

type AddressFormModel = {
  address: {
    street: string;
    city: string;
  };
};

const addressFormSuite = staticSuite(
  (data: Partial<AddressFormModel> = {}, field?: string) => {
    only(field); // ✅ Call unconditionally

    vestTest('address.street', 'Street is required', () => {
      enforce(data.address?.street).isNotEmpty();
    });
    vestTest('address.city', 'City is required', () => {
      enforce(data.address?.city).isNotEmpty();
    });
  }
);

@Component({
  imports: [NgxVestForms, JsonPipe],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [(formValue)]="model"
      #vestForm="ngxVestForm"
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
      <div data-testid="form-valid">{{ vestForm.formState().valid }}</div>
      <div data-testid="form-errors">
        {{ vestForm.formState().errors | json }}
      </div>
    </form>
  `,
})
class TestGroupComponent {
  readonly vestForm =
    viewChild.required<FormDirective<Record<string, any>>>('vestForm');
  model = signal<AddressFormModel>({ address: { street: '', city: '' } });
  suite = addressFormSuite;
}

describe('FormModelGroupDirective', () => {
  it('should properly register as async validator for ngModelGroup', async () => {
    await render(TestGroupComponent);
    expect(screen.getByTestId('address-group')).toBeInTheDocument();
    expect(screen.getByTestId('street-input')).toBeInTheDocument();
    expect(screen.getByTestId('city-input')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
    });
  });

  it('should validate nested form group fields correctly', async () => {
    await render(TestGroupComponent);
    const streetInput = screen.getByTestId('street-input');
    const cityInput = screen.getByTestId('city-input');
    await userEvent.click(streetInput);
    await userEvent.tab();
    await userEvent.click(cityInput);
    await userEvent.tab();
    await waitFor(() => {
      const formErrors = screen.getByTestId('form-errors');
      expect(formErrors.textContent).toMatch(/Street is required/);
      expect(formErrors.textContent).toMatch(/City is required/);
    });
  });

  it('should clear validation errors when fields are filled', async () => {
    await render(TestGroupComponent);
    const streetInput = screen.getByTestId('street-input');
    const cityInput = screen.getByTestId('city-input');
    await userEvent.click(streetInput);
    await userEvent.tab();
    await userEvent.click(cityInput);
    await userEvent.tab();
    // Wait for errors to appear
    await waitFor(() =>
      expect(screen.getByTestId('form-errors').textContent).toMatch(
        /Street is required/
      )
    );

    await userEvent.clear(streetInput);
    await userEvent.type(streetInput, '123 Main St');
    await userEvent.tab(); // Blur street input
    await userEvent.clear(cityInput);
    await userEvent.type(cityInput, 'Anytown');
    await userEvent.tab(); // Blur city input

    // Wait for errors to clear and form to become valid
    await waitFor(() => {
      const formErrors = screen.getByTestId('form-errors').textContent;
      // Since errors are displayed as JSON, check if either error message still appears
      const hasStreetError = formErrors?.includes('Street is required');
      const hasCityError = formErrors?.includes('City is required');
      expect(!hasStreetError && !hasCityError).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByTestId('form-valid').textContent).toBe('true');
    });
  }, 10000); // Increase timeout to 10 seconds

  it('should handle form group path resolution correctly', async () => {
    await render(TestGroupComponent);
    const streetInput = screen.getByTestId('street-input');
    const cityInput = screen.getByTestId('city-input');

    // Click street input to focus it
    await userEvent.click(streetInput);
    // Type valid street address
    await userEvent.keyboard('123 Main St');
    // Give form time to update model
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Tab moves focus to city input
    await userEvent.tab();
    // Give time for street validation to run
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Tab again to blur city (triggers validation on empty city)
    await userEvent.tab();
    // Give time for city validation to run
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Wait for street validation to clear (street is now valid) and city error to appear
    await waitFor(
      () => {
        const formErrors = screen.getByTestId('form-errors').textContent;
        // Both conditions must be true for the waitFor to succeed
        if (formErrors?.includes('Street is required')) {
          throw new Error('Street error should be cleared');
        }
        if (!formErrors?.includes('City is required')) {
          throw new Error('City error should be present');
        }
      },
      { timeout: 3000 }
    );

    // Final assertion to satisfy linter
    const finalErrors = screen.getByTestId('form-errors').textContent;
    expect(finalErrors).not.toMatch(/Street is required/);
    expect(finalErrors).toMatch(/City is required/);
  }, 10000); // Increase timeout to 10 seconds
});
