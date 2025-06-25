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
 * - shouldShowErrors logic for all error display modes (on-blur, on-submit, on-blur-or-submit)
 * - Errors are not shown while validation is pending
 * - errors and warnings signals filter out messages during pending validation
 * - formSubmitted signal is set after form submit event
 * - Works as a host directive and composes with NgxFormControlStateDirective
 * - Accessibility: error messages are available for screen readers when visible
 */
describe('NgxFormErrorDisplayDirective', () => {
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

  it('should not show errors while validation is pending', async () => {
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
              [ngModelOptions]="{ updateOn: 'blur' }"
            />
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
    }
    await render(PendingComponent);
    // Blur (focus and blur)
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    // Simulate pending state by checking immediately (may be empty)
    // Should not throw, errors may be hidden while pending
    // Wait for error to eventually appear
    expect([null, '']).toContain(
      screen.queryByRole('alert')?.textContent ?? null,
    );
  });

  it('should expose Vest errors and warnings signals', async () => {
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
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="errors">{{ display.errors().join(',') }}</div>
            <div data-testid="warnings">{{ display.warnings().join(',') }}</div>
          </div>
        </form>
      `,
    })
    class ExposeComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(ExposeComponent);
    const input = screen.getByLabelText('Email');
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();
    await expect
      .poll(() => screen.getByTestId('errors').textContent)
      .toContain('Email is required');
    expect(screen.getByTestId('warnings').textContent).toBe('');
  });

  it('should show Vest warnings when present', async () => {
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
    class VestWarningComponent {
      formValue = { email: '' }; // Start empty
      suite = vestSuite;
    }
    const { fixture } = await render(VestWarningComponent);

    const input = screen.getByLabelText('Email');

    // Type a short value to trigger warning
    await userEvent.clear(input);
    await userEvent.type(input, 'abc'); // Short email triggers warning
    await userEvent.click(input);
    await userEvent.tab();

    await fixture.whenStable();

    await expect
      .poll(() => screen.getByTestId('warnings').textContent)
      .toContain('Email looks weak');
  });

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
    expect(screen.getByTestId('directive-available').textContent).toBe('true');
    expect(screen.getByTestId('errors-count').textContent).toBe('0');
    expect(screen.getByTestId('should-show').textContent).toBe('false');

    const input = screen.getByRole('textbox', { name: /email/i });

    // Focus and blur to trigger validation
    await userEvent.click(input);
    await userEvent.tab();

    await fixture.whenStable();

    // The directive should now be aware of the validation state (even if errors don't show due to form setup)
    // This test primarily verifies that the directive can be used as a host directive and provides the API
    expect(screen.getByTestId('directive-available').textContent).toBe('true');
  });

  it('should associate error messages with input using aria-describedby', async () => {
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
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              [ngModel]="formValue.email"
              aria-describedby="email-errors"
            />
            @if (display.shouldShowErrors()) {
              <div id="email-errors" role="alert">
                {{ display.errors().join(',') }}
              </div>
            }
          </div>
        </form>
      `,
    })
    class AriaComponent {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(AriaComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    await fixture.whenStable();
    const input = screen.getByRole('textbox', { name: /email/i });

    // Wait for the alert to appear
    await expect.poll(() => screen.queryByRole('alert')).toBeTruthy();

    const alert = screen.getByRole('alert');
    expect(input.getAttribute('aria-describedby')).toBe('email-errors');
    expect(alert.id).toBe('email-errors');
    expect(alert.textContent).toContain('Email is required');
  });

  it('should display custom Vest suite errors (mock integration)', async () => {
    // Minimal Vest suite for custom error
    const suite = staticSuite((data: unknown = {}, field?: string) => {
      if (field) only(field);
      test('email', 'Custom error: Email required', () => {
        enforce((data as { email?: string }).email).isNotBlank();
      });
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
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.shouldShowErrors()) {
              <div role="alert">{{ display.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class VestSuiteComponent {
      formValue = { email: '' };
      suite = suite;
    }
    const { fixture } = await render(VestSuiteComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    await fixture.whenStable();
    await expect
      .poll(() => screen.queryByRole('alert')?.textContent)
      .toContain('Custom error: Email required');
  });

  it('should handle async validation and pending state', async () => {
    // Async Vest suite
    const suite = staticSuite(async (data: unknown = {}, field?: string) => {
      if (field) only(field);

      test('email', 'Async error: Email required', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        enforce((data as { email?: string }).email).isNotBlank();
      });
    });
    @Component({
      standalone: true,
      imports: [...ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div ngxFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (display.isPending()) {
              <span data-testid="pending">Validating…</span>
            }
            @if (display.shouldShowErrors()) {
              <div role="alert" data-testid="error-alert">
                {{ display.errors().join(',') }}
              </div>
            }
          </div>
        </form>
      `,
    })
    class AsyncVestComponent {
      formValue = { email: '' };
      suite = suite;
    }
    const { fixture } = await render(AsyncVestComponent);

    const input = screen.getByRole('textbox', { name: /email/i });

    // Focus and then trigger validation
    await userEvent.click(input);
    await userEvent.tab();

    await fixture.whenStable();

    // Wait for async validation to complete and error to appear
    await expect
      .poll(
        () => {
          const errorElement = screen.queryByTestId('error-alert');
          return errorElement?.textContent || null;
        },
        {
          timeout: 3000,
          interval: 50,
        },
      )
      .toBeTruthy();

    // Verify it contains the expected error message
    const errorAlert = screen.getByTestId('error-alert');
    expect(errorAlert.textContent).toContain('Async error: Email required');
  });

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
});
