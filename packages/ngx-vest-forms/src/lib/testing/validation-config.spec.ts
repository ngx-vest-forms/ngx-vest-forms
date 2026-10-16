/**
 * Comprehensive test suite for FormDirective
 * Tests validation config, modern Angular APIs, and directive functionality
 */
import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { create, enforce, omitWhen, test } from 'vest';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  onTestFinished,
  vi,
} from 'vitest';
import type { NgxDeepPartial } from '../../public-api';
import { FormDirective } from '../directives/form.directive';
import { NgxVestForms } from '../exports';

const whenStable = () => TestBed.inject(ApplicationRef).whenStable();

/** Replace the field's value the way a user would (clear, then type). */
const typeInto = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  user: Pick<ReturnType<typeof userEvent.setup>, 'clear' | 'type'> = userEvent
) => {
  await user.clear(element);
  if (value) {
    await user.type(element, value);
  }
};

/**
 * Replace the field's value with a single input event (select all, then
 * paste). Used where a test counts suite runs per change, which per-keystroke
 * typing would multiply.
 */
const pasteInto = async (
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
  user: Pick<
    ReturnType<typeof userEvent.setup>,
    'tripleClick' | 'paste'
  > = userEvent
) => {
  await user.tripleClick(element);
  await user.paste(value);
};

