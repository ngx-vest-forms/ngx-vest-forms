/**
 * Unit tests for NgxVestAutoAriaDirective
 *
 * Tests automatic ARIA attribute management for form accessibility:
 * - aria-invalid='true' when field has errors (string, not boolean)
 * - aria-describedby appends error IDs
 * - Manual attribute overrides take precedence
 * - Radio button group handling (only first gets aria-describedby)
 * - Global config disable via autoAria: false
 * - Field name extraction (4-tier priority)
 */

import { Component, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, test } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxFormErrorComponent } from '../components/ngx-form-error.component';
import { createVestForm } from '../create-vest-form';
import { NGX_VEST_FORMS_CONFIG } from '../tokens';
import { staticSafeSuite } from '../utils/safe-suite';
import { NgxVestAutoAriaDirective } from './ngx-vest-auto-aria.directive';
import { NgxVestAutoTouchDirective } from './ngx-vest-auto-touch.directive';
import { NgxVestFormProviderDirective } from './ngx-vest-form-provider.directive';

// Test validation suite
const testSuite = staticSafeSuite(
  (data: { email?: string; password?: string } = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email must contain @', () => {
      enforce(data.email).matches(/@/);
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });
  },
);

describe('NgxVestAutoAriaDirective', () => {
  describe('ARIA Attribute Generation', () => {
    it('should add aria-invalid="true" (string) when field has errors', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Initially empty - should show error immediately
      await expect.element(input).toHaveAttribute('aria-invalid', 'true');

      // Verify it's string 'true', not boolean
      const ariaInvalid = input.getAttribute('aria-invalid');
      expect(ariaInvalid).toBe('true');
      expect(typeof ariaInvalid).toBe('string');

      // Type valid email - aria-invalid should be removed
      await userEvent.clear(input);
      await userEvent.type(input, 'user@example.com');

      await expect.element(input).not.toHaveAttribute('aria-invalid');
    });

    it('should add aria-describedby with error ID when field has errors', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should have aria-describedby pointing to error element
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-error');

      // Type valid email - aria-describedby should be removed
      await userEvent.clear(input);
      await userEvent.type(input, 'user@example.com');

      await expect.element(input).not.toHaveAttribute('aria-describedby');
    });

    it('should preserve existing aria-describedby IDs (hint text)', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              aria-describedby="email-hint"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <span id="email-hint">We'll never share your email</span>
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should append error ID to existing hint ID
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-hint email-error');

      // Type valid email - should restore original hint ID only
      await userEvent.clear(input);
      await userEvent.type(input, 'user@example.com');

      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-hint');
    });
  });

  describe('Manual Override Detection', () => {
    it('should NOT override manual aria-invalid attribute', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [NgxVestAutoAriaDirective, NgxVestFormProviderDirective],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              aria-invalid="false"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Manual attribute should take precedence - stays 'false' even with errors
      await expect.element(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should append error ID to manual aria-describedby attribute', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [NgxVestAutoAriaDirective, NgxVestFormProviderDirective],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              aria-describedby="custom-hint"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should append error ID to existing manual ID
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'custom-hint email-error');
    });
  });

  describe('Radio Button Handling', () => {
    it('should only add aria-describedby to first radio in group', async () => {
      const radioSuite = staticSafeSuite((data: { gender?: string } = {}) => {
        test('gender', 'Gender is required', () => {
          enforce(data.gender).isNotEmpty();
        });
      });

      const form = createVestForm(signal({ gender: '' }), {
        suite: radioSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="gender-male"
              type="radio"
              name="gender"
              value="male"
              [checked]="form.gender() === 'male'"
              (change)="form.setGender($event)"
            />
            <label for="gender-male">Male</label>

            <input
              id="gender-female"
              type="radio"
              name="gender"
              value="female"
              [checked]="form.gender() === 'female'"
              (change)="form.setGender($event)"
            />
            <label for="gender-female">Female</label>

            <ngx-form-error [field]="form.genderField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);

      const maleRadio = screen.getByLabelText('Male') as HTMLInputElement;
      const femaleRadio = screen.getByLabelText('Female') as HTMLInputElement;

      // Only first radio should have aria-describedby
      await expect
        .element(maleRadio)
        .toHaveAttribute('aria-describedby', 'gender-error');
      await expect.element(femaleRadio).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Global Config', () => {
    it('should disable directive when autoAria config is false', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [NgxVestAutoAriaDirective, NgxVestFormProviderDirective],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_VEST_FORMS_CONFIG,
            useValue: { autoAria: false, autoTouch: true, debug: false },
          },
        ],
      });

      const input = screen.getByRole('textbox');

      // Directive disabled - no ARIA attributes added even with errors
      await expect.element(input).not.toHaveAttribute('aria-invalid');
      await expect.element(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Opt-Out Attribute', () => {
    it('should not apply when ngxVestAutoAriaDisabled attribute is present', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [NgxVestAutoAriaDirective, NgxVestFormProviderDirective],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              ngxVestAutoAriaDisabled
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Directive should not apply due to opt-out attribute
      await expect.element(input).not.toHaveAttribute('aria-invalid');
      await expect.element(input).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Field Name Extraction', () => {
    it('should use id attribute for field name', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should use 'email' from id and generate 'email-error' describedby
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-error');
    });

    it('should use name attribute as fallback when id is missing', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              name="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should use 'email' from name attribute
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-error');
    });

    it('should prefer data-vest-field over id/name', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'immediate',
      });

      @Component({
        imports: [
          NgxVestAutoAriaDirective,
          NgxFormErrorComponent,
          NgxVestFormProviderDirective,
        ],

        template: `
          <div [ngxVestFormProvider]="form">
            <input
              id="userEmail"
              name="user_email"
              data-vest-field="email"
              type="email"
              [value]="form.email()"
              (input)="form.setEmail($event)"
            />
            <ngx-form-error [field]="form.emailField()" />
          </div>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Should use 'email' from data-vest-field (highest priority)
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('Integration with NgxVestForms Bundle', () => {
    it('should work with all NgxVestForms directives and components', async () => {
      const form = createVestForm(signal({ email: '', password: '' }), {
        suite: testSuite,
        errorStrategy: 'on-touch',
      });

      const NgxVestForms = [
        NgxVestAutoAriaDirective,
        NgxVestAutoTouchDirective,
        NgxFormErrorComponent,
        NgxVestFormProviderDirective,
      ] as const;

      @Component({
        imports: [NgxVestForms],

        template: `
          <form>
            <div [ngxVestFormProvider]="form">
              <input
                id="email"
                type="email"
                [value]="form.email()"
                (input)="form.setEmail($event)"
              />
              <ngx-form-error [field]="form.emailField()" />
            </div>
          </form>
        `,
      })
      class TestComponent {
        form = form;
      }

      await render(TestComponent);
      const input = screen.getByRole('textbox');

      // Initially no errors shown (on-touch strategy)
      await expect.element(input).not.toHaveAttribute('aria-invalid');

      // Blur triggers touch - now errors show
      await userEvent.click(input);
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

      await expect.element(input).toHaveAttribute('aria-invalid', 'true');
      await expect
        .element(input)
        .toHaveAttribute('aria-describedby', 'email-error');
    });
  });
});
