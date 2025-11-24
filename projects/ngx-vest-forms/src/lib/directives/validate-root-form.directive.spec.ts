import { JsonPipe } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test } from 'vest';
import { ROOT_FORM } from '../constants';
import { NgxVestForms } from '../exports';
import { getAllFormErrors } from '../utils/form-utils';
import { describe, it, expect } from 'vitest';

/**
 * Test validation suite for root form validation tests
 */
const createTestValidationSuite = staticSuite(
  (data: Record<string, unknown> = {}, field?: string) => {
    only(field);

    test('password', 'Password is required', () => {
      enforce(data['password']).isNotBlank();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data['password']).longerThanOrEquals(8);
    });

    test('confirmPassword', 'Confirm password is required', () => {
      enforce(data['confirmPassword']).isNotBlank();
    });

    test(ROOT_FORM, 'Passwords must match', () => {
      if (data['password'] && data['confirmPassword']) {
        enforce(data['confirmPassword']).equals(data['password']);
      }
    });
  }
);

/**
 * Test validation suite with multiple ROOT_FORM tests (like Brecht example)
 */
const createMultiRootFormValidationSuite = staticSuite(
  (data: Record<string, unknown> = {}, field?: string) => {
    only(field);

    test('firstName', 'First name is required', () => {
      enforce(data['firstName']).isNotBlank();
    });

    test('lastName', 'Last name is required', () => {
      enforce(data['lastName']).isNotBlank();
    });

    test('age', 'Age is required', () => {
      enforce(data['age']).isNotBlank();
    });

    // Cross-field validation (like "Brecht is not 30 anymore")
    test(ROOT_FORM, 'Brecht is not 30 anymore', () => {
      enforce(
        data['firstName'] === 'Brecht' &&
          data['lastName'] === 'Billiet' &&
          data['age'] === 30
      ).isFalsy();
    });

    // Another root form test
    test(ROOT_FORM, 'Age must be numeric', () => {
      if (data['age']) {
        enforce(Number(data['age'])).greaterThan(0);
      }
    });
  }
);

