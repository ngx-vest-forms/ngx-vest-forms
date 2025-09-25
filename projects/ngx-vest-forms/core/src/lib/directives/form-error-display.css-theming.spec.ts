import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { ngxVestForms } from '../exports';
import { NgxFormErrorDisplayDirective } from './form-error-display.directive';

/**
 * Test suite for CSS Custom Properties theming with ngx-vest-forms
 *
 * This test suite validates:
 * - CSS custom properties integration with form validation states
 * - Proper namespacing of CSS variables (--ngx-vest-forms-*)
 * - CSS pseudo-class alignment (:focus:invalid vs :invalid:not(:focus))
 * - Visual feedback timing and presentation
 */

// Test suite with both warnings and errors
const validationSuite = staticSuite(
  (data: { email?: string; password?: string } = {}, field?: string) => {
    only(field);

    // Email validation with warnings
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format looks unusual', () => {
      warn(); // Non-blocking warning
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    // Password validation
    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password strength: WEAK', () => {
      warn(); // Non-blocking warning
      enforce(data.password).matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      );
    });
  },
);

describe('CSS Theming Integration', () => {
  describe('CSS Custom Properties Support', () => {
    it('should apply CSS custom properties for error styling', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        // Include CSS custom properties in component styles
        styles: [
          `
            :host {
              --ngx-vest-forms-error-color: #dc2626;
              --ngx-vest-forms-error-bg: #fef2f2;
              --ngx-vest-forms-error-border: #fca5a5;
            }

            .field-wrapper {
              border: 1px solid transparent;
              padding: 0.5rem;
              background: white;
            }

            /* Error state styling using custom properties */
            .field-wrapper:has(input:invalid:not(:focus)) {
              background-color: var(--ngx-vest-forms-error-bg, #fef2f2);
              border-color: var(--ngx-vest-forms-error-border, #fca5a5);
              color: var(--ngx-vest-forms-error-color, #dc2626);
            }

            .error-message {
              color: var(--ngx-vest-forms-error-color, #dc2626);
              font-size: 0.875rem;
              margin-top: 0.25rem;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <div class="field-wrapper">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  [ngModel]="model.email"
                  type="email"
                />
              </div>

              @if (display.shouldShowErrors()) {
                <div
                  class="error-message"
                  data-testid="error-styling"
                  role="alert"
                >
                  @for (error of display.errors(); track error) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Trigger validation and blur
      await userEvent.click(input);
      await userEvent.tab(); // blur
      await fixture.whenStable();

      // Should show error with custom styling
      await expect
        .poll(() => screen.queryByTestId('error-styling'))
        .not.toBeNull();

      const errorElement = screen.getByTestId('error-styling');

      // Verify CSS custom property is applied (using computed styles)
      const computedStyle = globalThis.getComputedStyle(errorElement);
      expect(computedStyle.color).toBe('rgb(220, 38, 38)'); // #dc2626 in rgb
    });

    it('should apply CSS custom properties for warning styling', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        styles: [
          `
            :host {
              --ngx-vest-forms-warning-color: #d97706;
              --ngx-vest-forms-warning-bg: #fffbeb;
              --ngx-vest-forms-warning-border: #fed7aa;
            }

            .field-wrapper {
              border: 1px solid transparent;
              padding: 0.5rem;
              background: white;
            }

            /* Warning state styling using custom properties */
            .field-wrapper:has(input:focus:invalid) {
              background-color: var(--ngx-vest-forms-warning-bg, #fffbeb);
              border-color: var(--ngx-vest-forms-warning-border, #fed7aa);
              color: var(--ngx-vest-forms-warning-color, #d97706);
            }

            .warning-message {
              color: var(--ngx-vest-forms-warning-color, #d97706);
              font-size: 0.875rem;
              margin-top: 0.25rem;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <div class="field-wrapper">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  [ngModel]="model.email"
                  type="email"
                />
              </div>

              @if (display.shouldShowWarnings()) {
                <div
                  class="warning-message"
                  data-testid="warning-styling"
                  role="status"
                >
                  @for (warning of display.warnings(); track warning) {
                    <div>{{ warning }}</div>
                  }
                </div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus and type invalid data to trigger warnings
      await userEvent.click(input);
      await userEvent.type(input, 'invalid-email');
      await fixture.whenStable();

      // Should show warnings while focused
      await expect
        .poll(() => screen.queryByTestId('warning-styling'))
        .not.toBeNull();

      const warningElement = screen.getByTestId('warning-styling');

      // Verify CSS custom property is applied
      const computedStyle = globalThis.getComputedStyle(warningElement);
      expect(computedStyle.color).toBe('rgb(217, 119, 6)'); // #d97706 in rgb
    });

    it('should fallback to default colors when custom properties not defined', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        // No custom properties defined - should use fallbacks
        styles: [
          `
            .error-message {
              color: var(--ngx-vest-forms-error-color, #dc2626);
            }

            .warning-message {
              color: var(--ngx-vest-forms-warning-color, #d97706);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />

              @if (display.shouldShowWarnings()) {
                <div
                  class="warning-message"
                  data-testid="warning-fallback"
                  role="status"
                >
                  @for (warning of display.warnings(); track warning) {
                    <div>{{ warning }}</div>
                  }
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div
                  class="error-message"
                  data-testid="error-fallback"
                  role="alert"
                >
                  @for (error of display.errors(); track error) {
                    <div>{{ error }}</div>
                  }
                </div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Test warning fallback
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('warning-fallback'))
        .not.toBeNull();

      const warningElement = screen.getByTestId('warning-fallback');
      const warningStyle = globalThis.getComputedStyle(warningElement);
      expect(warningStyle.color).toBe('rgb(217, 119, 6)'); // Fallback color

      // Test error fallback
      await userEvent.tab(); // blur to trigger errors
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('error-fallback'))
        .not.toBeNull();

      const errorElement = screen.getByTestId('error-fallback');
      const errorStyle = globalThis.getComputedStyle(errorElement);
      expect(errorStyle.color).toBe('rgb(220, 38, 38)'); // Fallback color
    });
  });

  describe('CSS Pseudo-Class Alignment', () => {
    it('should show progressive warnings with :focus:invalid and hard errors with :invalid:not(:focus)', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        styles: [
          `
            .field-wrapper {
              border: 2px solid transparent;
              padding: 0.5rem;
              transition: all 0.2s ease;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <div class="field-wrapper" data-testid="field-wrapper">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  [ngModel]="model.email"
                  type="email"
                />
              </div>

              @if (display.shouldShowWarnings()) {
                <div data-testid="warnings" role="status">
                  Progressive feedback
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div data-testid="errors" role="alert">Hard error feedback</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const fieldWrapper = screen.getByTestId('field-wrapper');

      // Verify field wrapper exists
      expect(fieldWrapper).toBeInTheDocument();

      // Phase 1: Focus and type - should show warnings (progressive)
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Should show warnings while focused
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
      expect(screen.queryByTestId('errors')).toBeNull();

      // Verify CSS pseudo-class state (this is what developers need for CSS targeting)
      expect(input.matches(':focus:invalid')).toBe(true);

      // Phase 2: Blur - should show errors (hard feedback)
      await userEvent.tab();
      await fixture.whenStable();

      // Should now show errors after blur
      await expect.poll(() => screen.queryByTestId('errors')).not.toBeNull();

      // Verify CSS pseudo-class state for error targeting
      expect(input.matches(':invalid:not(:focus)')).toBe(true);
    });

    it('should maintain proper CSS state transitions during focus/blur cycles', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        styles: [
          `
            .field-wrapper {
              border: 2px solid rgb(229, 231, 235);
              transition: all 0.2s ease;
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div ngxFormErrorDisplay showWarnings errorDisplayMode="on-blur">
              <div class="field-wrapper" data-testid="field-wrapper">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  [ngModel]="model.email"
                  type="email"
                />
              </div>
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const fieldWrapper = screen.getByTestId('field-wrapper');

      // Verify wrapper exists and has basic styling
      expect(fieldWrapper).toBeInTheDocument();

      // Test CSS pseudo-class pattern feasibility without specific colors
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      // Verify pseudo-class states for CSS targeting (this is what developers need)
      expect(input.matches(':focus:invalid')).toBe(true);

      await userEvent.tab(); // blur
      await fixture.whenStable();

      expect(input.matches(':invalid:not(:focus)')).toBe(true);

      // Fix value to test valid state
      await userEvent.click(input);
      await userEvent.clear(input);
      await userEvent.type(input, 'valid@example.com');
      await fixture.whenStable();

      expect(input.matches(':valid')).toBe(true);
    });
  });

  describe('CSS Variable Namespacing', () => {
    it('should use properly namespaced CSS variables to prevent collisions', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        styles: [
          `
            /* Test that our namespaced variables don't conflict with generic ones */
            :host {
              --error-color: #ff0000; /* Generic variable that should NOT be used */
              --warning-color: #00ff00; /* Generic variable that should NOT be used */

              /* Our properly namespaced variables */
              --ngx-vest-forms-error-color: #dc2626;
              --ngx-vest-forms-warning-color: #d97706;
            }

            .error-message {
              /* Should use namespaced variable, not generic --error-color */
              color: var(--ngx-vest-forms-error-color, #ff0000);
            }

            .warning-message {
              /* Should use namespaced variable, not generic --warning-color */
              color: var(--ngx-vest-forms-warning-color, #00ff00);
            }

            /* Test that generic variables would cause different styling */
            .generic-error {
              color: var(--error-color);
            }

            .generic-warning {
              color: var(--warning-color);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />

              @if (display.shouldShowWarnings()) {
                <div class="warning-message" data-testid="namespaced-warning">
                  Namespaced warning
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div class="error-message" data-testid="namespaced-error">
                  Namespaced error
                </div>
              }

              <!-- Test generic variables for comparison -->
              <div class="generic-error" data-testid="generic-error">
                Generic error color
              </div>
              <div class="generic-warning" data-testid="generic-warning">
                Generic warning color
              </div>
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Test warning namespacing
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('namespaced-warning'))
        .not.toBeNull();

      const namespacedWarning = screen.getByTestId('namespaced-warning');
      const genericWarning = screen.getByTestId('generic-warning');

      const namespacedWarningStyle =
        globalThis.getComputedStyle(namespacedWarning);
      const genericWarningStyle = globalThis.getComputedStyle(genericWarning);

      // Should use different colors due to proper namespacing
      expect(namespacedWarningStyle.color).toBe('rgb(217, 119, 6)'); // --ngx-vest-forms-warning-color
      expect(genericWarningStyle.color).toBe('rgb(0, 255, 0)'); // --warning-color
      expect(namespacedWarningStyle.color).not.toBe(genericWarningStyle.color);

      // Test error namespacing
      await userEvent.tab(); // blur to trigger errors
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('namespaced-error'))
        .not.toBeNull();

      const namespacedError = screen.getByTestId('namespaced-error');
      const genericError = screen.getByTestId('generic-error');

      const namespacedErrorStyle = globalThis.getComputedStyle(namespacedError);
      const genericErrorStyle = globalThis.getComputedStyle(genericError);

      // Should use different colors due to proper namespacing
      expect(namespacedErrorStyle.color).toBe('rgb(220, 38, 38)'); // --ngx-vest-forms-error-color
      expect(genericErrorStyle.color).toBe('rgb(255, 0, 0)'); // --error-color
      expect(namespacedErrorStyle.color).not.toBe(genericErrorStyle.color);
    });
  });

  describe('High-Level API Integration', () => {
    it('should support Lea Verou pattern with private properties and public API', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        styles: [
          `
            /* Lea Verou pattern: private properties with _ prefix, public API */
            :host {
              /* Private properties (implementation details) */
              --_error-hue: 0;
              --_error-sat: 84%;
              --_error-light: 60%;

              --_warning-hue: 38;
              --_warning-sat: 92%;
              --_warning-light: 50%;

              /* Public API using private properties */
              --ngx-vest-forms-error-color: hsl(
                var(--_error-hue) var(--_error-sat) var(--_error-light)
              );
              --ngx-vest-forms-error-bg: hsl(
                var(--_error-hue) var(--_error-sat) 97%
              );
              --ngx-vest-forms-error-border: hsl(
                var(--_error-hue) var(--_error-sat) 85%
              );

              --ngx-vest-forms-warning-color: hsl(
                var(--_warning-hue) var(--_warning-sat) var(--_warning-light)
              );
              --ngx-vest-forms-warning-bg: hsl(
                var(--_warning-hue) var(--_warning-sat) 97%
              );
              --ngx-vest-forms-warning-border: hsl(
                var(--_warning-hue) var(--_warning-sat) 85%
              );
            }

            .field-wrapper:has(input:focus:invalid) {
              background-color: var(--ngx-vest-forms-warning-bg);
              border-color: var(--ngx-vest-forms-warning-border);
            }

            .field-wrapper:has(input:invalid:not(:focus)) {
              background-color: var(--ngx-vest-forms-error-bg);
              border-color: var(--ngx-vest-forms-error-border);
            }

            .error-message {
              color: var(--ngx-vest-forms-error-color);
            }

            .warning-message {
              color: var(--ngx-vest-forms-warning-color);
            }
          `,
        ],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings
              errorDisplayMode="on-blur"
              #display="formErrorDisplay"
            >
              <div class="field-wrapper" data-testid="field-wrapper">
                <label for="email">Email</label>
                <input
                  id="email"
                  name="email"
                  [ngModel]="model.email"
                  type="email"
                />
              </div>

              @if (display.shouldShowWarnings()) {
                <div class="warning-message" data-testid="warning-message">
                  High-level API warning
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div class="error-message" data-testid="error-message">
                  High-level API error
                </div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '', password: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });
      const fieldWrapper = screen.getByTestId('field-wrapper');

      // Test warning styling with high-level API
      await userEvent.click(input);
      await userEvent.type(input, 'invalid');
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('warning-message'))
        .not.toBeNull();

      const warningMessage = screen.getByTestId('warning-message');
      const warningStyle = globalThis.getComputedStyle(warningMessage);

      // Should use HSL color from high-level API
      expect(warningStyle.color).toMatch(/hsl|rgb/); // Browser may convert to rgb

      // Test field wrapper background
      const fieldStyle = globalThis.getComputedStyle(fieldWrapper);
      expect(fieldStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Should have background

      // Test error styling
      await userEvent.tab(); // blur
      await fixture.whenStable();

      await expect
        .poll(() => screen.queryByTestId('error-message'))
        .not.toBeNull();

      const errorMessage = screen.getByTestId('error-message');
      const errorStyle = globalThis.getComputedStyle(errorMessage);

      // Should use different color from warnings
      expect(errorStyle.color).not.toBe(warningStyle.color);
      expect(errorStyle.color).toMatch(/hsl|rgb/);
    });
  });
});
