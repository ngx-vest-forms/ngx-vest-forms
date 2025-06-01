import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, it, vi } from 'vitest';
import { FormErrorDisplayDirective } from './form-error-display.directive';

// Vest suite for errors and warnings
const vestSuite = staticSuite(
  (data: { email?: string } = {}, field?: string) => {
    if (field) only(field);
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });
    test('email', 'Email looks weak', () => {
      if (data.email && data.email.length < 5) {
        warn();
      }
      enforce(data.email).longerThanOrEquals(5);
    });
  },
);

/**
 * Tests for FormErrorDisplayDirective
 * - shouldShowErrors logic for all error display modes (on-blur, on-submit, on-blur-or-submit)
 * - Errors are not shown while validation is pending
 * - errors and warnings signals filter out messages during pending validation
 * - formSubmitted signal is set after form submit event
 * - Works as a host directive and composes with FormControlStateDirective
 * - Accessibility: error messages are available for screen readers when visible
 */
describe('FormErrorDisplayDirective', () => {
  it('should show Vest errors only on blur when errorDisplayMode is "on-blur"', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            scFormErrorDisplay
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
    await render(BlurComponent);
    // No error before blur
    expect(screen.queryByRole('alert')).toBeNull();
    // Blur (focus and blur)
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    // Error should now be visible
    expect(screen.getByRole('alert').textContent).toContain(
      'Email is required',
    );
  });

  it('should show Vest errors only on submit when errorDisplayMode is "on-submit"', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            scFormErrorDisplay
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
    await render(SubmitComponent);
    // No error before submit
    expect(screen.queryByRole('alert')).toBeNull();
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // Error should now be visible
    expect(screen.getByRole('alert').textContent).toContain(
      'Email is required',
    );
  });

  it('should show Vest errors after blur or submit when errorDisplayMode is "on-blur-or-submit"', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            scFormErrorDisplay
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
    await render(BlurOrSubmitComponent);
    // No error before blur or submit
    expect(screen.queryByRole('alert')).toBeNull();
    // Blur (focus and blur)
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    // Error should now be visible after blur
    expect(screen.getByRole('alert').textContent).toContain(
      'Email is required',
    );
    // Reset value to valid, then clear to trigger error again
    await userEvent.type(screen.getByRole('textbox', { name: /email/i }), 'a');
    await userEvent.clear(screen.getByRole('textbox', { name: /email/i }));
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // Error should still be visible after submit
    expect(screen.getByRole('alert').textContent).toContain(
      'Email is required',
    );
  });

  it('should not show errors while validation is pending', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            scFormErrorDisplay
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
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div scFormErrorDisplay #display="formErrorDisplay">
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
    await render(ExposeComponent);
    await userEvent.tab();
    expect(screen.getByTestId('errors').textContent).toContain(
      'Email is required',
    );
    expect(screen.getByTestId('warnings').textContent).toBe('');
  });

  it('should show Vest warnings when present', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div scFormErrorDisplay #display="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="errors">{{ display.errors().join(',') }}</div>
            <div data-testid="warnings">{{ display.warnings().join(',') }}</div>
          </div>
        </form>
      `,
    })
    class VestWarningComponent {
      formValue = { email: 'abc' }; // triggers warning (length < 5)
      suite = vestSuite;
    }
    await render(VestWarningComponent);
    await userEvent.tab();
    expect(screen.getByTestId('warnings').textContent).toContain(
      'Email looks weak',
    );
  });

  it('should set formSubmitted after submit event', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
          #ngForm="ngForm"
        >
          <div
            scFormErrorDisplay
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
    await render(SubmitStateComponent);
    // Not submitted yet
    expect(screen.getByTestId('submitted').textContent).toBe('false');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    // Should now be true
    expect(screen.getByTestId('submitted').textContent).toBe('true');
  });

  it('should work as a host directive in a custom component', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule],
      hostDirectives: [FormErrorDisplayDirective],
      template: `
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue.username" />
        @if (formErrorDisplay.shouldShowErrors()) {
          <div role="alert">{{ formErrorDisplay.errors().join(',') }}</div>
        }
      `,
    })
    class HostDirectiveComponent {
      formValue = { username: '' };
      suite = vestSuite;
    }
    await render(HostDirectiveComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /username/i }));
    await userEvent.tab();
    expect(screen.getByRole('alert').textContent).toContain(
      'Email is required',
    );
  });

  it('should associate error messages with input using aria-describedby', async () => {
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div scFormErrorDisplay #display="formErrorDisplay">
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
    await render(AriaComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    const input = screen.getByRole('textbox', { name: /email/i });
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
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div scFormErrorDisplay #display="formErrorDisplay">
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
    await render(VestSuiteComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    expect(screen.getByRole('alert').textContent).toContain(
      'Custom error: Email required',
    );
  });

  it('should handle async validation and pending state', async () => {
    // Async Vest suite
    const suite = staticSuite(async (data: unknown = {}, field?: string) => {
      if (field) only(field);
      await new Promise((resolve) => setTimeout(resolve, 100));
      test('email', 'Async error: Email required', () => {
        enforce((data as { email?: string }).email).isNotBlank();
      });
    });
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div scFormErrorDisplay #display="formErrorDisplay">
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
    class AsyncVestComponent {
      formValue = { email: '' };
      suite = suite;
    }
    await render(AsyncVestComponent);
    await userEvent.click(screen.getByRole('textbox', { name: /email/i }));
    await userEvent.tab();
    // Should show pending state first
    expect(screen.getByTestId('pending')).toBeDefined();
    // Wait for async validation to finish
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(screen.getByRole('alert').textContent).toContain(
      'Async error: Email required',
    );
  });

  it('should warn in dev mode if errorDisplayMode is on-blur or on-blur-or-submit and updateOn is submit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* mock */
    });
    @Component({
      standalone: true,
      imports: [FormsModule, FormErrorDisplayDirective],
      template: `
        <form
          ngxVestForm
          [vestSuite]="suite"
          [formValue]="formValue"
          (formValueChange)="formValue = $event"
        >
          <div
            scFormErrorDisplay
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
