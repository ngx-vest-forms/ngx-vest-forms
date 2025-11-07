/**
 * Comprehensive test suite for omitWhen + validationConfig interaction
 * Tests the scenario where omitWhen combined with validationConfig doesn't trigger validation as expected.
 * Related to issue: "create a proper test scenario for a more complex validationconfig"
 *
 * This test covers the pattern where:
 * - Field A and Field B are both optional when empty
 * - When Field A has a value, Field B becomes required
 * - When Field B has a value, Field A becomes required
 * - Bidirectional dependency via validationConfig
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DeepPartial } from '../utils/deep-partial';
import { vestForms } from '../exports';
import { staticSuite, test, enforce, only, omitWhen } from 'vest';
import { VALIDATION_CONFIG_DEBOUNCE_TIME } from '../constants';

// Wait time for tests should be slightly longer than debounce to ensure completion
// Buffer ensures all async operations (debounce + validation) have completed
const VALIDATION_COMPLETION_BUFFER = 50;
const TEST_DEBOUNCE_WAIT_TIME = VALIDATION_CONFIG_DEBOUNCE_TIME + VALIDATION_COMPLETION_BUFFER;

describe('omitWhen + validationConfig + Nested Fields', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
    }).compileComponents();
  });

  describe('Bidirectional dependencies with omitWhen', () => {
    type FormModel = DeepPartial<{
      berekendeAftrekVoorarrest: {
        aantal: number;
        onderbouwing: string;
      };
    }>;

    const validationSuite = staticSuite((model: FormModel, field?: string) => {
      if (field) {
        only(field);
      }

      // Require onderbouwing ONLY when aantal has a value
      omitWhen(!model.berekendeAftrekVoorarrest?.aantal, () => {
        test(
          'berekendeAftrekVoorarrest.onderbouwing',
          'Dit veld is verplicht',
          () => {
            enforce(model.berekendeAftrekVoorarrest?.onderbouwing).isNotEmpty();
          }
        );
      });

      // Require aantal when onderbouwing is filled (reverse dependency)
      omitWhen(!model.berekendeAftrekVoorarrest?.onderbouwing, () => {
        test('berekendeAftrekVoorarrest.aantal', 'Dit veld is verplicht', () => {
          enforce(model.berekendeAftrekVoorarrest?.aantal).isNotEmpty();
        });
      });
    });

    @Component({
      template: `
        <form
          scVestForm
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          [validationConfig]="validationConfig"
        >
          <div ngModelGroup="berekendeAftrekVoorarrest">
            <div>
              <label for="aantal">Aantal</label>
              <input
                type="number"
                id="aantal"
                name="aantal"
                [ngModel]="formValue().berekendeAftrekVoorarrest?.aantal"
              />
            </div>

            <div>
              <label for="onderbouwing">Onderbouwing</label>
              <textarea
                id="onderbouwing"
                name="onderbouwing"
                [ngModel]="formValue().berekendeAftrekVoorarrest?.onderbouwing"
              ></textarea>
            </div>
          </div>
        </form>
      `,
      imports: [vestForms, FormsModule],
    })
    class TestComponent {
      formValue = signal<FormModel>({});
      suite = validationSuite;

      // Bidirectional validation config
      validationConfig = {
        'berekendeAftrekVoorarrest.aantal': [
          'berekendeAftrekVoorarrest.onderbouwing',
        ],
        'berekendeAftrekVoorarrest.onderbouwing': [
          'berekendeAftrekVoorarrest.aantal',
        ],
      };
    }

    it('should show error on onderbouwing when aantal is filled but onderbouwing is empty', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Step 1: Type "1" in aantal
      aantalInput.value = '1';
      aantalInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Step 2: Blur aantal (triggers validation on aantal)
      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for debounce
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify form value was updated
      expect(
        fixture.componentInstance.formValue().berekendeAftrekVoorarrest?.aantal
      ).toBe(1);

      // Step 3: Focus and blur onderbouwing without entering data
      onderbouwingInput.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      await fixture.whenStable();

      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation to complete
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // The onderbouwing field should now be invalid because:
      // 1. aantal has a value (1)
      // 2. omitWhen(!aantal) evaluates to false, so the test should run
      // 3. enforce(onderbouwing).isNotEmpty() should fail (empty string)
      // 4. validationConfig should have triggered revalidation of onderbouwing
      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-touched')).toBe(true);

      // Form should be invalid
      const formElement = fixture.nativeElement.querySelector('form');
      expect(formElement.classList.contains('ng-invalid')).toBe(true);
    });

    it('should show error on aantal when onderbouwing is filled but aantal is empty', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Step 1: Fill onderbouwing
      onderbouwingInput.value = 'some text';
      onderbouwingInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Step 2: Blur onderbouwing
      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for debounce
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Verify form value was updated
      expect(
        fixture.componentInstance.formValue().berekendeAftrekVoorarrest
          ?.onderbouwing
      ).toBe('some text');

      // Step 3: Focus and blur aantal without entering data
      aantalInput.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      await fixture.whenStable();

      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation to complete
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // The aantal field should now be invalid because:
      // 1. onderbouwing has a value ("some text")
      // 2. omitWhen(!onderbouwing) evaluates to false, so the test should run
      // 3. enforce(aantal).isNotEmpty() should fail (empty)
      // 4. validationConfig should have triggered revalidation of aantal
      expect(aantalInput.classList.contains('ng-invalid')).toBe(true);
      expect(aantalInput.classList.contains('ng-touched')).toBe(true);

      // Form should be invalid
      const formElement = fixture.nativeElement.querySelector('form');
      expect(formElement.classList.contains('ng-invalid')).toBe(true);
    });

    it('should remove error from onderbouwing when aantal is cleared', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Step 1: Fill aantal
      aantalInput.value = '1';
      aantalInput.dispatchEvent(new Event('input'));
      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for debounce
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Step 2: Touch onderbouwing (but leave it empty)
      onderbouwingInput.dispatchEvent(new Event('focus'));
      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // At this point, onderbouwing should be invalid
      expect(onderbouwingInput.classList.contains('ng-invalid')).toBe(true);

      // Step 3: Clear aantal
      aantalInput.value = '';
      aantalInput.dispatchEvent(new Event('input'));
      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for debounce and validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Now onderbouwing should be valid because:
      // 1. aantal is empty
      // 2. omitWhen(!aantal) evaluates to true, so the test is omitted
      // 3. No validation errors should exist for onderbouwing
      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);

      // Form should be valid (both fields are optional when empty)
      const formElement = fixture.nativeElement.querySelector('form');
      expect(formElement.classList.contains('ng-valid')).toBe(true);
    });

    it('should be valid when both fields are filled', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Step 1: Fill both fields
      aantalInput.value = '1';
      aantalInput.dispatchEvent(new Event('input'));
      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      onderbouwingInput.value = 'some explanation';
      onderbouwingInput.dispatchEvent(new Event('input'));
      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for all validation to complete
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Both fields should be valid
      expect(aantalInput.classList.contains('ng-valid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);

      // Form should be valid
      const formElement = fixture.nativeElement.querySelector('form');
      expect(formElement.classList.contains('ng-valid')).toBe(true);

      // Verify form values
      expect(
        fixture.componentInstance.formValue().berekendeAftrekVoorarrest?.aantal
      ).toBe(1);
      expect(
        fixture.componentInstance.formValue().berekendeAftrekVoorarrest
          ?.onderbouwing
      ).toBe('some explanation');
    });

    it('should be valid when both fields are empty', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TestComponent],
      }).createComponent(TestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const aantalInput = fixture.nativeElement.querySelector(
        'input[name="aantal"]'
      ) as HTMLInputElement;
      const onderbouwingInput = fixture.nativeElement.querySelector(
        'textarea[name="onderbouwing"]'
      ) as HTMLTextAreaElement;

      // Touch both fields without entering data
      aantalInput.dispatchEvent(new Event('focus'));
      aantalInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      onderbouwingInput.dispatchEvent(new Event('focus'));
      onderbouwingInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Both fields should be valid (both are optional when empty)
      expect(aantalInput.classList.contains('ng-valid')).toBe(true);
      expect(onderbouwingInput.classList.contains('ng-valid')).toBe(true);

      // Form should be valid
      const formElement = fixture.nativeElement.querySelector('form');
      expect(formElement.classList.contains('ng-valid')).toBe(true);
    });
  });

  describe('Single direction dependency with omitWhen', () => {
    type SimpleFormModel = DeepPartial<{
      password: string;
      confirmPassword: string;
    }>;

    const simpleValidationSuite = staticSuite(
      (model: SimpleFormModel, field?: string) => {
        if (field) {
          only(field);
        }

        test('password', 'Password is required', () => {
          enforce(model.password).isNotEmpty();
        });

        // confirmPassword is only required when password is filled
        omitWhen(!model.password, () => {
          test('confirmPassword', 'Passwords must match', () => {
            enforce(model.confirmPassword).equals(model.password);
          });
        });
      }
    );

    @Component({
      template: `
        <form
          scVestForm
          [suite]="suite"
          [formValue]="formValue()"
          (formValueChange)="formValue.set($event)"
          [validationConfig]="validationConfig"
        >
          <div>
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [ngModel]="formValue().password"
            />
          </div>

          <div>
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              [ngModel]="formValue().confirmPassword"
            />
          </div>
        </form>
      `,
      imports: [vestForms, FormsModule],
    })
    class SimpleTestComponent {
      formValue = signal<SimpleFormModel>({});
      suite = simpleValidationSuite;

      // When password changes, revalidate confirmPassword
      validationConfig = {
        password: ['confirmPassword'],
      };
    }

    it('should validate confirmPassword when password changes', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [SimpleTestComponent],
      }).createComponent(SimpleTestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const passwordInput = fixture.nativeElement.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;
      const confirmPasswordInput = fixture.nativeElement.querySelector(
        'input[name="confirmPassword"]'
      ) as HTMLInputElement;

      // Step 1: Fill password
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Step 2: Fill confirmPassword with different value
      confirmPasswordInput.value = 'different';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // confirmPassword should be invalid (doesn't match)
      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);

      // Step 3: Change password again
      passwordInput.value = 'newpassword';
      passwordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation config to trigger
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // confirmPassword should still be invalid (still doesn't match)
      expect(confirmPasswordInput.classList.contains('ng-invalid')).toBe(true);

      // Step 4: Update confirmPassword to match
      confirmPasswordInput.value = 'newpassword';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // Now both should be valid
      expect(passwordInput.classList.contains('ng-valid')).toBe(true);
      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);
    });

    it('should omit confirmPassword validation when password is empty', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [SimpleTestComponent],
      }).createComponent(SimpleTestComponent);

      fixture.detectChanges();
      await fixture.whenStable();

      const passwordInput = fixture.nativeElement.querySelector(
        'input[name="password"]'
      ) as HTMLInputElement;
      const confirmPasswordInput = fixture.nativeElement.querySelector(
        'input[name="confirmPassword"]'
      ) as HTMLInputElement;

      // Touch confirmPassword without filling password
      confirmPasswordInput.dispatchEvent(new Event('focus'));
      confirmPasswordInput.value = 'somevalue';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // Wait for validation
      await new Promise((resolve) =>
        setTimeout(resolve, TEST_DEBOUNCE_WAIT_TIME)
      );
      fixture.detectChanges();
      await fixture.whenStable();

      // confirmPassword should be valid (omitted because password is empty)
      expect(confirmPasswordInput.classList.contains('ng-valid')).toBe(true);

      // Password should be invalid (required but empty)
      expect(passwordInput.classList.contains('ng-invalid')).toBe(true);
    });
  });
});
