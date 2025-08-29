// Canonical concise spec for NgxFormErrorDisplayDirective
import { Component, inject, input as signalInput } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test, warn } from 'vest';
import { describe, expect, it, vi } from 'vitest';
import { ngxVestForms } from '../exports';
import { NgxFormErrorDisplayDirective } from './form-error-display.directive';

// Shared suite
const vestSuite = staticSuite(
  (data: { email?: string } = {}, field?: string) => {
    only(field);
    test('email', 'Email is required', () => enforce(data.email).isNotBlank());
    test('email', 'Email looks weak', () => {
      if (data.email && data.email.length < 5) warn();
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
});
