import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it } from 'vitest';
import { ngxVestForms } from '../exports';
import { NgxFormErrorDisplayDirective } from './form-error-display.directive';

/**
 * Test suite for NgxFormErrorDisplayDirective showWarnings input
 *
 * This test suite validates:
 * - Boolean attribute transform behavior
 * - String value handling
 * - Warning display logic with various input modes
 * - CSS pseudo-class alignment
 */

// Shared validation suite with warnings
const validationSuite = staticSuite(
  (data: { email?: string } = {}, field?: string) => {
    only(field);

    // Blocking error test
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    // Non-blocking warning tests
    test('email', 'Email format looks unusual', () => {
      warn();
      enforce(data.email).matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('email', 'Email domain seems uncommon', () => {
      warn();
      enforce(data.email).matches(/^[^@]+@(gmail|yahoo|hotmail|outlook)\.com$/);
    });
  },
);

describe('NgxFormErrorDisplayDirective - showWarnings Input Transform', () => {
  describe('Boolean Attribute Behavior', () => {
    it('should enable warnings with boolean attribute (no value)', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div ngxFormErrorDisplay showWarnings #display="formErrorDisplay">
              <label for="email">Email</label>
              <input
                id="email"
                name="email"
                [ngModel]="model.email"
                type="email"
              />

              @if (display.shouldShowWarnings()) {
                <div data-testid="warnings" role="status">
                  @for (warning of display.warnings(); track warning) {
                    <div>{{ warning }}</div>
                  }
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div data-testid="errors" role="alert">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Type a weak email to trigger warnings
      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should show warnings (on-change mode is default when showWarnings enabled as boolean)
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
      await expect.element(screen.getByTestId('warnings')).toBeInTheDocument();

      // Should not show errors while focused (CSS pseudo-class alignment)
      expect(screen.queryByTestId('errors')).toBeNull();
    });

    it('should enable warnings with showWarnings="true"', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings="true"
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
                <div data-testid="warnings" role="status">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });

    it('should disable warnings with showWarnings="false"', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings="false"
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
                <div data-testid="warnings" role="status">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should not show warnings when explicitly disabled
      expect(screen.queryByTestId('warnings')).toBeNull();
    });
  });

  describe('String Mode Values', () => {
    it('should accept showWarnings="on-change" mode', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings="on-change"
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
                <div data-testid="warnings" role="status">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should show warnings immediately in on-change mode
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });

    it('should accept showWarnings="on-blur" mode', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              showWarnings="on-blur"
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
                <div data-testid="warnings" role="status">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Type without blurring - should not show warnings
      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      expect(screen.queryByTestId('warnings')).toBeNull();

      // Blur the field - should now show warnings
      await userEvent.tab();
      await fixture.whenStable();

      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });
  });

  describe('Input Transform Edge Cases', () => {
    it('should handle undefined/null values correctly', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <div
              ngxFormErrorDisplay
              [showWarnings]="warningMode"
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
                <div data-testid="warnings" role="status">Warnings enabled</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = validationSuite;
        warningMode: string | boolean | null | undefined = undefined; // Test undefined value
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should show warnings when undefined (falls back to warningDisplayMode='on-change')
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();

      // Test null value
      fixture.componentRef.setInput('warningMode', null);
      await fixture.whenStable();

      // Should still show warnings when null (also falls back to warningDisplayMode)
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });

    it('should handle empty string as truthy value', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <!-- Empty string should be treated as boolean true -->
            <div
              ngxFormErrorDisplay
              showWarnings=""
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
                <div data-testid="warnings" role="status">Warnings enabled</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Empty string should enable warnings (on-change mode)
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });

    it('should handle custom string values as fallback on-change mode', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <!-- Custom string should fallback to on-change -->
            <div
              ngxFormErrorDisplay
              showWarnings="custom-value"
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
                <div data-testid="warnings" role="status">Warnings enabled</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Custom string should enable warnings in on-change mode
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });
  });

  describe('CSS Pseudo-Class Alignment', () => {
    it('should show warnings while focused (:focus:invalid alignment)', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
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
                <div data-testid="warnings" role="status">
                  @for (warning of display.warnings(); track warning) {
                    <div>{{ warning }}</div>
                  }
                </div>
              }

              @if (display.shouldShowErrors()) {
                <div data-testid="errors" role="alert">
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
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Focus and type - should show warnings (progressive feedback)
      await userEvent.click(input);
      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should show warnings while focused
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();

      // Should NOT show errors while focused (CSS :focus:invalid vs :invalid:not(:focus))
      expect(screen.queryByTestId('errors')).toBeNull();

      // Blur to trigger errors
      await userEvent.tab();
      await fixture.whenStable();

      // Now should show errors (hard red feedback)
      await expect.poll(() => screen.queryByTestId('errors')).not.toBeNull();
    });
  });

  describe('Priority and Override Behavior', () => {
    it('should override warningDisplayMode when showWarnings is provided', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <!-- showWarnings should override warningDisplayMode -->
            <div
              ngxFormErrorDisplay
              showWarnings="on-blur"
              warningDisplayMode="on-change"
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
                <div data-testid="warnings" role="status">Warnings shown</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Type without blurring
      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      // Should NOT show warnings (showWarnings="on-blur" overrides warningDisplayMode="on-change")
      expect(screen.queryByTestId('warnings')).toBeNull();

      // Blur to trigger warnings
      await userEvent.tab();
      await fixture.whenStable();

      // Now should show warnings
      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });

    it('should fall back to warningDisplayMode when showWarnings is undefined', async () => {
      @Component({
        imports: [ngxVestForms, NgxFormErrorDisplayDirective],
        template: `
          <form ngxVestForm [vestSuite]="suite" [(formValue)]="model">
            <!-- Should use warningDisplayMode when showWarnings not provided -->
            <div
              ngxFormErrorDisplay
              warningDisplayMode="on-change"
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
                <div data-testid="warnings" role="status">Warnings shown</div>
              }
            </div>
          </form>
        `,
      })
      class TestComponent {
        model = { email: '' };
        suite = validationSuite;
      }

      const { fixture } = await render(TestComponent);
      const input = screen.getByRole('textbox', { name: /email/i });

      // Type - should show warnings immediately (warningDisplayMode="on-change")
      await userEvent.type(input, 'weak');
      await fixture.whenStable();

      await expect.poll(() => screen.queryByTestId('warnings')).not.toBeNull();
    });
  });
});
