/**
 * Regression tests for Bug #1: Reset Button Requires Double-Click
 *
 * Bug Report: BUG_REPORT_PURCHASE_FORM.md - Bug #1
 * Fixed: 2025-01-08
 *
 * Root Cause: Signal update timing issue when calling formValue.set({})
 * Fix: Added setTimeout(() => { this.formValue.set({}); }, 0) to force change detection
 *
 * These tests ensure that form reset functionality works correctly with signals
 * and that all fields clear completely on a single reset operation.
 */

import { Component, signal } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test } from 'vest';
import { NgxVestForms } from '../exports';
import { DeepPartial } from '../utils/deep-partial';

describe('FormDirective - Reset Functionality (Bug #1 Regression Tests)', () => {
  describe('Basic reset functionality', () => {
    it('should completely clear all form fields on single reset call', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
          >
            <input
              name="firstName"
              [ngModel]="formValue().firstName"
              data-testid="firstName"
            />
            <input
              name="age"
              type="number"
              [ngModel]="formValue().age"
              data-testid="age"
            />
            <input
              name="gender"
              [ngModel]="formValue().gender"
              data-testid="gender"
            />
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<
          DeepPartial<{ firstName?: string; age?: number; gender?: string }>
        >({
          firstName: 'John',
          age: 30,
          gender: 'male',
        });

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('firstName', 'First name is required', () => {
            enforce(model.firstName).isNotBlank();
          });
        });

        reset(): void {
          this.formValue.set({});
          // Bug fix: setTimeout ensures change detection completes
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      const { fixture } = await render(TestComponent);
      const component = fixture.componentInstance;

      // Verify initial state
      expect(component.formValue().firstName).toBe('John');
      expect(component.formValue().age).toBe(30);
      expect(component.formValue().gender).toBe('male');

      // Click reset button once
      await userEvent.click(screen.getByTestId('reset'));

      // Wait for reset to complete (including setTimeout)
      await waitFor(
        () => {
          expect(component.formValue()).toEqual({});
        },
        { timeout: 100 }
      );

      // Verify all fields are cleared in the DOM
      await waitFor(() => {
        const firstNameInput = screen.getByTestId(
          'firstName'
        ) as HTMLInputElement;
        const ageInput = screen.getByTestId('age') as HTMLInputElement;
        const genderInput = screen.getByTestId('gender') as HTMLInputElement;

        expect(firstNameInput.value).toBe('');
        expect(ageInput.value).toBe('');
        expect(genderInput.value).toBe('');
      });
    });

    it('should clear form without double-click requirement', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
          >
            <input
              name="field1"
              [ngModel]="formValue().field1"
              data-testid="field1"
            />
            <input
              name="field2"
              [ngModel]="formValue().field2"
              data-testid="field2"
            />
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
            <div data-testid="click-count">{{ clickCount() }}</div>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<DeepPartial<{ field1?: string; field2?: string }>>({
          field1: 'value1',
          field2: 'value2',
        });

        clickCount = signal(0);

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('field1', 'Required', () => {
            enforce(model.field1).isNotBlank();
          });
        });

        reset(): void {
          this.clickCount.update((c) => c + 1);
          this.formValue.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      const { fixture } = await render(TestComponent);

      // Click reset once
      await userEvent.click(screen.getByTestId('reset'));

      // Verify form cleared with single click
      await waitFor(() => {
        expect(screen.getByTestId('click-count')).toHaveTextContent('1');
        expect(fixture.componentInstance.formValue()).toEqual({});
      });

      // Verify fields are actually cleared
      await waitFor(() => {
        const field1 = screen.getByTestId('field1') as HTMLInputElement;
        const field2 = screen.getByTestId('field2') as HTMLInputElement;
        expect(field1.value).toBe('');
        expect(field2.value).toBe('');
      });
    });
  });

  describe('Reset after auto-fill scenarios (Bug #1 specific)', () => {
    it('should clear all fields including auto-filled values after single reset', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="handleFormChange($event)"
          >
            <input
              name="firstName"
              [ngModel]="formValue().firstName"
              data-testid="firstName"
            />
            <input
              name="lastName"
              [ngModel]="formValue().lastName"
              data-testid="lastName"
            />
            <input
              name="age"
              type="number"
              [ngModel]="formValue().age"
              data-testid="age"
            />
            <input
              name="gender"
              [ngModel]="formValue().gender"
              data-testid="gender"
            />
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<
          DeepPartial<{
            firstName?: string;
            lastName?: string;
            age?: number;
            gender?: string;
          }>
        >({});

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('firstName', 'First name is required', () => {
            enforce(model.firstName).isNotBlank();
          });
        });

        handleFormChange(value: any): void {
          // Simulate auto-fill logic (like Brecht example)
          if (value.firstName === 'Brecht' && value.lastName === 'Billiet') {
            this.formValue.set({
              ...value,
              age: 35,
              gender: 'male',
            });
          } else {
            this.formValue.set(value);
          }
        }

        reset(): void {
          this.formValue.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      const { fixture } = await render(TestComponent);

      // Type Brecht and Billiet to trigger auto-fill
      const firstNameInput = screen.getByTestId('firstName');
      const lastNameInput = screen.getByTestId('lastName');

      await userEvent.type(firstNameInput, 'Brecht');
      await userEvent.type(lastNameInput, 'Billiet');

      // Wait for auto-fill to complete
      await waitFor(() => {
        expect(fixture.componentInstance.formValue().age).toBe(35);
        expect(fixture.componentInstance.formValue().gender).toBe('male');
      });

      // Verify auto-filled values are present
      await waitFor(() => {
        const ageInput = screen.getByTestId('age') as HTMLInputElement;
        const genderInput = screen.getByTestId('gender') as HTMLInputElement;
        expect(ageInput.value).toBe('35');
        expect(genderInput.value).toBe('male');
      });

      // Click reset once
      await userEvent.click(screen.getByTestId('reset'));

      // Verify ALL fields cleared (including auto-filled ones)
      await waitFor(
        () => {
          expect(fixture.componentInstance.formValue()).toEqual({});
        },
        { timeout: 100 }
      );

      // Verify DOM is cleared
      await waitFor(() => {
        const firstNameEl = screen.getByTestId('firstName') as HTMLInputElement;
        const lastNameEl = screen.getByTestId('lastName') as HTMLInputElement;
        const ageEl = screen.getByTestId('age') as HTMLInputElement;
        const genderEl = screen.getByTestId('gender') as HTMLInputElement;

        expect(firstNameEl.value).toBe('');
        expect(lastNameEl.value).toBe('');
        expect(ageEl.value).toBe('');
        expect(genderEl.value).toBe('');
      });
    });
  });

  describe('Reset with nested form groups', () => {
    it('should clear nested groups completely on single reset', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
          >
            <input
              name="topLevel"
              [ngModel]="formValue().topLevel"
              data-testid="topLevel"
            />
            <div ngModelGroup="nested">
              <input
                name="field1"
                [ngModel]="formValue().nested?.field1"
                data-testid="nested.field1"
              />
              <input
                name="field2"
                [ngModel]="formValue().nested?.field2"
                data-testid="nested.field2"
              />
            </div>
            <div ngModelGroup="passwords">
              <input
                name="password"
                type="password"
                [ngModel]="formValue().passwords?.password"
                data-testid="password"
              />
              <input
                name="confirmPassword"
                type="password"
                [ngModel]="formValue().passwords?.confirmPassword"
                data-testid="confirmPassword"
              />
            </div>
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<
          DeepPartial<{
            topLevel?: string;
            nested?: { field1?: string; field2?: string };
            passwords?: { password?: string; confirmPassword?: string };
          }>
        >({
          topLevel: 'value',
          nested: { field1: 'nested1', field2: 'nested2' },
          passwords: { password: 'pass123', confirmPassword: 'pass123' },
        });

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('topLevel', 'Required', () => {
            enforce(model.topLevel).isNotBlank();
          });
        });

        reset(): void {
          this.formValue.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      const { fixture } = await render(TestComponent);

      // Verify initial nested structure
      expect(fixture.componentInstance.formValue().nested?.field1).toBe(
        'nested1'
      );
      expect(fixture.componentInstance.formValue().passwords?.password).toBe(
        'pass123'
      );

      // Click reset once
      await userEvent.click(screen.getByTestId('reset'));

      // Verify entire structure cleared
      await waitFor(
        () => {
          expect(fixture.componentInstance.formValue()).toEqual({});
        },
        { timeout: 100 }
      );

      // Verify all nested fields cleared in DOM
      await waitFor(() => {
        expect((screen.getByTestId('topLevel') as HTMLInputElement).value).toBe(
          ''
        );
        expect(
          (screen.getByTestId('nested.field1') as HTMLInputElement).value
        ).toBe('');
        expect(
          (screen.getByTestId('nested.field2') as HTMLInputElement).value
        ).toBe('');
        expect((screen.getByTestId('password') as HTMLInputElement).value).toBe(
          ''
        );
        expect(
          (screen.getByTestId('confirmPassword') as HTMLInputElement).value
        ).toBe('');
      });
    });
  });

  describe('Reset with errors signal', () => {
    it('should clear both form values and errors on reset', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
            (errorsChange)="errors.set($event)"
          >
            <input
              name="email"
              [ngModel]="formValue().email"
              data-testid="email"
            />
            @if (errors()['email']) {
              <div data-testid="email-error">{{ errors()['email'][0] }}</div>
            }
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
            <button type="submit" data-testid="submit">Submit</button>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<DeepPartial<{ email?: string }>>({
          email: 'invalid',
        });
        errors = signal<Record<string, string[]>>({});

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('email', 'Valid email required', () => {
            enforce(model.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          });
        });

        reset(): void {
          this.formValue.set({});
          this.errors.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      await render(TestComponent);

      // Trigger validation
      await userEvent.click(screen.getByTestId('submit'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).toBeInTheDocument();
      });

      // Click reset
      await userEvent.click(screen.getByTestId('reset'));

      // Verify both form value and errors cleared
      await waitFor(() => {
        expect((screen.getByTestId('email') as HTMLInputElement).value).toBe(
          ''
        );
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Repeated reset operations', () => {
    it('should handle multiple consecutive reset operations correctly', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
          >
            <input
              name="testField"
              [ngModel]="formValue().testField"
              data-testid="testField"
            />
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
            <div data-testid="reset-count">{{ resetCount() }}</div>
          </form>
        `,
         imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<DeepPartial<{ testField?: string }>>({});
        resetCount = signal(0);

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('testField', 'Required', () => {
            enforce(model.testField).isNotBlank();
          });
        });

        reset(): void {
          this.resetCount.update((c) => c + 1);
          this.formValue.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      await render(TestComponent);

      const input = screen.getByTestId('testField') as HTMLInputElement;
      const resetButton = screen.getByTestId('reset');

      // Fill, reset, fill, reset, fill, reset
      for (let i = 1; i <= 3; i++) {
        await userEvent.type(input, `test${i}`);
        await waitFor(() => expect(input.value).toBe(`test${i}`));

        await userEvent.click(resetButton);
        await waitFor(() => {
          expect(input.value).toBe('');
          expect(screen.getByTestId('reset-count')).toHaveTextContent(
            String(i)
          );
        });
      }

      // Verify final state
      expect(screen.getByTestId('reset-count')).toHaveTextContent('3');
      expect(input.value).toBe('');
    });
  });
});
