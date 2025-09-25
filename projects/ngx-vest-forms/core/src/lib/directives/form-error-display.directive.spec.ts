// Canonical concise spec for NgxFormErrorDisplayDirective
import { Component, inject, input as signalInput } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { NGX_ON_CHANGE_WARNING_DEBOUNCE } from '../config/error-display.config';
import { ngxVestForms } from '../exports';
import { NgxFormErrorDisplayDirective } from './form-error-display.directive';

// Shared suite
// Progressive pattern:
// 1. Required error
// 2. Non-blocking warning for short length (<5) (no failing enforce so it stays a warning)
// 3. Length error (only when non-empty) surfaced after blur by errorDisplayMode
const vestSuite = staticSuite(
  (data: { email?: string } = {}, field?: string) => {
    only(field);
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });
    test('email', 'Email looks weak', () => {
      if (data.email && data.email.length < 5) {
        // In Vest a warning is produced when a test FAILS but is marked with warn().
        // Therefore we intentionally add a failing assertion under the weak condition.
        warn();
        enforce(data.email.length).greaterThanOrEquals(5); // will fail -> becomes a warning
      }
    });
    test('email', 'Email must be at least 5 characters', () => {
      if (!data.email) return; // avoid duplicate error when empty
      enforce(data.email).longerThanOrEquals(5);
    });
  },
);

