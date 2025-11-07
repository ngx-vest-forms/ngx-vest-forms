/**
 * Test to reproduce password validation issue from GitHub Copilot chat
 * Tests the three specific validation requirements:
 * 1. Password is required
 * 2. Confirm password is only required when password is filled in
 * 3. Passwords should match, but only check if both are filled in
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vestForms } from './projects/ngx-vest-forms/src/lib/exports';
import { staticSuite, test, enforce, omitWhen } from 'vest';

describe('Password Validation Issue', () => {
  @Component({
    template: `
      <form
        scVestForm
        [formValue]="formValue()"
        [suite]="suite"
        [validationConfig]="validationConfig"
        (formValueChange)="formValue.set($event)"
      >
        <div ngModelGroup="passwords">
          <div sc-control-wrapper>
            <input
              name="password"
              type="password"
              [ngModel]="formValue().passwords?.password"
            />
          </div>
          <div sc-control-wrapper>
            <input
              name="confirmPassword"
              type="password"
              [ngModel]="formValue().passwords?.confirmPassword"
            />
          </div>
        </div>
      </form>
    `,
    imports: [vestForms, FormsModule],
  })
  class PasswordTestComponent {
    formValue = signal<{
      passwords?: { password?: string; confirmPassword?: string };
    }>({});

    validationConfig = {
      'passwords.password': ['passwords.confirmPassword'],
    };

    suite = staticSuite((model: any, field?: string) => {
      // 1. Password is required
      test('passwords.password', 'Password is not filled in', () => {
        enforce(model.passwords?.password).isNotBlank();
      });

      // 2. Confirm password is only required when password is filled in
      omitWhen(!model.passwords?.password, () => {
        test(
          'passwords.confirmPassword',
          'Confirm password is not filled in',
          () => {
            enforce(model.passwords?.confirmPassword).isNotBlank();
          }
        );
      });

      // 3. Passwords should match, but only check if both are filled in
      omitWhen(
        !model.passwords?.password || !model.passwords?.confirmPassword,
        () => {
          test('passwords', 'Passwords do not match', () => {
            enforce(model.passwords?.confirmPassword).equals(
              model.passwords?.password
            );
          });
        }
      );
    });
  }

  it('should validate password is required', async () => {
    const fixture = TestBed.createComponent(PasswordTestComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    // Trigger blur to show validation errors
    passwordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Should show error: "Password is not filled in"
    const errorElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorElement?.textContent).toContain('Password is not filled in');
  });

  it('should only require confirm password when password is filled', async () => {
    const fixture = TestBed.createComponent(PasswordTestComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    // First: confirm password should NOT show error when password is empty
    confirmPasswordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    let confirmPasswordErrors = confirmPasswordInput
      .closest('div[sc-control-wrapper]')
      ?.querySelectorAll('[role="alert"]');
    expect(confirmPasswordErrors?.length || 0).toBe(0);

    // Now: Fill password, confirm password should be required
    passwordInput.value = 'Test1234';
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Wait for debounce (validationConfig should trigger confirmPassword validation)
    await new Promise((resolve) => setTimeout(resolve, 150));
    fixture.detectChanges();
    await fixture.whenStable();

    confirmPasswordInput.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Should now show error: "Confirm password is not filled in"
    confirmPasswordErrors = confirmPasswordInput
      .closest('div[sc-control-wrapper]')
      ?.querySelectorAll('[role="alert"]');
    expect(confirmPasswordErrors?.length || 0).toBeGreaterThan(0);
  });

  it('should check passwords match only when both are filled', async () => {
    const fixture = TestBed.createComponent(PasswordTestComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const passwordInput = fixture.nativeElement.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const confirmPasswordInput = fixture.nativeElement.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    // Fill both passwords with different values
    passwordInput.value = 'Test1234';
    passwordInput.dispatchEvent(new Event('input'));
    passwordInput.dispatchEvent(new Event('blur'));

    confirmPasswordInput.value = 'Different123';
    confirmPasswordInput.dispatchEvent(new Event('input'));
    confirmPasswordInput.dispatchEvent(new Event('blur'));

    fixture.detectChanges();
    await fixture.whenStable();

    // Should show error: "Passwords do not match"
    const passwordsGroupErrors = fixture.nativeElement
      .querySelector('div[ngModelGroup="passwords"]')
      ?.querySelectorAll('[role="alert"]');

    // Look for the "do not match" error
    const hasMatchError = Array.from(passwordsGroupErrors || []).some(
      (el: any) => el.textContent?.includes('do not match')
    );
    expect(hasMatchError).toBe(true);
  });
});