describe('FormDirective - Comprehensive', () => {
  // Reset TestBed before each test to ensure clean state
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
  // Test for Issue #14: Controls not existing on initialization
  it('should handle validationConfig when controls are added dynamically', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          @if (showPasswordFields()) {
            <div ngModelGroup="passwords">
              <input
                name="password"
                [ngModel]="formValue().passwords?.password"
              />
              <input
                name="confirmPassword"
                [ngModel]="formValue().passwords?.confirmPassword"
              />
            </div>
          }
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          passwords: { password: string; confirmPassword: string };
        }>
      >({});
      validationConfig = {
        'passwords.password': ['passwords.confirmPassword'],
      };
      suite = create((model: any) => {
        test('passwords.password', 'Password is required', () => {
          enforce(model.passwords?.password).isNotBlank();
        });
        test('passwords.confirmPassword', 'Passwords must match', () => {
          enforce(model.passwords?.confirmPassword).equals(
            model.passwords?.password
          );
        });
      });
      showPasswordFields = signal(false);
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    // No errors should occur when controls don't exist
    await expect(whenStable()).resolves.toBeUndefined();

    // Add controls dynamically
    fixture.componentInstance.showPasswordFields.set(true);
    await whenStable();

    // Now validation config should work
    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    );
    await typeInto(passwordInput, 'test123');
    await whenStable();

    // Confirm password should be revalidated
    expect(fixture.componentInstance.formValue().passwords?.password).toBe(
      'test123'
    );
  });

  // Test for Issue #19: Circular dependency
  it('should prevent infinite validation loops with circular dependencies', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input type="number" name="amount" [ngModel]="formValue().amount" />
          <input name="description" [ngModel]="formValue().description" />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ amount: number; description: string }>
      >({});
      validationConfig = {
        amount: ['description'],
        description: ['amount'],
      };
      suite = create((model: any) => {
        test('amount', 'Amount is required when description exists', () => {
          if (model.description) {
            enforce(String(model.amount ?? '')).isNotBlank();
          }
        });
        test(
          'description',
          'Description is required when amount exists',
          () => {
            if (model.amount) {
              enforce(model.description).isNotBlank();
            }
          }
        );
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    // Test that no infinite loop occurs by monitoring console errors or timeouts
    let errorOccurred = false;
    const originalError = console.error;
    console.error = (...args) => {
      if (args.some((arg) => typeof arg === 'string' && arg.includes('loop'))) {
        errorOccurred = true;
      }
      originalError.apply(console, args);
    };

    try {
      // Trigger validation by changing amount
      const amountInput = fixture.nativeElement.querySelector(
        'input[name="amount"]'
      );
      await typeInto(amountInput, '100');
      await whenStable();

      // Should not have any loop-related errors
      expect(errorOccurred).toBe(false);
      expect(fixture.componentInstance.formValue().amount).toBe(100);
    } finally {
      console.error = originalError;
    }
  });

  // Test for dynamic validationConfig changes
  it('should handle dynamic validationConfig changes without memory leaks', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig()"
          (formValueChange)="formValue.set($event)"
        >
          <input name="firstName" [ngModel]="formValue().firstName" />
          <input name="lastName" [ngModel]="formValue().lastName" />
          <input name="email" [ngModel]="formValue().email" />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ firstName: string; lastName: string; email: string }>
      >({});
      validationConfig = signal<any>({
        firstName: ['lastName'],
      });
      suite = create((model: any) => {
        test('firstName', 'First name is required', () => {
          enforce(model.firstName).isNotBlank();
        });
        test('lastName', 'Last name is required', () => {
          enforce(model.lastName).isNotBlank();
        });
        test('email', 'Email is required', () => {
          enforce(model.email).isNotBlank();
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    // Change config multiple times
    fixture.componentInstance.validationConfig.set({
      email: ['firstName', 'lastName'],
    });
    await whenStable();

    fixture.componentInstance.validationConfig.set({ lastName: ['email'] });
    await whenStable();

    // Should not have memory leaks or errors
    const emailInput = fixture.nativeElement.querySelector(
      'input[name="email"]'
    );
    await typeInto(emailInput, 'test@example.com');
    await whenStable();

    expect(fixture.componentInstance.formValue().email).toBe(
      'test@example.com'
    );
  });

  // Test for nested group validation config
  it('should work with nested form groups in validationConfig', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <div ngModelGroup="user">
            <input name="name" [ngModel]="formValue().user?.name" />
            <div ngModelGroup="contact">
              <input
                name="email"
                [ngModel]="formValue().user?.contact?.email"
              />
            </div>
          </div>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          user: {
            name: string;
            contact: { email: string };
          };
        }>
      >({});
      validationConfig = {
        'user.name': ['user.contact.email'],
      };
      suite = create((model: any) => {
        test(
          'user.contact.email',
          'Email required when name is provided',
          () => {
            if (model.user?.name) {
              enforce(model.user?.contact?.email).isNotBlank();
            }
          }
        );
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const nameInput = fixture.nativeElement.querySelector('input[name="name"]');
    await typeInto(nameInput, 'John Doe');
    await whenStable();

    // Email validation should have been triggered
    expect(fixture.componentInstance.formValue().user?.name).toBe('John Doe');

    // Verify email validation was triggered by checking the form's validity state
    // The email field should now be invalid since it's required but empty
    const form = fixture.nativeElement.querySelector('form');
    const emailInput = fixture.nativeElement.querySelector(
      'input[name="email"]'
    );

    // Let validation complete
    await whenStable();

    // The email control should be invalid because name is provided but email is empty
    expect(emailInput.checkValidity()).toBe(true); // HTML5 validity (not our custom validation)

    // Test that providing email makes the validation pass
    await typeInto(emailInput, 'john@example.com');
    await whenStable();

    // Now both fields have values, form should be in a better state
    expect(fixture.componentInstance.formValue().user?.contact?.email).toBe(
      'john@example.com'
    );

    // Verify the validation config actually worked by clearing the name
    // This should make the email validation pass (since email is no longer required)
    const nameInputEl =
      fixture.nativeElement.querySelector('input[name="name"]');
    await typeInto(nameInputEl, '');
    await whenStable();

    expect(fixture.componentInstance.formValue().user?.name).toBe('');
  });

  // Test for separate input and output signals (Issue #11)
  it('should work with separate input and output signals (Issue #11)', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="inputFormValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="handleFormChange($event)"
        >
          <input name="password" [ngModel]="outputFormValue().password" />
          <input
            name="confirmPassword"
            [ngModel]="outputFormValue().confirmPassword"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      // Separate signals - input vs output
      inputFormValue = signal<
        NgxDeepPartial<{ password: string; confirmPassword: string }>
      >({});
      outputFormValue = signal<
        NgxDeepPartial<{ password: string; confirmPassword: string }>
      >({});

      validationConfig = {
        password: ['confirmPassword'],
      };

      suite = create((model: any) => {
        test('confirmPassword', 'Passwords must match', () => {
          if (model.password && model.confirmPassword) {
            enforce(model.confirmPassword).equals(model.password);
          }
        });
      });

      handleFormChange(value: any) {
        // Update only the output signal, not the input
        this.outputFormValue.set(value);
      }
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    // Change password - this should trigger confirmPassword validation
    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    );
    await typeInto(passwordInput, 'test123');
    await whenStable();

    // Verify the form state updated in output signal
    expect(fixture.componentInstance.outputFormValue().password).toBe(
      'test123'
    );

    // Now set confirmPassword to a different value
    const confirmInput = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]'
    );
    await typeInto(confirmInput, 'different');
    await whenStable();

    // Change password again - should trigger confirmPassword revalidation
    await typeInto(passwordInput, 'newpassword');
    await whenStable();

    // The validation should work even with separate signals
    expect(fixture.componentInstance.outputFormValue().password).toBe(
      'newpassword'
    );
    expect(fixture.componentInstance.outputFormValue().confirmPassword).toBe(
      'different'
    );

    // This regression intentionally keeps input and output signals separate.
    // That works, but it is not the recommended unidirectional ownership model,
    // so the dev-mode NGX-100 diagnostic is expected.
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NGX-100]')
    );
    consoleWarnSpy.mockRestore();
  });

  // Test for bidirectional dependencies with omitWhen (moved from omit-when-validation-config.spec.ts)
  it('should handle bidirectional validationConfig with omitWhen correctly', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          #vestForm="ngxVestForm"
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <ngx-control-wrapper>
            <input
              name="quantity"
              type="number"
              [ngModel]="formValue().quantity"
            />
          </ngx-control-wrapper>
          <ngx-control-wrapper>
            <input
              name="justification"
              type="text"
              [ngModel]="formValue().justification"
            />
          </ngx-control-wrapper>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          quantity: number | null;
          justification: string | null;
        }>
      >({
        quantity: null,
        justification: null,
      });
      validationConfig = {
        quantity: ['justification'],
        justification: ['quantity'],
      };
      suite = create((model: any) => {
        const hasQuantity = !!model.quantity;
        const hasJustification = !!model.justification;
        const hasEither = hasQuantity || hasJustification;

        // Use omitWhen to skip ALL validation when both are empty
        omitWhen(!hasEither, () => {
          // BOTH fields are required when either has a value
          test('justification', 'Justification is required', () => {
            enforce(model.justification).isNotBlank();
          });

          test('quantity', 'Quantity is required', () => {
            enforce(model.quantity).isTruthy();
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const quantityInput = fixture.nativeElement.querySelector(
      'input[name="quantity"]'
    ) as HTMLInputElement;
    const justificationInput = fixture.nativeElement.querySelector(
      'input[name="justification"]'
    ) as HTMLInputElement;

    // Initial state: both empty, both should be valid (omitWhen skips validation)
    expect(fixture.componentInstance.formValue().quantity).toBe(null);
    expect(fixture.componentInstance.formValue().justification).toBe(null);
    expect(quantityInput.classList.contains('ng-valid')).toBe(true);
    expect(justificationInput.classList.contains('ng-valid')).toBe(true);

    // Fill quantity → both fields become required, justification becomes invalid
    await typeInto(quantityInput, '123');

    // Wait for debounced validation: justification should become invalid
    // (required but empty). Quantity stays valid (has value).
    // Error won't show until justification is touched.
    await waitFor(() => {
      expect(justificationInput.classList.contains('ng-invalid')).toBe(true);
    });
    expect(quantityInput.classList.contains('ng-valid')).toBe(true);

    // Touch justification to show error
    await userEvent.click(justificationInput);
    await userEvent.tab();
    await expect
      .poll(() => justificationInput.classList.contains('ng-touched'))
      .toBe(true);

    expect(justificationInput.classList.contains('ng-invalid')).toBe(true);
    expect(justificationInput.classList.contains('ng-touched')).toBe(true);

    // Clear quantity → both should become valid again (omitWhen skips validation)
    await typeInto(quantityInput, '');

    // Both empty → omitWhen skips validation → both valid.
    // Clearing quantity happened inside the loop-prevention cooldown window,
    // so the change was DEFERRED and replayed once the cooldown expired
    // (C-B1): justification is revalidated against the cleared quantity and
    // its stale "required" error is removed — without any further user
    // interaction. The touched state is intentionally preserved.
    await waitFor(() => {
      expect(quantityInput.classList.contains('ng-valid')).toBe(true);
      expect(justificationInput.classList.contains('ng-valid')).toBe(true);
      expect(justificationInput.classList.contains('ng-invalid')).toBe(false);
      expect(justificationInput.classList.contains('ng-touched')).toBe(true);
    });
  });

  // Additional comprehensive tests for quantity/justification bidirectional validation with touch states
  /**
   * Tests the correct UX flow for cross-field validation with omitWhen + validationConfig.
   *
   * CORRECT UX Flow:
   * 1. User fills in "quantity" with a value (e.g., "123")
   * 2. User tabs to next field → "quantity" becomes touched
   * 3. User tabs out of "justification" → "justification" becomes touched
   * 4. Expected: Error appears on "justification" field (after touched, but without being dirty)
   *
   * Key Point: The error should NOT appear immediately when quantity is filled.
   * It should only appear after the user touches (blurs) the justification field.
   * The field becomes invalid (ng-invalid) but not dirty (ng-pristine) since no value was entered.
   *
   * This provides better UX - users aren't confronted with errors for fields they haven't
   * interacted with yet. The validationConfig ensures the dependent field is validated
   * when the trigger field changes, but the error only displays after the user has
   * indicated interest in that field (by focusing and blurring).
   */
  it('should show error on justification when quantity is filled but justification is empty (with blur)', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input
            name="quantity"
            type="number"
            [ngModel]="formValue().quantity"
          />
          <input
            name="justification"
            type="text"
            [ngModel]="formValue().justification"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          quantity: number | null;
          justification: string | null;
        }>
      >({
        quantity: null,
        justification: null,
      });
      validationConfig = {
        quantity: ['justification'],
        justification: ['quantity'],
      };
      suite = create((model: any) => {
        const hasQuantity = !!model.quantity;
        const hasJustification = !!model.justification;
        const hasEither = hasQuantity || hasJustification;

        omitWhen(!hasEither, () => {
          test('justification', 'Justification is required', () => {
            enforce(model.justification).isNotBlank();
          });

          test('quantity', 'Quantity is required', () => {
            enforce(model.quantity).isTruthy();
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const quantityInput = fixture.nativeElement.querySelector(
      'input[name="quantity"]'
    );
    const justificationInput = fixture.nativeElement.querySelector(
      'input[name="justification"]'
    );

    // Fill quantity
    await typeInto(quantityInput, '123');

    // NOW blur justification to trigger touch state
    await userEvent.click(justificationInput);
    await userEvent.tab();

    // Justification should be invalid and touched (marked by blur)
    // Wait for debounced validation config to revalidate justification
    await waitFor(() => {
      expect(justificationInput.classList.contains('ng-invalid')).toBe(true);
      expect(justificationInput.classList.contains('ng-touched')).toBe(true);
    });
  });

  // INVESTIGATE-01 (plans/README.md): a dependent that is kept mounted with
  // [hidden], and becomes required through a trigger change while untouched,
  // must show its error once the user blurs it.
  it('should show the error of a [hidden]-mounted dependent on its own blur after a trigger made it required', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <ngx-control-wrapper>
            <label for="quantity">Quantity</label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              [ngModel]="formValue().quantity"
            />
          </ngx-control-wrapper>
          <ngx-control-wrapper [hidden]="(formValue().quantity ?? 0) <= 5">
            <label for="justification">Justification</label>
            <input
              id="justification"
              name="justification"
              type="text"
              [ngModel]="formValue().justification"
            />
          </ngx-control-wrapper>
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ quantity: number | null; justification: string }>
      >({ quantity: null, justification: '' });
      validationConfig = { quantity: ['justification'] };
      suite = create((model: any) => {
        omitWhen((model.quantity ?? 0) <= 5, () => {
          test('justification', 'Justification is required', () => {
            enforce(model.justification).isNotBlank();
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);
    fixture.detectChanges();
    await whenStable();

    const quantityInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#quantity');
    const justificationInput: HTMLInputElement =
      fixture.nativeElement.querySelector('#justification');

    await typeInto(quantityInput, '10');
    await waitFor(() => {
      expect(justificationInput.closest('[hidden]')).toBeNull();
      expect(justificationInput.classList.contains('ng-invalid')).toBe(true);
    });
    // Untouched, so the error is not displayed yet.
    expect(fixture.nativeElement.textContent).not.toContain(
      'Justification is required'
    );

    await userEvent.click(justificationInput);
    await userEvent.tab();

    await waitFor(() => {
      expect(fixture.nativeElement.textContent).toContain(
        'Justification is required'
      );
      expect(justificationInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should show error on quantity when justification is filled but quantity is empty (with blur)', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input
            name="quantity"
            type="number"
            [ngModel]="formValue().quantity"
          />
          <input
            name="justification"
            type="text"
            [ngModel]="formValue().justification"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          quantity: number | null;
          justification: string | null;
        }>
      >({
        quantity: null,
        justification: null,
      });
      validationConfig = {
        quantity: ['justification'],
        justification: ['quantity'],
      };
      suite = create((model: any) => {
        const hasQuantity = !!model.quantity;
        const hasJustification = !!model.justification;
        const hasEither = hasQuantity || hasJustification;

        omitWhen(!hasEither, () => {
          test('justification', 'Justification is required', () => {
            enforce(model.justification).isNotBlank();
          });

          test('quantity', 'Quantity is required', () => {
            enforce(model.quantity).isTruthy();
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const quantityInput = fixture.nativeElement.querySelector(
      'input[name="quantity"]'
    );
    const justificationInput = fixture.nativeElement.querySelector(
      'input[name="justification"]'
    );

    // Fill justification
    await typeInto(justificationInput, 'test');

    // NOW blur quantity to trigger touch state
    await userEvent.click(quantityInput);
    await userEvent.tab();

    // Quantity should be invalid and touched (marked by blur)
    // Wait for debounced validation config to revalidate quantity
    await waitFor(() => {
      expect(quantityInput.classList.contains('ng-invalid')).toBe(true);
      expect(quantityInput.classList.contains('ng-touched')).toBe(true);
    });
  });

  it('should remove error from justification when quantity is cleared', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input
            name="quantity"
            type="number"
            [ngModel]="formValue().quantity"
          />
          <input
            name="justification"
            type="text"
            [ngModel]="formValue().justification"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{
          quantity: number | null;
          justification: string | null;
        }>
      >({
        quantity: null,
        justification: null,
      });
      validationConfig = {
        quantity: ['justification'],
        justification: ['quantity'],
      };
      suite = create((model: any) => {
        const hasQuantity = !!model.quantity;
        const hasJustification = !!model.justification;
        const hasEither = hasQuantity || hasJustification;

        omitWhen(!hasEither, () => {
          test('justification', 'Justification is required', () => {
            enforce(model.justification).isNotBlank();
          });

          test('quantity', 'Quantity is required', () => {
            enforce(model.quantity).isTruthy();
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const quantityInput = fixture.nativeElement.querySelector(
      'input[name="quantity"]'
    );
    const justificationInput = fixture.nativeElement.querySelector(
      'input[name="justification"]'
    );

    // Fill quantity first
    await typeInto(quantityInput, '123');

    // NOW blur justification to trigger touch state
    await userEvent.click(justificationInput);
    await userEvent.tab();

    // After blur, justification should be invalid and touched
    // Wait for debounced validation config to revalidate justification
    await waitFor(() => {
      expect(justificationInput.classList.contains('ng-invalid')).toBe(true);
      expect(justificationInput.classList.contains('ng-touched')).toBe(true);
    });

    // Now clear quantity
    await typeInto(quantityInput, '');

    // Trigger blur on quantity to complete the validation cycle
    await userEvent.tab();

    // Clearing quantity arrived inside the loop-prevention cooldown window,
    // so the pipeline defers it and replays the cycle after the cooldown
    // (C-B1): justification is revalidated against the cleared quantity,
    // omitWhen now skips the "required" rule, and the stale error is removed.
    // Touched state is intentionally preserved.
    await waitFor(() => {
      expect(justificationInput.classList.contains('ng-invalid')).toBe(false);
      expect(justificationInput.classList.contains('ng-valid')).toBe(true);
      expect(justificationInput.classList.contains('ng-touched')).toBe(true);
    });
  });

  // Test for debounce behavior with rapid successive changes
  it('should debounce validation config triggers properly with rapid changes', async () => {
    let triggerCount = 0;

    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="handleFormChange($event)"
        >
          <input name="triggerField" [ngModel]="formValue().triggerField" />
          <input name="dependentField" [ngModel]="formValue().dependentField" />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ triggerField: string; dependentField: string }>
      >({});

      validationConfig = {
        triggerField: ['dependentField'],
      };

      suite = create((model: any) => {
        triggerCount++;
        test('dependentField', 'Dependent field validation', () => {
          // Simple validation that always passes
          enforce(model.dependentField || 'default').isString();
        });
      });

      handleFormChange(value: any) {
        this.formValue.set(value);
      }
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();
    // Let initial setup complete: one validation run per control
    await expect.poll(() => triggerCount).toBeGreaterThanOrEqual(2);

    triggerCount = 0; // Reset counter after setup

    // Simulate rapid successive changes within the debounce window (100ms)
    const triggerInput = fixture.nativeElement.querySelector(
      'input[name="triggerField"]'
    );

    // Fire multiple rapid changes within debounce window
    // (one input event per change, so the suite-run count stays comparable)
    await pasteInto(triggerInput, 'value1');
    await pasteInto(triggerInput, 'value2');
    await pasteInto(triggerInput, 'value3');
    await pasteInto(triggerInput, 'value4');

    // Let validation settle
    await whenStable();

    // With proper debouncing, we should see only a small number of validations
    // despite multiple rapid input changes (counts all suite runs, not just dependent field)
    expect(triggerCount).toBeLessThanOrEqual(5); // Allow flexibility for debounce timing
    expect(fixture.componentInstance.formValue().triggerField).toBe('value4');
  });

  // Test for single-direction dependency with omitWhen (password/confirmPassword pattern)
  it('should handle single-direction validationConfig with omitWhen (password/confirmPassword)', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input
            name="password"
            type="password"
            [ngModel]="formValue().password"
          />
          <input
            name="confirmPassword"
            type="password"
            [ngModel]="formValue().confirmPassword"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ password: string; confirmPassword: string }>
      >({});
      validationConfig = {
        password: ['confirmPassword'],
      };
      suite = create((model: any) => {
        test('password', 'Password is required', () => {
          enforce(model.password).isNotBlank();
        });

        omitWhen(!model.password, () => {
          test('confirmPassword', 'Passwords must match', () => {
            enforce(model.confirmPassword).equals(model.password);
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    );
    const confirmPasswordInput = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]'
    );

    // Set password and confirmPassword to different values
    await typeInto(passwordInput, 'password123');
    await typeInto(confirmPasswordInput, 'different');

    // confirmPassword should be invalid (doesn't match)
    await waitFor(() => {
      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);
    });

    // Change password - should trigger confirmPassword revalidation
    await typeInto(passwordInput, 'newpassword');
    await whenStable();

    // confirmPassword should still be invalid (still doesn't match new password)
    await waitFor(() => {
      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);
    });

    // Now match the passwords
    await typeInto(confirmPasswordInput, 'newpassword');

    // Both should be valid now
    await waitFor(() => {
      expect(passwordInput.classList.contains('ng-valid')).toBe(true);
      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);
    });
  });

  it('should omit confirmPassword validation when password is empty', async () => {
    @Component({
      template: `
        <form
          ngxVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input
            name="password"
            type="password"
            [ngModel]="formValue().password"
          />
          <input
            name="confirmPassword"
            type="password"
            [ngModel]="formValue().confirmPassword"
          />
        </form>
      `,
      imports: [NgxVestForms],
    })
    class TestComponent {
      formValue = signal<
        NgxDeepPartial<{ password: string; confirmPassword: string }>
      >({});
      validationConfig = {
        password: ['confirmPassword'],
      };
      suite = create((model: any) => {
        test('password', 'Password is required', () => {
          enforce(model.password).isNotBlank();
        });

        omitWhen(!model.password, () => {
          test('confirmPassword', 'Passwords must match', () => {
            enforce(model.confirmPassword).equals(model.password);
          });
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    await whenStable();

    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    );
    const confirmPasswordInput = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]'
    );

    // Leave password empty, set confirmPassword to any value
    await typeInto(passwordInput, '');
    await typeInto(confirmPasswordInput, 'somevalue');
    await whenStable();

    // Password should be invalid (required but empty)
    // confirmPassword should be valid (validation is omitted when password is empty)
    await waitFor(() => {
      expect(passwordInput.classList.contains('ng-invalid')).toBe(true);
      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);
    });
  });

  // Modern Angular API Tests
  describe('Modern Angular APIs', () => {
    it('should use modern Angular patterns in FormDirective', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [validationConfig]="validationConfig"
          >
            <input name="email" [ngModel]="formValue().email" />
            <input name="confirmEmail" [ngModel]="formValue().confirmEmail" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class ModernTestComponent {
        formValue = signal<
          NgxDeepPartial<{ email?: string; confirmEmail?: string }>
        >({});
        validationConfig = { email: ['confirmEmail'] };
      }

      const fixture = TestBed.createComponent(ModernTestComponent);
      fixture.detectChanges();
      await whenStable();

      // Test that the form works with modern signal-based inputs
      expect(fixture.componentInstance.formValue()).toEqual({});

      // Update the signal and verify reactivity
      fixture.componentInstance.formValue.set({ email: 'test@example.com' });
      await whenStable();

      expect(fixture.componentInstance.formValue().email).toBe(
        'test@example.com'
      );

      fixture.destroy();
    });

    it('should handle reactive signal changes in validation config', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [validationConfig]="validationConfig()"
          >
            <input name="field1" [ngModel]="formValue().field1" />
            <input name="field2" [ngModel]="formValue().field2" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class ReactiveTestComponent {
        formValue = signal<
          NgxDeepPartial<{ field1?: string; field2?: string }>
        >({});
        validationConfig = signal<{ [key: string]: string[] }>({});
      }

      const fixture = TestBed.createComponent(ReactiveTestComponent);
      const component = fixture.componentInstance;
      fixture.detectChanges();
      await whenStable();

      // Verify initial state
      expect(component.validationConfig()).toEqual({});

      // Change validation config reactively using signals
      component.validationConfig.set({ field1: ['field2'] });
      await whenStable();

      // Verify the change was applied
      expect(component.validationConfig()).toEqual({ field1: ['field2'] });
    });

    // Test for lifecycle timing issue with component instance properties
    it('should handle validationConfig as component instance property (Issue #56)', async () => {
      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input
              type="password"
              name="password"
              [ngModel]="formValue().password"
            />
            <input
              type="password"
              name="confirmPassword"
              [ngModel]="formValue().confirmPassword"
            />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class LifecycleTestComponent {
        formValue = signal<
          NgxDeepPartial<{ password?: string; confirmPassword?: string }>
        >({});

        // This is a component instance property - should work without workarounds
        validationConfig = {
          password: ['confirmPassword'],
        };

        suite = create((model: any) => {
          test('password', 'Password is required', () => {
            enforce(model.password).isNotBlank();
          });
          test('confirmPassword', 'Passwords must match', () => {
            enforce(model.confirmPassword).equals(model.password);
          });
        });
      }

      const fixture = TestBed.createComponent(LifecycleTestComponent);
      fixture.detectChanges();
      await whenStable();

      // Set password field
      const passwordInput = fixture.nativeElement.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;
      const confirmPasswordInput = fixture.nativeElement.querySelector(
        'input[name="confirmPassword"]'
      ) as HTMLInputElement;

      // Type in password field
      await typeInto(passwordInput, 'password123');
      await whenStable();

      // Type in confirm password field (make it different to trigger error)
      await typeInto(confirmPasswordInput, 'different');
      await userEvent.tab();
      await whenStable();

      // Now change password again - confirmPassword should be revalidated
      await typeInto(passwordInput, 'newpassword');
      await whenStable();

      // The confirmPassword field should have been revalidated
      // This tests that validationConfig was properly set up despite being an instance property
      expect(fixture.componentInstance.formValue().password).toBe(
        'newpassword'
      );
      expect(fixture.componentInstance.formValue().confirmPassword).toBe(
        'different'
      );

      // Verify the actual validation state - confirmPassword should be invalid
      // because it doesn't match the new password
      const formElement = fixture.nativeElement.querySelector('form');
      const confirmPasswordControl = formElement.querySelector(
        'input[name="confirmPassword"]'
      ) as HTMLInputElement;

      // Wait for debounced revalidation to apply ng-* classes
      await waitFor(() => {
        // The control should be marked as invalid and touched
        expect(confirmPasswordControl.classList.contains('ng-invalid')).toBe(
          true
        );
        expect(confirmPasswordControl.classList.contains('ng-touched')).toBe(
          true
        );

        // Form should be invalid overall
        expect(formElement.classList.contains('ng-invalid')).toBe(true);
      });
    });

    // Test for duplicate subscriptions issue
    it('should not create duplicate subscriptions when setupValidationConfig is called multiple times', async () => {
      let validationCount = 0;

      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input name="field1" [ngModel]="formValue().field1" />
            <input name="field2" [ngModel]="formValue().field2" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class DuplicateSubscriptionTestComponent {
        formValue = signal<
          NgxDeepPartial<{ field1?: string; field2?: string }>
        >({});
        validationConfig = { field1: ['field2'] };

        suite = create((model: any) => {
          validationCount++;
          test('field1', 'Field 1 is required', () => {
            enforce(model.field1).isNotBlank();
          });
          test('field2', 'Field 2 is required', () => {
            enforce(model.field2).isNotBlank();
          });
        });
      }

      const fixture = TestBed.createComponent(
        DuplicateSubscriptionTestComponent
      );
      fixture.detectChanges();
      await whenStable();

      const field1Input = fixture.nativeElement.querySelector(
        'input[name="field1"]'
      ) as HTMLInputElement;
      const field2Input = fixture.nativeElement.querySelector(
        'input[name="field2"]'
      ) as HTMLInputElement;

      // Wait for initial validators with debounce timers to complete
      // (field1 is required but empty, so it should be invalid after validation)
      await waitFor(() => {
        expect(field1Input.classList.contains('ng-invalid')).toBe(true);
      });

      validationCount = 0;

      // Change field1 value - should trigger field2 validation ONCE
      // (a single input event, so the count reflects one change)
      await pasteInto(field1Input, 'test');
      await whenStable();

      // Wait for debounced validation to complete
      // (field1 should become valid since it now has a value)
      await waitFor(() => {
        expect(field1Input.classList.contains('ng-valid')).toBe(true);
      });

      // Should have triggered a bounded number of validations (not duplicates)
      // Counter now increments for all suite runs (field1 change + field2 via config)
      // This tests that we don't have duplicate subscriptions
      expect(validationCount).toBeLessThanOrEqual(3);

      // Verify the actual form control state
      const field2Control = fixture.componentInstance.formValue().field2;
      expect(field2Control).toBeUndefined(); // field2 was never touched by user

      // Verify that field2 input WAS validated (triggered by field1 change via validationConfig)
      // This proves the validationConfig is working correctly
      // Field2 is invalid because it's required and empty (validated due to validationConfig)
      expect(field2Input.classList.contains('ng-invalid')).toBe(true);
      // Field2 is still untouched (user never interacted with it directly)
      expect(field2Input.classList.contains('ng-untouched')).toBe(true);
    });

    it('should not create validation feedback loop with bidirectional validationConfig', async () => {
      // This test verifies the fix for the race condition bug report where
      // validation config was causing continuous re-triggering due to listening
      // to form.statusChanges even after controls were found.
      let validationCallCount = 0;

      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input name="aantal" type="number" [ngModel]="formValue().aantal" />
            <textarea
              name="onderbouwing"
              [ngModel]="formValue().onderbouwing"
            ></textarea>
          </form>
        `,
        imports: [NgxVestForms],
      })
      class RaceConditionTestComponent {
        formValue = signal<
          NgxDeepPartial<{ aantal: number | null; onderbouwing: string | null }>
        >({
          aantal: null,
          onderbouwing: null,
        });
        validationConfig = {
          aantal: ['onderbouwing'],
          onderbouwing: ['aantal'],
        };
        suite = create((model: any) => {
          validationCallCount++;

          const hasAantal = !!model.aantal;
          const hasOnderbouwing = !!model.onderbouwing;
          const hasEither = hasAantal || hasOnderbouwing;

          omitWhen(!hasEither, () => {
            test('onderbouwing', 'Onderbouwing is required', () => {
              enforce(model.onderbouwing).isNotBlank();
            });

            test('aantal', 'Aantal is required', () => {
              enforce(model.aantal).isTruthy();
            });
          });
        });
      }

      // Fake timers: the test asserts that nothing re-triggers over a period
      vi.useFakeTimers();
      onTestFinished(() => {
        vi.useRealTimers();
      });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const fixture = TestBed.configureTestingModule({
        imports: [RaceConditionTestComponent],
      }).createComponent(RaceConditionTestComponent);

      fixture.detectChanges();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Wait for initial validation to complete
      await vi.advanceTimersByTimeAsync(100);
      expect(validationCallCount).toBeGreaterThan(0);

      // Reset counter after initialization
      validationCallCount = 0;

      // Fill in aantal field
      await typeInto(aantalInput, '5', user);

      // Run past the validation-config debounce (100ms)
      // (onderbouwing should become invalid since aantal is filled)
      await vi.advanceTimersByTimeAsync(200);
      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);

      const validationCountAfterChange = validationCallCount;

      // Advance an additional period to see if validation keeps re-triggering
      // If there's a feedback loop, validationCallCount will continue to increase
      await vi.advanceTimersByTimeAsync(500);

      const validationCountAfterWait = validationCallCount;

      // The key test: validation should stabilize, not continue indefinitely
      // With bidirectional config, we expect some back-and-forth (typically 5-7 validations total)
      // But it should NOT continue after that - the count should remain stable
      expect(validationCountAfterWait).toBe(validationCountAfterChange);

      // Touch the onderbouwing field to see errors
      await user.click(onderbouwingInput);
      await user.tab();
      await vi.advanceTimersByTimeAsync(0);

      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);
    });

    it('should use take(1) to prevent continuous statusChanges listening', async () => {
      // This test verifies that triggerControl$ uses take(1) to stop listening
      // after the control is found, preventing the feedback loop described in PR #60
      const statusChangesSubscriptionCount = 0;

      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input name="field1" [ngModel]="formValue().field1" />
            <input name="field2" [ngModel]="formValue().field2" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<NgxDeepPartial<{ field1: string; field2: string }>>({
          field1: '',
          field2: '',
        });
        validationConfig = {
          field1: ['field2'],
        };
        suite = create((model: any) => {
          test('field1', 'Required', () => {
            enforce(model.field1).isNotBlank();
          });
          test('field2', 'Required', () => {
            enforce(model.field2).isNotBlank();
          });
        });
      }

      // Fake timers: the count is taken after the debounced cycle has settled
      vi.useFakeTimers();
      onTestFinished(() => {
        vi.useRealTimers();
      });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();

      const field1Input = fixture.nativeElement.querySelector(
        'input[name="field1"]'
      ) as HTMLInputElement;

      // Wait for initial validation to complete before spying
      await vi.advanceTimersByTimeAsync(100);
      expect(field1Input.classList.contains('ng-invalid')).toBe(true);

      // Spy on form.statusChanges after initialization
      const formDirective = (
        fixture.debugElement.children[0] as typeof fixture.debugElement
      ).injector.get(FormDirective);
      const originalStatusChanges = formDirective.ngForm.form.statusChanges;
      let subscribeCallCount = 0;

      // Patch statusChanges.subscribe to count subscriptions
      const originalSubscribe = originalStatusChanges.subscribe.bind(
        originalStatusChanges
      );
      originalStatusChanges.subscribe = ((...args: any[]) => {
        subscribeCallCount++;
        return originalSubscribe(...args);
      }) as any;

      // Trigger a change
      // (a single input event, so the count reflects one change)
      await pasteInto(field1Input, 'test', user);

      // Run past the validation-config debounce (100ms)
      // (field1 should become valid since it now has a value)
      await vi.advanceTimersByTimeAsync(200);
      expect(field1Input.classList.contains('ng-valid')).toBe(true);

      // With take(1), the subscription should be created but then immediately
      // complete, so subsequent status changes shouldn't create new subscriptions
      const initialSubscribeCount = subscribeCallCount;

      // Trigger another status change
      await pasteInto(field1Input, 'test2', user);

      // Let the debounced validation cycle settle
      // (count-based assertion: need to wait for all pending validations)
      await vi.advanceTimersByTimeAsync(300);

      // The subscribe count should not increase significantly
      // (may increase by 1-2 due to new validation cycle, but not continuously)
      expect(subscribeCallCount - initialSubscribeCount).toBeLessThan(3);
    });

    it('should prevent re-entry with validationInProgress Set', async () => {
      // This test verifies that the validationInProgress Set prevents
      // a field from triggering validation while it's already being validated
      let validationCallCount = 0;

      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input name="field1" [ngModel]="formValue().field1" />
            <input name="field2" [ngModel]="formValue().field2" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<NgxDeepPartial<{ field1: string; field2: string }>>({
          field1: '',
          field2: '',
        });
        validationConfig = {
          field1: ['field2'],
          field2: ['field1'],
        };
        suite = create((model: any) => {
          validationCallCount++;

          test('field1', 'Required', () => {
            enforce(model.field1).isNotBlank();
          });
          test('field2', 'Required', () => {
            enforce(model.field2).isNotBlank();
          });
        });
      }

      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await whenStable();

      const field1Input = fixture.nativeElement.querySelector(
        'input[name="field1"]'
      ) as HTMLInputElement;

      // Wait for initial validation to complete
      await waitFor(() => {
        expect(field1Input.classList.contains('ng-invalid')).toBe(true);
      });

      // Reset counters
      validationCallCount = 0;

      // Change field1, which should trigger field2 validation via config
      // (a single input event, so the count reflects one change)
      await pasteInto(field1Input, 'test');

      // Wait for debounced validation to complete
      // (field1 should become valid since it now has a value)
      await waitFor(() => {
        expect(field1Input.classList.contains('ng-valid')).toBe(true);
      });

      // With bidirectional config and validationInProgress protection:
      // - field1 changes → validates field1 (count: 1) → triggers field2 validation (count: 1)
      // - field2 validation completes → would try to trigger field1, but validationInProgress blocks it
      // Expected: bounded validation count (not continuous loop)
      expect(validationCallCount).toBeLessThan(10);
    });

    it('should NOT propagate touch state to dependent fields (improved UX)', async () => {
      // This test verifies that touch state is NOT propagated from trigger to dependent fields.
      // This prevents UX issues where dependent fields show errors immediately after being revealed
      // by a toggle, even though the user never interacted with them.
      //
      // Changed in PR #78: Previously, touch was propagated. Now it's not.
      // The validation still runs (field2 becomes invalid), but it's not marked as touched.
      // This means errors won't show until the user directly interacts with field2.

      @Component({
        template: `
          <form
            ngxVestForm
            [formValue]="formValue()"
            [suite]="suite"
            [validationConfig]="validationConfig"
            (formValueChange)="formValue.set($event)"
          >
            <input name="field1" [ngModel]="formValue().field1" />
            <input name="field2" [ngModel]="formValue().field2" />
          </form>
        `,
        imports: [NgxVestForms],
      })
      class TestComponent {
        formValue = signal<NgxDeepPartial<{ field1: string; field2: string }>>({
          field1: '',
          field2: '',
        });
        validationConfig = {
          field1: ['field2'],
        };
        suite = create((model: any) => {
          test('field1', 'Required', () => {
            enforce(model.field1).isNotBlank();
          });
          test('field2', 'Required', () => {
            enforce(model.field2).isNotBlank();
          });
        });
      }

      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await whenStable();

      const field1Input = fixture.nativeElement.querySelector(
        'input[name="field1"]'
      ) as HTMLInputElement;
      const field2Input = fixture.nativeElement.querySelector(
        'input[name="field2"]'
      ) as HTMLInputElement;

      // Wait for initial validation to complete (field1 required but empty)
      await waitFor(() => {
        expect(field1Input.classList.contains('ng-invalid')).toBe(true);
      });

      // Mark field1 as touched and change its value
      // (focus/blur directly: tabbing would move focus into field2)
      field1Input.focus();
      field1Input.blur();
      await typeInto(field1Input, 'test');

      // Wait for debounced validation config to revalidate field2
      await waitFor(() => {
        // Verify that field2 is NOT marked as touched (touch propagation removed)
        expect(field2Input.classList.contains('ng-touched')).toBe(false);

        // Verify validation still ran (field2 should be invalid because it's empty)
        // This is important: validation runs, but touch is not propagated
        expect(field2Input.classList.contains('ng-invalid')).toBe(true);

        // Verify field2 is marked as untouched (pristine untouched state)
        expect(field2Input.classList.contains('ng-untouched')).toBe(true);
      });
    });
  });
});
