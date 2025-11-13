import { JsonPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test as vestTest } from 'vest';
import { vestForms } from '../exports';
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
  imports: [...vestForms, JsonPipe],
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
  standalone: true,
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
    await waitFor(() => {
      const formErrors = screen.getByTestId('form-errors');
      expect(formErrors.textContent).toMatch(/Street is required/);
    });
    await userEvent.clear(streetInput);
    await userEvent.type(streetInput, '123 Main St');
    await userEvent.clear(cityInput);
    await userEvent.type(cityInput, 'Anytown');
    await waitFor(() => {
      const formErrors = screen.getByTestId('form-errors');
      expect(formErrors.textContent).not.toMatch(/Street is required/);
      expect(formErrors.textContent).not.toMatch(/City is required/);
      expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
    });
  });

  it('should handle form group path resolution correctly', async () => {
    await render(TestGroupComponent);
    const streetInput = screen.getByTestId('street-input');
    await userEvent.clear(streetInput);
    await userEvent.type(streetInput, '123 Main St');
    await userEvent.tab();
    await waitFor(() => {
      const formErrors = screen.getByTestId('form-errors');
      expect(formErrors.textContent).not.toMatch(/Street is required/);
      expect(formErrors.textContent).toMatch(/City is required/);
    });
  });
});
