/**
 * Tests for Form Reset Functionality
 *
 * This file tests the FormDirective's reset capabilities and documents the proper
 * patterns for resetting ngx-vest-forms forms.
 *
 * ## Background: The Form Reset Challenge
 *
 * When using ngx-vest-forms with Angular signals and template-driven forms, there's
 * a timing challenge when resetting forms. The issue stems from how Angular's
 * bidirectional sync works between the component's signal state and the DOM:
 *
 * 1. User calls `formValue.set({})` to reset the form
 * 2. The signal updates immediately to `{}`
 * 3. But the DOM form controls still contain their old values
 * 4. When Angular's change detection runs, the bidirectional sync logic sees:
 *    - Model changed: true (signal is now `{}`)
 *    - Form changed: true (DOM controls still have values)
 * 5. This creates a "conflict" state where neither wins
 *
 * ## Solutions
 *
 * ### Solution 1: Use `FormDirective.resetForm()` (RECOMMENDED)
 *
 * The `resetForm()` method properly resets both the Angular form and the internal
 * tracking state, ensuring clean synchronization:
 *
 * ```typescript
 * vestForm = viewChild.required('vestForm', { read: FormDirective });
 *
 * reset(): void {
 *   this.formValue.set({});
 *   this.vestForm().resetForm();
 * }
 * ```
 *
 * ### Solution 2: Double-set workaround (legacy, not recommended)
 *
 * Before `resetForm()` was added, a workaround was to set the value twice:
 *
 * ```typescript
 * reset(): void {
 *   this.formValue.set({});
 *   setTimeout(() => this.formValue.set({}), 0);
 * }
 * ```
 *
 * **Why both calls are required:**
 *
 * The first `set({})` alone is insufficient because of a race condition:
 * 1. First `set({})` updates the signal to `{}`
 * 2. Angular's change detection runs and updates the template bindings
 * 3. BUT: The NgForm's internal form controls still hold stale values
 * 4. The bidirectional sync sees both model AND form changed → conflict state
 * 5. Neither wins, so the form retains old values
 *
 * The `setTimeout(..., 0)` defers the second `set({})` to the next event loop tick:
 * 1. By then, Angular has fully processed the first change detection cycle
 * 2. The NgForm controls have been cleared by the binding updates
 * 3. The second `set({})` now sees: model changed, form empty → model wins
 * 4. Form correctly shows empty values
 *
 * **Why `resetForm()` is better:**
 * It calls `NgForm.resetForm()` directly, which clears controls AND marks the form
 * as pristine/untouched in a single synchronous operation, avoiding the race entirely.
 */

import { Component, signal, viewChild } from '@angular/core';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { enforce, only, staticSuite, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxVestForms } from '../exports';
import { DeepPartial } from '../utils/deep-partial';
import { FormDirective } from './form.directive';

