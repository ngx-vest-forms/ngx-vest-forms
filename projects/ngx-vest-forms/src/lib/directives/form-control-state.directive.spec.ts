import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { vestForms } from '../exports';
import { FormControlStateDirective } from './form-control-state.directive';

// Vest suite for errors and warnings
const vestSuite = staticSuite(
  (data: { test?: string } = {}, field?: string) => {
    if (field) only(field);

    test('test', 'Test is required', () => {
      enforce(data.test).isNotEmpty();
    });

    test('test', 'Test looks weak', () => {
      if (data.test && data.test.length < 5) {
        warn();
      }
      enforce(data.test).longerThanOrEquals(5);
    });
  },
);

describe('FormControlStateDirective', () => {
  describe('Core Functionality', () => {
    it('should extract raw form control state for NgModel', async () => {
      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input
                id="test-input"
                name="test"
                [ngModel]="formValue().test"
                data-testid="input"
              />
              <div data-testid="status">{{ state.controlState().status }}</div>
              <div data-testid="touched">
                {{ state.controlState().isTouched }}
              </div>
              <div data-testid="dirty">{{ state.controlState().isDirty }}</div>
              <div data-testid="valid">{{ state.controlState().isValid }}</div>
            </div>
          </form>
        `,
      })
      class TestHostComponent {
        formValue = signal({ test: '' });
        suite = vestSuite;
      }

      const { fixture } = await render(TestHostComponent);

      const input = screen.getByLabelText('Test Input') as HTMLInputElement;

      // Initial state
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');
      expect(screen.getByTestId('touched')).toHaveTextContent('false');

      // Interact with input
      await userEvent.type(input, 'test value');
      await userEvent.tab(); // Trigger blur to set touched

      await fixture.whenStable();

      // Verify state changes
      await expect
        .poll(() => screen.getByTestId('dirty').textContent)
        .toBe('true');
      await expect
        .poll(() => screen.getByTestId('touched').textContent)
        .toBe('true');
      expect(screen.getByTestId('status').textContent).toBeTruthy();
    });

    it('should extract errorMessages and warningMessages from Vest validation', async () => {
      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input id="test-input" name="test" [ngModel]="formValue().test" />
              <div data-testid="errors">
                {{ state.errorMessages().join(',') }}
              </div>
              <div data-testid="warnings">
                {{ state.warningMessages().join(',') }}
              </div>
            </div>
          </form>
        `,
      })
      class VestErrorComponent {
        formValue = signal({ test: 'abc' }); // triggers warning (length < 5)
        suite = vestSuite;
      }

      const { fixture } = await render(VestErrorComponent);

      const input = screen.getByLabelText('Test Input');
      await userEvent.click(input);
      await userEvent.tab();

      await fixture.whenStable();

      // Should have warning but no errors since field has value
      expect(screen.getByTestId('errors').textContent).not.toContain(
        'Test is required',
      );
      await expect
        .poll(() => screen.getByTestId('warnings').textContent)
        .toContain('Test looks weak');
    });

    it('should show errors when field is empty and touched', async () => {
      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input id="test-input" name="test" [ngModel]="formValue().test" />
              <div data-testid="errors">
                {{ state.errorMessages().join(',') }}
              </div>
            </div>
          </form>
        `,
      })
      class EmptyFieldComponent {
        formValue = signal({ test: '' }); // empty field should trigger error when touched
        suite = vestSuite;
      }

      const { fixture } = await render(EmptyFieldComponent);

      const input = screen.getByLabelText('Test Input');
      await userEvent.click(input);
      await userEvent.tab(); // Make field touched

      await fixture.whenStable();

      await expect
        .poll(() => screen.getByTestId('errors').textContent)
        .toContain('Test is required');
    });
  });

  describe('Async Validation', () => {
    it('should reflect pending validation state', async () => {
      // Simulate async validator
      const asyncSuite = staticSuite(
        async (data: { test?: string } = {}, field?: string) => {
          if (field) only(field);

          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 100));

          test('test', 'Async error: Test required', () => {
            enforce(data.test).isNotEmpty();
          });
        },
      );

      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input
                id="test-input"
                name="test"
                [ngModel]="formValue().test"
                data-testid="input"
                [ngModelOptions]="{ updateOn: 'blur' }"
              />
              <div data-testid="pending">
                {{ state.controlState().isPending }}
              </div>
              <div data-testid="status">
                {{ state.controlState().status }}
              </div>
            </div>
          </form>
        `,
      })
      class PendingComponent {
        formValue = signal({ test: '' });
        suite = asyncSuite;
      }

      const { fixture } = await render(PendingComponent);

      const input = screen.getByTestId('input');
      await userEvent.type(input, 'test');
      await userEvent.tab(); // Trigger blur to start async validation

      // Should show pending state during async validation
      await expect
        .poll(() => screen.getByTestId('pending').textContent)
        .toBe('true');

      // Wait for async validation to complete
      await fixture.whenStable();

      // Should eventually resolve
      await expect
        .poll(() => screen.getByTestId('pending').textContent)
        .toBe('false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing/undefined controls gracefully', async () => {
      @Component({
        imports: [FormControlStateDirective],
        template: `
          <div scFormControlState #state="formControlState">
            <div data-testid="status">
              {{ state.controlState().status || 'no-status' }}
            </div>
          </div>
        `,
      })
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      class NoInputComponent {}

      // Should not throw when rendering without form controls
      expect(async () => {
        await render(NoInputComponent);
      }).not.toThrow();

      await render(NoInputComponent);
      expect(screen.getByTestId('status')).toHaveTextContent('no-status');
    });

    it('should handle null form values gracefully', async () => {
      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [formValue]="nullValue">
            <div scFormControlState #state="formControlState">
              <input name="test" ngModel data-testid="input" />
              <div data-testid="status">
                {{ state.controlState().status || 'no-status' }}
              </div>
            </div>
          </form>
        `,
      })
      class NullValueComponent {
        nullValue = null;
        suite = vestSuite;
      }

      expect(async () => {
        await render(NullValueComponent);
      }).not.toThrow();
    });
  });

  describe('Host Directive Usage', () => {
    it('should work as hostDirective in a custom component', async () => {
      @Component({
        imports: [vestForms, FormsModule],
        hostDirectives: [FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <label for="username-input">Username</label>
            <input
              id="username-input"
              name="username"
              [ngModel]="formValue().username"
            />
            <div data-testid="valid">
              {{ formControlState.controlState().isValid }}
            </div>
            <div data-testid="dirty">
              {{ formControlState.controlState().isDirty }}
            </div>
          </form>
        `,
      })
      class HostDirectiveComponent {
        formValue = signal({ username: '' });
        suite = staticSuite(
          (data: { username?: string } = {}, field?: string) => {
            if (field) only(field);
            test('username', 'Username is required', () => {
              enforce(data.username).isNotEmpty();
            });
          },
        );

        constructor(public formControlState: FormControlStateDirective) {}
      }

      const { fixture } = await render(HostDirectiveComponent);

      const input = screen.getByLabelText('Username');

      // Initial state
      expect(screen.getByTestId('valid')).toHaveTextContent('true');
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');

      // Type and verify state changes
      await userEvent.type(input, 'testuser');
      await fixture.whenStable();

      await expect
        .poll(() => screen.getByTestId('dirty').textContent)
        .toBe('true');
      expect(screen.getByTestId('valid')).toHaveTextContent('true');
    });
  });

  describe('Vest Integration', () => {
    it('should show Vest warnings when present', async () => {
      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input id="test-input" name="test" [ngModel]="formValue().test" />
              <div data-testid="warnings">
                {{ state.warningMessages().join(',') }}
              </div>
              <div data-testid="errors">
                {{ state.errorMessages().join(',') }}
              </div>
            </div>
          </form>
        `,
      })
      class VestWarningComponent {
        formValue = signal({ test: 'abc' }); // triggers warning (length < 5)
        suite = vestSuite;
      }

      const { fixture } = await render(VestWarningComponent);

      const input = screen.getByLabelText('Test Input');
      await userEvent.click(input);
      await userEvent.tab();

      await fixture.whenStable();

      await expect
        .poll(() => screen.getByTestId('warnings').textContent)
        .toContain('Test looks weak');

      // Should not have errors since field has value
      expect(screen.getByTestId('errors').textContent).not.toContain(
        'Test is required',
      );
    });

    it('should handle multiple validation messages', async () => {
      const multiValidationSuite = staticSuite(
        (data: { test?: string } = {}, field?: string) => {
          if (field) only(field);

          test('test', 'Test is required', () => {
            enforce(data.test).isNotEmpty();
          });

          test('test', 'Test must be at least 3 characters', () => {
            enforce(data.test).longerThanOrEquals(3);
          });

          test('test', 'Test contains invalid characters', () => {
            if (data.test) {
              enforce(data.test).matches(/^[a-zA-Z0-9]+$/);
            }
          });
        },
      );

      @Component({
        imports: [vestForms, FormsModule, FormControlStateDirective],
        template: `
          <form scVestForm [vestSuite]="suite" [(formValue)]="formValue">
            <div scFormControlState #state="formControlState">
              <label for="test-input">Test Input</label>
              <input id="test-input" name="test" [ngModel]="formValue().test" />
              <div data-testid="error-count">
                {{ state.errorMessages().length }}
              </div>
              <div data-testid="errors">
                {{ state.errorMessages().join(' | ') }}
              </div>
            </div>
          </form>
        `,
      })
      class MultiValidationComponent {
        formValue = signal({ test: 'a!' }); // triggers multiple errors
        suite = multiValidationSuite;
      }

      const { fixture } = await render(MultiValidationComponent);

      const input = screen.getByLabelText('Test Input');
      await userEvent.click(input);
      await userEvent.tab();

      await fixture.whenStable();

      // Should have multiple errors
      await expect
        .poll(() =>
          Number.parseInt(screen.getByTestId('error-count').textContent || '0'),
        )
        .toBeGreaterThan(1);

      const errorText = screen.getByTestId('errors').textContent || '';
      expect(errorText).toContain('at least 3 characters');
      expect(errorText).toContain('invalid characters');
    });
  });
});
