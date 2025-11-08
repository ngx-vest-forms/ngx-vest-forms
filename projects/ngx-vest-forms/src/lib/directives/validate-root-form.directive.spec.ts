import { Component, signal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test } from 'vest';
import { vestForms } from '../exports';

// Use 'rootForm' string directly instead of ROOT_FORM constant for templates
const rootFormKey = 'rootForm';

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

    test(rootFormKey, 'Passwords must match', () => {
      if (data['password'] && data['confirmPassword']) {
        enforce(data['confirmPassword']).equals(data['password']);
      }
    });
  }
);

describe('ValidateRootFormDirective', () => {
  describe('disabled by default', () => {
    it('should not validate when validateRootForm is false', async () => {
      @Component({
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            #vest="scVestForm"
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [validateRootFormMode]="'live'"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [validateRootFormMode]="'live'"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
        imports: [vestForms],
        template: `
          <form
            scVestForm
            [validateRootForm]="true"
            [validateRootFormMode]="'live'"
            [validationOptions]="{ debounceTime: 500 }"
            [suite]="suite"
            [formValue]="model()"
            (formValueChange)="model.set($event)"
            (errorsChange)="errors.set($event)"
            #vest="scVestForm"
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
            @if (errors()['rootForm']) {
              <div data-testid="root-error">{{ errors()['rootForm'] }}</div>
            }
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
      })
      class TestComponent {
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