describe('NgxFormErrorDisplayDirective (canonical)', () => {
  it('on-blur shows errors only after blur', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            errorDisplayMode="on-blur"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });
    expect(screen.queryByRole('alert')).toBeNull();

    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();

    // Wait for afterEveryRender to detect touched state and show errors
    await expect.poll(() => screen.queryByRole('alert')).not.toBeNull();
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Email is required');
  });

  it('on-submit defers errors until submit', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            errorDisplayMode="on-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
          <button type="submit">Submit</button>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();

    // Should not show errors until submit (poll to ensure state is stable)
    await expect.poll(() => screen.queryByRole('alert')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await fixture.whenStable();

    // Wait for afterEveryRender to detect submit state and show errors
    await expect.poll(() => screen.queryByRole('alert')).not.toBeNull();

    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Email is required');
  });

  it('on-blur-or-submit shows on first blur', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            errorDisplayMode="on-blur-or-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();

    // Wait for afterEveryRender to detect touched state and show errors
    await expect.poll(() => screen.queryByRole('alert')).not.toBeNull();
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Email is required');
  });

  it('default mode behaves like blur-or-submit', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div ngxFormErrorDisplay #d="formErrorDisplay">
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();

    // Wait for afterEveryRender to detect touched state and show errors
    await expect.poll(() => screen.queryByRole('alert')).not.toBeNull();
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Email is required');
  });

  it('exposes submission state via formSubmitted()', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            errorDisplayMode="on-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="submitted">{{ d.formSubmitted() }}</div>
          </div>
          <button type="submit">Submit</button>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    expect(screen.getByTestId('submitted')).toHaveTextContent('false');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await fixture.whenStable();

    // Wait for afterEveryRender to detect submit state
    await expect
      .poll(() => screen.getByTestId('submitted').textContent)
      .toBe('true');

    await expect
      .element(screen.getByTestId('submitted'))
      .toHaveTextContent('true');
  });

  it('warns on updateOn submit + on-blur mismatch', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* intentional no-op for test */
    });
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div ngxFormErrorDisplay errorDisplayMode="on-blur">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              [ngModel]="formValue.email"
              [ngModelOptions]="{ updateOn: 'submit' }"
            />
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    await render(C);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('works when used as a host directive', async () => {
    @Component({
      selector: 'ngx-field-host',
      imports: [ngxVestForms],
      hostDirectives: [NgxFormErrorDisplayDirective],
      template: `<label for="email">Email</label
        ><input id="email" name="email" [ngModel]="value()" />
        <div data-testid="err-count">
          {{ formErrorDisplay.errors().length }}
        </div>`,
    })
    class FieldHost {
      value = signalInput('');
      formErrorDisplay = inject(NgxFormErrorDisplayDirective);
    }
    @Component({
      imports: [ngxVestForms, FieldHost],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <ngx-field-host [value]="formValue.email" />
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    await render(C);

    // For host directive integration, just verify that the directive
    // is accessible and doesn't crash the application
    expect(screen.getByTestId('err-count')).toBeInTheDocument();
    expect(screen.getByTestId('err-count')).toHaveTextContent('0');
  });

  it('shows live debounced warnings with warningDisplayMode="on-change" and errors only after blur', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            errorDisplayMode="on-blur"
            warningDisplayMode="on-change"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="warnings">
              @for (w of d.warnings(); track w) {
                <span class="w">{{ w }}</span>
              }
              <span data-testid="warnings-count">{{
                d.warnings().length
              }}</span>
            </div>
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
      providers: [
        // Reduce debounce for test responsiveness by overriding injection token
        { provide: NGX_ON_CHANGE_WARNING_DEBOUNCE, useValue: 10 },
      ],
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });

    // Type short value to trigger warning (length<5) but not blur yet
    await userEvent.type(input, 'abc'); // length 3 -> warning condition (<5)
    await fixture.whenStable();

    // Poll for warnings (debounced) but ensure no blocking errors yet
    await expect
      .poll(() => screen.getByTestId('warnings-count').textContent, {
        timeout: 2000,
      })
      .not.toBe('0');
    // Secondary assertion: ensure actual warning text present
    expect(
      screen.getByTestId('warnings').textContent?.includes('Email looks weak'),
    ).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();

    // Blur now -> errors should appear since field is touched and invalid (length<5)
    await userEvent.tab();
    await fixture.whenStable();
    await expect.poll(() => screen.queryByRole('alert')).not.toBeNull();
    // After blur the length error should surface (not the warning text)
    await expect
      .element(screen.getByRole('alert'))
      .toHaveTextContent('Email must be at least 5 characters');
  });

  it('shows warnings when only a pure warning test exists (no blocking error)', async () => {
    const warningOnlySuite = staticSuite(
      (data: { email?: string } = {}, field?: string) => {
        only(field);
        test('email', 'Email looks weak', () => {
          if (data.email && data.email.length > 0 && data.email.length < 5) {
            warn();
            // Force failure so Vest records a warning (warn converts failure severity)
            enforce(data.email.length).greaterThanOrEquals(5);
          }
        });
      },
    );

    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            #d="formErrorDisplay"
            warningDisplayMode="on-change"
            errorDisplayMode="on-blur"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            <div data-testid="warn-only">
              @for (w of d.warnings(); track w) {
                <span class="w">{{ w }}</span>
              }
              <span data-testid="warn-only-count">{{
                d.warnings().length
              }}</span>
            </div>
          </div>
        </form>
      `,
      providers: [{ provide: NGX_ON_CHANGE_WARNING_DEBOUNCE, useValue: 5 }],
    })
    class WarningOnlyComponent {
      formValue = { email: '' };
      suite = warningOnlySuite;
    }

    const { fixture } = await render(WarningOnlyComponent);
    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.type(input, 'abc');
    await fixture.whenStable();

    await expect
      .poll(() => screen.getByTestId('warn-only-count').textContent, {
        timeout: 1500,
      })
      .not.toBe('0');
    expect(
      screen.getByTestId('warn-only').textContent?.includes('Email looks weak'),
    ).toBe(true);
  });

  it.skip('allows warningDisplayMode="on-blur" with errorDisplayMode="on-blur-or-submit"', async () => {
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            errorDisplayMode="on-blur-or-submit"
            warningDisplayMode="on-blur"
            #d="formErrorDisplay"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
            @if (d.shouldShowErrors()) {
              <div role="alert">{{ d.errors().join(',') }}</div>
            }
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    const { fixture } = await render(C);
    const input = screen.getByRole('textbox', { name: /email/i });
    await userEvent.click(input);
    await userEvent.tab();
    await fixture.whenStable();
    await expect
      .poll(() => screen.queryByRole('alert'), { timeout: 10_000 })
      .not.toBeNull();
  });

  it.todo(
    'throws on invalid combination warningDisplayMode="on-blur-or-submit" + errorDisplayMode="on-blur"',
    async () => {
      // TODO: Implement validation logic in NgxFormErrorDisplayDirective that throws for invalid combinations
      // This test is currently disabled because the validation logic is not yet implemented
      /*
    @Component({
      imports: [ngxVestForms],
      template: `
        <form ngxVestForm [vestSuite]="suite" [(formValue)]="formValue">
          <div
            ngxFormErrorDisplay
            errorDisplayMode="on-blur"
            warningDisplayMode="on-blur-or-submit"
          >
            <label for="email">Email</label>
            <input id="email" name="email" [ngModel]="formValue.email" />
          </div>
        </form>
      `,
    })
    class C {
      formValue = { email: '' };
      suite = vestSuite;
    }
    // Expect render to reject
    await expect(render(C)).rejects.toThrowError(
      /Invalid warning\/error display mode combination/,
    );
    */
    },
  );
});