describe('ValidateRootFormDirective', () => {
  describe('integration with getAllFormErrors', () => {
    it('should expose ROOT_FORM errors via getAllFormErrors after submit', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
            #ngForm="ngForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;

        @ViewChild('ngForm', { static: false }) ngForm!: NgForm;
      }

      const fixture = await render(TestComponent);
      const component = fixture.fixture.componentInstance;

      // No error before submit
      expect(screen.queryByTestId('root-error')).toBeNull();

      // Submit form
      await userEvent.click(screen.getByTestId('submit'));

      // Wait for async validation to complete
      await waitFor(
        () => {
          const allErrors = getAllFormErrors(component.ngForm.control);
          expect(allErrors[ROOT_FORM]).toBeDefined();
          expect(allErrors[ROOT_FORM]).toContain('Passwords must match');
        },
        { timeout: 2000 }
      );

      // Error should appear in UI
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should handle multiple ROOT_FORM errors (Brecht scenario)', async () => {
      @Component({
         imports: [NgxVestForms, JsonPipe],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
            #ngForm="ngForm"
          >
            <input
              name="firstName"
              [ngModel]="model().firstName"
              data-testid="firstName"
            />
            <input
              name="lastName"
              [ngModel]="model().lastName"
              data-testid="lastName"
            />
            <input
              name="age"
              type="number"
              [ngModel]="model().age"
              data-testid="age"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">
                {{ errors()[ROOT_FORM] | json }}
              </div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          firstName: 'Brecht',
          lastName: 'Billiet',
          age: 30,
        });
        errors = signal<Record<string, string[]>>({});
        suite = createMultiRootFormValidationSuite;

        @ViewChild('ngForm', { static: false }) ngForm!: NgForm;
      }

      const fixture = await render(TestComponent);
      const component = fixture.fixture.componentInstance;

      // Submit form
      await userEvent.click(screen.getByTestId('submit'));

      // Wait for async validation to complete
      await waitFor(
        () => {
          const allErrors = getAllFormErrors(component.ngForm.control);

          expect(allErrors[ROOT_FORM]).toBeDefined();
          expect(allErrors[ROOT_FORM]).toContain('Brecht is not 30 anymore');
        },
        { timeout: 2000 }
      );

      // Error should appear in UI
      await waitFor(
        () => {
          const errorDiv = screen.queryByTestId('root-error');
          expect(errorDiv).toBeInTheDocument();
          expect(errorDiv?.textContent).toContain('Brecht is not 30 anymore');
        },
        { timeout: 2000 }
      );
    });

    it('should clear ROOT_FORM errors when condition no longer applies', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
            #ngForm="ngForm"
          >
            <input
              name="firstName"
              [ngModel]="model().firstName"
              data-testid="firstName"
            />
            <input
              name="lastName"
              [ngModel]="model().lastName"
              data-testid="lastName"
            />
            <input
              name="age"
              type="number"
              [ngModel]="model().age"
              data-testid="age"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          firstName: 'Brecht',
          lastName: 'Billiet',
          age: 30,
        });
        errors = signal<Record<string, string[]>>({});
        suite = createMultiRootFormValidationSuite;

        @ViewChild('ngForm', { static: false }) ngForm!: NgForm;
      }

      const fixture = await render(TestComponent);
      const component = fixture.fixture.componentInstance;

      // Submit form to trigger validation
      await userEvent.click(screen.getByTestId('submit'));

      // Wait for error to appear
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Change age to 31 to fix the validation
      const ageInput = screen.getByTestId('age');
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, '31');

      // Wait for error to disappear
      await waitFor(
        () => {
          const allErrors = getAllFormErrors(component.ngForm.control);
          expect(allErrors[ROOT_FORM]).toBeUndefined();
        },
        { timeout: 2000 }
      );

      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('disabled by default', () => {
    it('should not validate when ngxValidateRootForm is false', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <button type="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        model = signal<Record<string, unknown>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);
      const passwordInput = screen.getByTestId('password');

      // Form should be valid (no root validation)
      await waitFor(() => {
        expect(passwordInput).toBeInTheDocument();
      });
    });
  });

  describe('submit mode (default)', () => {
    it('should not validate before form submission', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // No error should appear before submit
      expect(screen.queryByTestId('root-error')).toBeNull();
    });

    it('should validate on form submission', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // No error before submit
      expect(screen.queryByTestId('root-error')).toBeNull();

      // Click submit button
      await userEvent.click(screen.getByTestId('submit'));

      // Error should appear after submit
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should revalidate after submit when values change', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // Submit to enable validation
      await userEvent.click(screen.getByTestId('submit'));

      // Wait for error
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Fix the mismatch
      const confirmInput = screen.getByTestId('confirm-password');
      await userEvent.clear(confirmInput);
      await userEvent.type(confirmInput, 'password123');

      // Error should disappear
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('live mode', () => {
    it('should validate without submit in live mode', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [ngxValidateRootFormMode]="'live'"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // Error should appear immediately in live mode
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should revalidate immediately when values change in live mode', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [ngxValidateRootFormMode]="'live'"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // Error should appear
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Fix the mismatch
      const confirmInput = screen.getByTestId('confirm-password');
      await userEvent.clear(confirmInput);
      await userEvent.type(confirmInput, 'password123');

      // Error should disappear
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('debouncing', () => {
    it('should respect debounceTime in validation options', async () => {
      @Component({
         imports: [NgxVestForms],
        template: `
          <form
            ngxVestForm
            ngxValidateRootForm
            [ngxValidateRootFormMode]="'live'"
            [validationOptions]="{ debounceTime: 500 }"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="ngxVestForm"
          >
            <input
              name="password"
              [ngModel]="model().password"
              data-testid="password"
            />
            <input
              name="confirmPassword"
              [ngModel]="model().confirmPassword"
              data-testid="confirm-password"
            />
            @if (errors()[ROOT_FORM]) {
              <div data-testid="root-error">{{ errors()[ROOT_FORM][0] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
        ROOT_FORM = ROOT_FORM;
        model = signal<Record<string, unknown>>({
          password: 'password123',
          confirmPassword: 'mismatch',
        });
        errors = signal<Record<string, string[]>>({});
        suite = createTestValidationSuite;
      }

      await render(TestComponent);

      // Error should appear after debounce delay
      await waitFor(
        () => {
          expect(screen.queryByTestId('root-error')).toBeInTheDocument();
        },
        { timeout: 1500 }
      );
    });
  });
});
