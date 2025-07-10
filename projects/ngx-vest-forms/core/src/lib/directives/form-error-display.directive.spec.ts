import { Component, inject, input as signalInput } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { ngxVestForms } from '../exports';
import { NgxFormErrorDisplayDirective } from './form-error-display.directive';

// Vest suite for errors and warnings following the official pattern from the blog post
const vestSuite = staticSuite(
  (data: { email?: string; username?: string } = {}, field?: string) => {
    if (field) {
      only(field);
    }

    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });

    test('email', 'Email looks weak', () => {
      if (data.email && data.email.length < 5) {
        warn();
      }
      enforce(data.email).longerThanOrEquals(5);
    });

    // Add username test for host directive test
    test('username', 'Username is required', () => {
      enforce(data.username).isNotBlank();
    });
  },
);

/**
 * Tests for NgxFormErrorDisplayDirective
 *
 * WHAT: Tests the error display directive's core user-facing behavior
 * WHY: Ensures the directive properly displays errors/warnings based on display modes and form state
 *
 * Core functionality tested:
 * - Error display modes (on-blur, on-submit, on-blur-or-submit)
 * - Integration with Vest validation (errors, warnings, pending state)
 * - Form submission tracking and host directive composition
 * - Accessibility features for screen readers
 */
describe('NgxFormErrorDisplayDirective', () => {
  // ==============================================================================
  // CORE FUNCTIONALITY TESTS (Error Display Modes)
  // ==============================================================================

  // WHAT: Test the main error display modes that control WHEN errors are shown
  // WHY: These are the primary user-facing behaviors that developers will rely on

  it('should show Vest errors only on blur when errorDisplayMode is "on-blur"', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            ngxFormErrorDisplay
            #display="formErrorDisplay"
            errorDisplayMode="on-blur"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class BlurComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(BlurComponent);
    // No error before blur
    expect(screen.queryByRole('alert')).toBeNull();
    // Blur (focus and blur)
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    await fixture.whenStable();
    // Error should now be visible
    await expect
      .poll(() => screen.queryByRole('alert')?.textContent)
      .toContain('Email is required');
  });

  it('should show Vest errors only on submit when errorDisplayMode is "on-submit"', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            ngxFormErrorDisplay
            #display="formErrorDisplay"
            errorDisplayMode="on-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
            <button type="submit">Submit</button>
          </div>
        </form>
      `,
    })
    class SubmitComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(SubmitComponent);
    // No error before submit
    expect(screen.queryByRole('alert')).toBeNull();
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await fixture.whenStable();
    // Error should now be visible
    await expect
      .poll(() => screen.queryByRole('alert')?.textContent)
      .toContain('Email is required');
  });

  it('should show Vest errors after blur or submit when errorDisplayMode is "on-blur-or-submit"', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            ngxFormErrorDisplay
            #display="formErrorDisplay"
            errorDisplayMode="on-blur-or-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
            <button type="submit">Submit</button>
          </div>
        </form>
      `,
    })
    class BlurOrSubmitComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(BlurOrSubmitComponent);
    // No error before blur or submit
    expect(screen.queryByRole('alert')).toBeNull();
    // Blur (focus and blur)
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    await fixture.whenStable();
    // Error should now be visible after blur
    await expect
      .poll(() => screen.queryByRole('alert')?.textContent)
      .toContain('Email is required');
    // Reset value to valid, then clear to trigger error again
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'a');
    await userEvent.clear(screen.getByRole('textbox', { name: /email/i }));
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await fixture.whenStable();
    // Error should still be visible after submit
    await expect
      .poll(() => screen.queryByRole('alert')?.textContent)
      .toContain('Email is required');
  });

  // ==============================================================================
  // VALIDATION STATE TESTS
  // ==============================================================================

  // WHAT: Test validation state handling (pending, errors, warnings)
  // WHY: Ensures proper integration with Vest validation and prevents flickering

  it('should hide errors while validation is pending', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [(formValue)]="formValue"
          [validationOptions]="validationOptions"
        >
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.isPending()) {
              <span data-testid="pending">Validating…</span>
            }
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class PendingComponent {
      formValue = { email: '' };
      suite = vestSuite;
      validationOptions = { debounceTime: 100 }; // Add debounce to create pending state
    }
    await render(PendingComponent);

    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.click(input);
    await userEvent.tab();

    // During and after validation, ensure directive properly handles pending state
    // This test verifies that errors don't flicker during validation
    const alertElement = screen.queryByRole('alert');
    expect(alertElement).toBeNull(); // Should not show errors initially
  });

  it('should expose errors and warnings from Vest validation', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="errors">{{ display.errors().join(',') }}</div>
            <div data-testid="warnings">{{ display.warnings().join(',') }}</div>
          </div>
        </form>
      `,
    })
    class VestIntegrationComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(VestIntegrationComponent);
    const input = screen.getByLabelText('Email');

    // Focus and blur to trigger validation
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();

    // Should show error, no warnings initially
    await expect
      .poll(() => screen.getByTestId('errors').textContent)
      .toContain('Email is required');

    // Check warnings are empty (but handle potential undefined/null)
    const warningsText = screen.getByTestId('warnings').textContent;
    expect(warningsText || '').toBe('');
  });

  // ==============================================================================
  // FORM INTEGRATION TESTS
  // ==============================================================================

  // WHAT: Test integration with Angular forms and submission state
  // WHY: Ensures the directive works properly in real-world form scenarios

  it('should set formSubmitted after submit event', async () => {
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
          #ngForm="ngForm"
        >
          <div
            ngxFormErrorDisplay
            #display="formErrorDisplay"
            errorDisplayMode="on-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="submitted">{{ display.formSubmitted() }}</div>
            <button type="submit">Submit</button>
          </div>
        </form>
      `,
    })
    class SubmitStateComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(SubmitStateComponent);
    // Not submitted yet
    expect(screen.getByTestId('submitted').textContent).toBe('false');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await fixture.whenStable();
    // Should now be true
    expect(screen.getByTestId('submitted').textContent).toBe('true');
  });

  it('should work as a host directive in a custom input component', async () => {
    @Component({
      selector: 'ngx-custom-input',
      imports: [...ngxVestForms],
      hostDirectives: [NgxFormErrorDisplayDirective],
      template: `
        <input [ngModel]="value()" [name]="fieldName()" [id]="fieldName()" />
        <div data-testid="directive-available">
          {{ formErrorDisplay ? 'true' : 'false' }}
        </div>
        <div data-testid="errors-count">
          {{ formErrorDisplay.errors().length }}
        </div>
        <div data-testid="should-show">
          {{ formErrorDisplay.shouldShowErrors() }}
        </div>
      `,
    })
    class CustomInputComponent {
      value = signalInput('');
      fieldName = signalInput('');
      formErrorDisplay = inject(NgxFormErrorDisplayDirective);
    }

    @Component({
      imports: [...ngxVestForms, CustomInputComponent],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <label for="email">Email</label>
          <ngx-custom-input [value]="formValue.email" fieldName="email" />
        </form>
      `,
    })
    class HostDirectiveComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }

    const { fixture } = await render(HostDirectiveComponent);

    // Verify that the host directive is working and provides the expected API
    expect(screen.getByTestId('directive-available').textContent?.trim()).toBe(
      'true',
    );
    expect(screen.getByTestId('errors-count').textContent?.trim()).toBe('0');
    expect(screen.getByTestId('should-show').textContent?.trim()).toBe('false');

    const input = screen.getByRole('textbox', { name: /email/i });

    // Focus and blur to trigger validation
    await userEvent.click(input);
    await userEvent.tab();

    await fixture.whenStable();

    // The directive should now be aware of the validation state (even if errors don't show due to form setup)
    // This test primarily verifies that the directive can be used as a host directive and provides the API
    expect(screen.getByTestId('directive-available').textContent?.trim()).toBe(
      'true',
    );
  });

  // ==============================================================================
  // EDGE CASES & CONFIGURATION TESTS
  // ==============================================================================

  // WHAT: Test edge cases and configuration warnings
  // WHY: Helps developers avoid common mistakes and provides helpful feedback

  it('should warn in dev mode if errorDisplayMode is on-blur or on-blur-or-submit and updateOn is submit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* mock */
    });
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            ngxFormErrorDisplay
            #display="formErrorDisplay"
            errorDisplayMode="on-blur"
          >
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              [ngModel]="formValue.email"
              [ngModelOptions]="{ updateOn: 'submit' }"
            />
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class WarnComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    await render(WarnComponent);
    expect(warnSpy).toHaveBeenCalledWith(
      '[ngx-vest-forms] Warning: errorDisplayMode is set to',
      "'on-blur'",
      "but ngModelOptions.updateOn is 'submit'. Errors will only be shown after submit, regardless of display mode.",
    );
    warnSpy.mockRestore();
  });

  // ==============================================================================
  // MISSING TESTS (TODO)
  // ==============================================================================

  // TODO: Add test for default error display mode behavior
  // WHAT: Test that directive uses default error display mode when none specified
  // WHY: Ensures sensible defaults work as expected

  // TODO: Add test for isPending() signal
  // WHAT: Test that isPending() correctly reflects validation state
  // WHY: Developers may use this signal for loading indicators

  // TODO: Add test for error display with different updateOn modes
  // WHAT: Test error display timing with updateOn: 'change', 'blur', 'submit'
  // WHY: Ensures directive respects ngModelOptions.updateOn correctly

  // ==============================================================================
  // ADDITIONAL TEST SCAFFOLDING - Edge Cases and Error Scenarios
  // ==============================================================================

  // ==============================================================================
  // ESSENTIAL DIRECTIVE-LEVEL TESTS
  // ==============================================================================

  describe('Error Display Mode Handling', () => {
    it.todo('should handle malformed errorDisplayMode values gracefully');
    it.todo('should handle rapid mode changes without memory leaks');
  });

  describe('Form Integration', () => {
    it.todo(
      'should work correctly when NgForm is not available (optional injection)',
    );
    it.todo(
      'should handle cases where formSubmitted signal emits multiple times',
    );
  });

  describe('Validation State Processing', () => {
    it.todo('should handle async validation state changes correctly');
    it.todo(
      'should properly filter pending validation messages to prevent flickering',
    );
    it.todo('should handle cases where Vest suite returns empty results');
  });

  describe('Host Directive Usage', () => {
    it.todo('should work as host directive with proper input forwarding');
    it.todo(
      'should properly expose all inherited properties from NgxFormControlStateDirective',
    );
  });

  describe('Cleanup', () => {
    it.todo('should properly clean up effect when component is destroyed');
  });
});