describe('FormDirective - Reset Functionality', () => {
  describe('Using resetForm() method (RECOMMENDED)', () => {
    it('should completely clear all form fields on single reset call using resetForm()', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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

        /**
         * Proper reset pattern using FormDirective.resetForm()
         * This is the recommended approach as it properly handles
         * the bidirectional sync state.
         */
        reset(): void {
          this.formValue.set({});
          this.vestFormRef().resetForm();
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

      // Wait for reset to complete - verify DOM inputs are empty
      // Note: After NgForm.resetForm(), Angular sets control values to null,
      // so formValue() will contain null values for each registered control.
      // The key test is that DOM inputs are empty and form is pristine.
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

      // Verify form state is pristine and untouched after reset
      await waitFor(() => {
        const form = fixture.nativeElement.querySelector('form');
        expect(form.classList.contains('ng-pristine')).toBe(true);
        expect(form.classList.contains('ng-untouched')).toBe(true);
      });
    });

    it('should clear form with a single click using resetForm()', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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
          this.vestFormRef().resetForm();
        }
      }

      const { fixture } = await render(TestComponent);

      // Click reset once
      await userEvent.click(screen.getByTestId('reset'));

      // Verify form cleared with single click
      await waitFor(() => {
        expect(screen.getByTestId('click-count')).toHaveTextContent('1');
      });

      // Verify fields are actually cleared in DOM
      await waitFor(() => {
        const field1 = screen.getByTestId('field1') as HTMLInputElement;
        const field2 = screen.getByTestId('field2') as HTMLInputElement;
        expect(field1.value).toBe('');
        expect(field2.value).toBe('');
      });
    });

    it('should reset nested form groups completely using resetForm()', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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
          this.vestFormRef().resetForm();
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

      // Verify all nested fields cleared in DOM
      // Note: formValue() will contain nulls for each control after NgForm.resetForm(),
      // but the key test is that DOM inputs are empty
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

    it('should reset form with new values using resetForm(value)', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
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
              name="lastName"
              [ngModel]="formValue().lastName"
              data-testid="lastName"
            />
            <button
              type="button"
              (click)="resetWithDefaults()"
              data-testid="reset"
            >
              Reset with Defaults
            </button>
          </form>
        `,
        imports: [NgxVestForms],
      })
      class TestComponent {
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

        formValue = signal<
          DeepPartial<{ firstName?: string; lastName?: string }>
        >({
          firstName: 'John',
          lastName: 'Doe',
        });

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('firstName', 'Required', () => {
            enforce(model.firstName).isNotBlank();
          });
        });

        /**
         * Reset form with new default values
         */
        resetWithDefaults(): void {
          const defaults = { firstName: 'Default', lastName: 'User' };
          this.formValue.set(defaults);
          this.vestFormRef().resetForm(defaults);
        }
      }

      const { fixture } = await render(TestComponent);

      // Verify initial values
      expect((screen.getByTestId('firstName') as HTMLInputElement).value).toBe(
        'John'
      );

      // Click reset with defaults
      await userEvent.click(screen.getByTestId('reset'));

      // Verify new default values are set
      await waitFor(() => {
        expect(
          (screen.getByTestId('firstName') as HTMLInputElement).value
        ).toBe('Default');
        expect((screen.getByTestId('lastName') as HTMLInputElement).value).toBe(
          'User'
        );
        expect(fixture.componentInstance.formValue()).toEqual({
          firstName: 'Default',
          lastName: 'User',
        });
      });
    });
  });

  describe('Reset after auto-fill scenarios', () => {
    it('should clear all fields including auto-filled values using resetForm()', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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
          // Simulate auto-fill logic (like the Brecht example in purchase form)
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
          this.vestFormRef().resetForm();
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

      // Verify auto-filled values are present in DOM
      await waitFor(() => {
        const ageInput = screen.getByTestId('age') as HTMLInputElement;
        const genderInput = screen.getByTestId('gender') as HTMLInputElement;
        expect(ageInput.value).toBe('35');
        expect(genderInput.value).toBe('male');
      });

      // Click reset once
      await userEvent.click(screen.getByTestId('reset'));

      // Verify DOM is cleared (the key test for reset functionality)
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

  describe('Reset with errors signal', () => {
    it('should clear both form values and errors on reset', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            #vestForm="ngxVestForm"
            [formValue]="formValue()"
            [suite]="suite"
            (formValueChange)="formValue.set($event)"
            (errorsChange)="errors.set($event)"
          >
            <ngx-control-wrapper>
              <input
                name="email"
                [ngModel]="formValue().email"
                data-testid="email"
              />
            </ngx-control-wrapper>
            @if (
              (vestForm.ngForm.submitted ||
                vestForm.ngForm.controls['email']?.touched) &&
              errors()['email']
            ) {
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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
          this.vestFormRef().resetForm();
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
            #vestForm="ngxVestForm"
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
        vestFormRef = viewChild.required<FormDirective<any>>('vestForm');

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
          this.vestFormRef().resetForm();
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

  describe('Legacy double-set workaround (for documentation)', () => {
    /**
     * This test documents the legacy workaround pattern that was used before
     * resetForm() was added. It's kept for historical reference and to ensure
     * backward compatibility for users who haven't migrated yet.
     *
     * @deprecated Use resetForm() instead of this pattern
     */
    it('should work with double-set setTimeout workaround (legacy pattern)', async () => {
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
            <button type="button" (click)="reset()" data-testid="reset">
              Reset
            </button>
          </form>
        `,
        imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<DeepPartial<{ firstName?: string }>>({
          firstName: 'John',
        });

        suite = staticSuite((model: any, field?: string) => {
          only(field);
          test('firstName', 'Required', () => {
            enforce(model.firstName).isNotBlank();
          });
        });

        /**
         * @deprecated Use resetForm() instead
         *
         * Legacy workaround: Both set() calls are required due to a race condition:
         *
         * 1. First `set({})`: Updates signal, but NgForm controls still hold stale values.
         *    The bidirectional sync sees both model AND form changed → conflict state.
         *
         * 2. `setTimeout`: Defers second call to next event loop tick, after Angular's
         *    change detection has cleared the NgForm controls.
         *
         * 3. Second `set({})`: Now model changed + form empty → model wins → form clears.
         *
         * The `resetForm()` method avoids this by calling NgForm.resetForm() directly,
         * which clears controls synchronously without the race condition.
         */
        reset(): void {
          this.formValue.set({});
          setTimeout(() => {
            this.formValue.set({});
          }, 0);
        }
      }

      const { fixture } = await render(TestComponent);

      // Verify initial state
      expect(fixture.componentInstance.formValue().firstName).toBe('John');

      // Click reset
      await userEvent.click(screen.getByTestId('reset'));

      // Wait for reset to complete (including setTimeout)
      // Verify field cleared in DOM
      await waitFor(() => {
        expect(
          (screen.getByTestId('firstName') as HTMLInputElement).value
        ).toBe('');
      });
    });
  });
});
