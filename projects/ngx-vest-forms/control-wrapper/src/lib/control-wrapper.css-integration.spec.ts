import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { ngxVestForms } from 'ngx-vest-forms/core';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { NgxControlWrapper } from './control-wrapper.component';

/**
 * Test suite for NgxControlWrapper CSS theming integration
 *
 * This test suite validates:
 * - CSS custom properties integration with control wrapper
 * - Visual styling for warnings and errors
 * - CSS pseudo-class alignment with UX patterns
 * - Progressive vs final feedback visual differentiation
 */

// Test suite with warnings and errors
const testSuite = staticSuite(
  (data: { email?: string; password?: string } = {}, field?: string) => {
    only(field);

    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format looks unusual', () => {
      warn(); // Progressive feedback
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password seems weak', () => {
      warn(); // Progressive feedback
      enforce(data.password).matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      );
    });
  },
);

describe.skip('NgxControlWrapper CSS Theming Integration', () => {
  describe.skip('CSS Custom Properties Integration Tests', () => {
    it('should apply warning styling using CSS custom properties', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        // Custom CSS properties for theming
        styles: [
          `
            :host {
              --ngx-vest-forms-warning-color: #d97706;
              --ngx-vest-forms-warning-bg: #fffbeb;
              --ngx-vest-forms-warning-border: #fed7aa;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings>
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus and type to trigger warnings
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show warning message using custom properties
      await expect
        .poll(() => screen.queryByText(/Email format looks unusual/))
        .not.toBeNull();

      const wrapperElement = fixture.debugElement.query(
        (sel) => sel.name === 'ngx-control-wrapper',
      );

      if (wrapperElement?.nativeElement) {
        const wrapperStyle = globalThis.getComputedStyle(
          wrapperElement.nativeElement,
        );

        // Should have applied warning styling (check if custom properties are supported)
        expect(
          wrapperStyle.getPropertyValue('--ngx-vest-forms-warning-color'),
        ).toBe('#d97706');
      }
    });

    it('should apply error styling using CSS custom properties', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        styles: [
          `
            :host {
              --ngx-vest-forms-error-color: #dc2626;
              --ngx-vest-forms-error-bg: #fef2f2;
              --ngx-vest-forms-error-border: #fca5a5;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper>
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus, type, and blur to trigger errors
      await userEvent.click(input);
      await userEvent.tab(); // blur without typing
      await fixture.whenStable();

      // Should show error message
      await expect
        .poll(() => screen.queryByText(/Email is required/))
        .not.toBeNull();

      const wrapperElement = fixture.debugElement.query(
        (sel) => sel.name === 'ngx-control-wrapper',
      );

      if (wrapperElement?.nativeElement) {
        const wrapperStyle = globalThis.getComputedStyle(
          wrapperElement.nativeElement,
        );

        // Should have applied error styling
        expect(
          wrapperStyle.getPropertyValue('--ngx-vest-forms-error-color'),
        ).toBe('#dc2626');
      }
    });

    it('should support basic CSS integration patterns', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings data-testid="control-wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const wrapper = screen.getByTestId('control-wrapper');

      // Verify wrapper exists and provides CSS targeting hooks
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveAttribute('data-warning-mode');

      // Basic validation flow works
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show warnings
      await expect
        .poll(() => screen.queryByText(/Email format looks unusual/), {
          timeout: 1000,
        })
        .not.toBeNull();
    });
  });

  describe('Progressive vs Final Feedback Visual Differentiation', () => {
    it('should visually differentiate progressive warnings from final errors', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        styles: [
          `
            /* Clear visual differentiation between progressive and final feedback */
            :host {
              --ngx-vest-forms-warning-color: #d97706; /* Amber */
              --ngx-vest-forms-warning-bg: #fffbeb; /* Light amber */
              --ngx-vest-forms-warning-border: #fed7aa; /* Medium amber */

              --ngx-vest-forms-error-color: #dc2626; /* Red */
              --ngx-vest-forms-error-bg: #fef2f2; /* Light red */
              --ngx-vest-forms-error-border: #fca5a5; /* Medium red */
            }

            /* Test that different states get different visual treatment */
            .visual-test {
              padding: 0.5rem;
              border: 2px solid transparent;
              transition: all 0.2s ease;
            }

            /* Progressive feedback while typing */
            .visual-test.warning-state {
              background-color: var(--ngx-vest-forms-warning-bg, #fffbeb);
              border-color: var(--ngx-vest-forms-warning-border, #fed7aa);
              color: var(--ngx-vest-forms-warning-color, #d97706);
            }

            /* Final feedback after blur */
            .visual-test.error-state {
              background-color: var(--ngx-vest-forms-error-bg, #fef2f2);
              border-color: var(--ngx-vest-forms-error-border, #fca5a5);
              color: var(--ngx-vest-forms-error-color, #dc2626);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings>
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>

            <!-- Visual comparison elements -->
            <div class="visual-test warning-state" data-testid="warning-visual">
              Warning state example
            </div>
            <div class="visual-test error-state" data-testid="error-visual">
              Error state example
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const warningVisual = screen.getByTestId('warning-visual');
      const errorVisual = screen.getByTestId('error-visual');

      // Get computed styles for comparison
      const warningStyle = globalThis.getComputedStyle(warningVisual);
      const errorStyle = globalThis.getComputedStyle(errorVisual);

      // Should have visually distinct styling
      expect(warningStyle.backgroundColor).not.toBe(errorStyle.backgroundColor);
      expect(warningStyle.borderColor).not.toBe(errorStyle.borderColor);
      expect(warningStyle.color).not.toBe(errorStyle.color);

      // Warning should be amber-toned
      expect(warningStyle.backgroundColor).toBe('rgb(255, 251, 235)'); // Light amber
      expect(warningStyle.borderColor).toBe('rgb(254, 215, 170)'); // Medium amber
      expect(warningStyle.color).toBe('rgb(217, 119, 6)'); // Amber

      // Error should be red-toned
      expect(errorStyle.backgroundColor).toBe('rgb(254, 242, 242)'); // Light red
      expect(errorStyle.borderColor).toBe('rgb(252, 165, 165)'); // Medium red
      expect(errorStyle.color).toBe('rgb(220, 38, 38)'); // Red

      // Verify form behavior matches visual expectations
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show progressive warning
      await expect
        .poll(() => screen.queryByText(/Email format looks unusual/))
        .not.toBeNull();

      await userEvent.tab(); // blur
      await fixture.whenStable();

      // Should show final error
      await expect
        .poll(() => screen.queryByText(/Email is required/))
        .not.toBeNull();
    });
  });

  describe('CSS Pseudo-Class Integration with Control Wrapper', () => {
    it('should support :focus:invalid and :invalid:not(:focus) CSS patterns', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        styles: [
          `
            /* CSS-only styling that aligns with JavaScript logic */
            ngx-control-wrapper {
              display: block;
              border: 2px solid transparent;
              padding: 0.5rem;
              border-radius: 0.375rem;
              transition: all 0.2s ease;
            }

            /* Progressive warning while focused and invalid */
            ngx-control-wrapper:has(input:focus:invalid) {
              background-color: var(--ngx-vest-forms-warning-bg, #fffbeb);
              border-color: var(--ngx-vest-forms-warning-border, #fed7aa);
            }

            /* Final error after blur when invalid */
            ngx-control-wrapper:has(input:invalid:not(:focus)) {
              background-color: var(--ngx-vest-forms-error-bg, #fef2f2);
              border-color: var(--ngx-vest-forms-error-border, #fca5a5);
            }

            /* Success state when valid */
            ngx-control-wrapper:has(input:valid) {
              background-color: #f0fdf4; /* Light green */
              border-color: #a7f3d0; /* Medium green */
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings data-testid="wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const wrapper = screen.getByTestId('wrapper');

      // Initial state - should be neutral
      let wrapperStyle = globalThis.getComputedStyle(wrapper);
      expect(wrapperStyle.borderColor).toBe('rgba(0, 0, 0, 0)'); // Transparent

      // Focus + type invalid = warning state (:focus:invalid)
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');

      wrapperStyle = globalThis.getComputedStyle(wrapper);
      expect(wrapperStyle.backgroundColor).toBe('rgb(255, 251, 235)'); // Warning bg
      expect(wrapperStyle.borderColor).toBe('rgb(254, 215, 170)'); // Warning border

      // Blur while invalid = error state (:invalid:not(:focus))
      await userEvent.tab();

      wrapperStyle = globalThis.getComputedStyle(wrapper);
      expect(wrapperStyle.backgroundColor).toBe('rgb(254, 242, 242)'); // Error bg
      expect(wrapperStyle.borderColor).toBe('rgb(252, 165, 165)'); // Error border

      // Focus again and fix = success state (:valid)
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.type(input, 'valid@example.com');
      await fixture.whenStable();

      wrapperStyle = globalThis.getComputedStyle(wrapper);
      expect(wrapperStyle.backgroundColor).toBe('rgb(240, 253, 244)'); // Success bg
      expect(wrapperStyle.borderColor).toBe('rgb(167, 243, 208)'); // Success border
    });
  });

  describe('Multiple Field Interaction', () => {
    it('should handle independent styling for multiple fields', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        styles: [
          `
            ngx-control-wrapper {
              display: block;
              margin-bottom: 1rem;
              padding: 0.5rem;
              border: 2px solid #e5e7eb;
              border-radius: 0.375rem;
            }

            ngx-control-wrapper:has(input:focus:invalid) {
              border-color: var(--ngx-vest-forms-warning-border, #fed7aa);
              background-color: var(--ngx-vest-forms-warning-bg, #fffbeb);
            }

            ngx-control-wrapper:has(input:invalid:not(:focus)) {
              border-color: var(--ngx-vest-forms-error-border, #fca5a5);
              background-color: var(--ngx-vest-forms-error-bg, #fef2f2);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings data-testid="email-wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>

            <ngx-control-wrapper showWarnings data-testid="password-wrapper">
              <label for="password">Password</label>
              <input
                id="password"
                name="password"
                [ngModel]="model.password"
                type="password"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      await render(TestComponent);
      const emailInput = screen.getByRole('textbox', { name: /email/i });
      const passwordInput = screen.getByLabelText(/password/i);
      const emailWrapper = screen.getByTestId('email-wrapper');
      const passwordWrapper = screen.getByTestId('password-wrapper');

      // Focus email and trigger warnings
      await userEvent.click(emailInput);
      await userEvent.type(emailInput, 'invalid');

      // Email wrapper should have warning styling
      let emailStyle = globalThis.getComputedStyle(emailWrapper);
      let passwordStyle = globalThis.getComputedStyle(passwordWrapper);

      expect(emailStyle.borderColor).toBe('rgb(254, 215, 170)'); // Warning
      expect(passwordStyle.borderColor).toBe('rgb(229, 231, 235)'); // Neutral

      // Switch to password field
      await userEvent.click(passwordInput);
      await userEvent.type(passwordInput, 'weak');

      // Now password should have warning, email should have error (blurred + invalid)
      emailStyle = globalThis.getComputedStyle(emailWrapper);
      passwordStyle = globalThis.getComputedStyle(passwordWrapper);

      expect(emailStyle.borderColor).toBe('rgb(252, 165, 165)'); // Error (blurred)
      expect(passwordStyle.borderColor).toBe('rgb(254, 215, 170)'); // Warning (focused)

      // Tab out of password
      await userEvent.tab();

      // Both should now show error state
      emailStyle = globalThis.getComputedStyle(emailWrapper);
      passwordStyle = globalThis.getComputedStyle(passwordWrapper);

      expect(emailStyle.borderColor).toBe('rgb(252, 165, 165)'); // Error
      expect(passwordStyle.borderColor).toBe('rgb(252, 165, 165)'); // Error
    });
  });

  describe('showWarnings API Integration', () => {
    it('should respect showWarnings="false" and not show warning styling', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        styles: [
          `
            ngx-control-wrapper:has(input:focus:invalid) {
              background-color: var(--ngx-vest-forms-warning-bg, #fffbeb);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper
              showWarnings="false"
              data-testid="no-warnings-wrapper"
            >
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus and type invalid data
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should not show warning message
      expect(screen.queryByText(/Email format looks unusual/)).toBeNull();

      // CSS warning styling should still apply (it's independent of JS logic)
      // This tests the separation of concerns between CSS and JS
      const wrapper = screen.getByTestId('no-warnings-wrapper');
      const wrapperStyle = globalThis.getComputedStyle(wrapper);

      // CSS :focus:invalid would still apply, but JS warnings are disabled
      expect(wrapperStyle.backgroundColor).toBe('rgb(255, 251, 235)'); // CSS still applies
    });

    it('should respect showWarnings boolean attribute', async () => {
      @Component({
        imports: [ngxVestForms, NgxControlWrapper],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <ngx-control-wrapper showWarnings data-testid="warnings-wrapper">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />
            </ngx-control-wrapper>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = testSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus and type invalid data
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show warning message (showWarnings enabled)
      await expect
        .poll(() => screen.queryByText(/Email format looks unusual/))
        .not.toBeNull();
    });
  });
});
