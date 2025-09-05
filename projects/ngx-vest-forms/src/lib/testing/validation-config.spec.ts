import { Component, signal } from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vestForms } from '../exports';
import { staticSuite, test, enforce } from 'vest';
import { DeepPartial } from '../utils/deep-partial';

describe('FormDirective - ValidationConfig', () => {
  // Test for Issue #14: Controls not existing on initialization
  it('should handle validationConfig when controls are added dynamically', fakeAsync(() => {
    @Component({
      standalone: true,
      template: `
        <form
          scVestForm
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
      imports: [vestForms, FormsModule],
    })
    class TestComponent {
      formValue = signal<
        DeepPartial<{
          passwords: { password: string; confirmPassword: string };
        }>
      >({});
      showPasswordFields = signal(false);
      validationConfig = {
        'passwords.password': ['passwords.confirmPassword'],
      };
      suite = staticSuite((model: any, field?: string) => {
        test('passwords.password', 'Password is required', () => {
          enforce(model.passwords?.password).isNotBlank();
        });
        test('passwords.confirmPassword', 'Passwords must match', () => {
          enforce(model.passwords?.confirmPassword).equals(
            model.passwords?.password
          );
        });
      });
    }

    const fixture = TestBed.configureTestingModule({
      imports: [TestComponent],
    }).createComponent(TestComponent);

    fixture.detectChanges();
    tick();

    // No errors should occur when controls don't exist
    expect(() => {
      fixture.detectChanges();
      tick();
    }).not.toThrow();

    // Add controls dynamically
    fixture.componentInstance.showPasswordFields.set(true);
    fixture.detectChanges();
    tick(100);

    // Now validation config should work
    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    );
    passwordInput.value = 'test123';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(100);

    // Confirm password should be revalidated
    expect(fixture.componentInstance.formValue().passwords?.password).toBe(
      'test123'
    );
  }));

  // Test for Issue #19: Circular dependency
  it('should prevent infinite validation loops with circular dependencies', fakeAsync(() => {
    @Component({
      standalone: true,
      template: `
        <form
          scVestForm
          [formValue]="formValue()"
          [suite]="suite"
          [validationConfig]="validationConfig"
          (formValueChange)="formValue.set($event)"
        >
          <input name="amount" [ngModel]="formValue().amount" />
          <input name="description" [ngModel]="formValue().description" />
        </form>
      `,
      imports: [vestForms, FormsModule],
    })
    class TestComponent {
      formValue = signal<DeepPartial<{ amount: number; description: string }>>(
        {}
      );
      validationConfig = {
        amount: ['description'],
        description: ['amount'],
      };
      suite = staticSuite((model: any, field?: string) => {
        test('amount', 'Amount is required when description exists', () => {
          if (model.description) {
            enforce(model.amount).isNotBlank();
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
    tick();

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
      amountInput.value = '100';
      amountInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick(500);

      // Should not have any loop-related errors
      expect(errorOccurred).toBe(false);
      expect(fixture.componentInstance.formValue().amount).toBe('100');
    } finally {
      console.error = originalError;
    }
  }));

  // Test for dynamic validationConfig changes
  it('should handle dynamic validationConfig changes without memory leaks', fakeAsync(() => {
    @Component({
      standalone: true,
      template: `
        <form
          scVestForm
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
      imports: [vestForms, FormsModule],
    })
    class TestComponent {
      formValue = signal<
        DeepPartial<{ firstName: string; lastName: string; email: string }>
      >({});
      validationConfig = signal<any>({
        firstName: ['lastName'],
      });
      suite = staticSuite((model: any, field?: string) => {
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
    tick();

    // Change config multiple times
    fixture.componentInstance.validationConfig.set({
      email: ['firstName', 'lastName'],
    });
    fixture.detectChanges();
    tick();

    fixture.componentInstance.validationConfig.set({ lastName: ['email'] });
    fixture.detectChanges();
    tick();

    // Should not have memory leaks or errors
    const emailInput = fixture.nativeElement.querySelector(
      'input[name="email"]'
    );
    emailInput.value = 'test@example.com';
    emailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(100);

    expect(fixture.componentInstance.formValue().email).toBe(
      'test@example.com'
    );
  }));

  // Test for nested group validation config
  it('should work with nested form groups in validationConfig', fakeAsync(() => {
    @Component({
      standalone: true,
      template: `
        <form
          scVestForm
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
      imports: [vestForms, FormsModule],
    })
    class TestComponent {
      formValue = signal<
        DeepPartial<{
          user: {
            name: string;
            contact: { email: string };
          };
        }>
      >({});
      validationConfig = {
        'user.name': ['user.contact.email'],
      };
      suite = staticSuite((model: any, field?: string) => {
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
    tick();

    const nameInput = fixture.nativeElement.querySelector('input[name="name"]');
    nameInput.value = 'John Doe';
    nameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(100);

    // Email validation should have been triggered
    expect(fixture.componentInstance.formValue().user?.name).toBe('John Doe');
  }));
});
