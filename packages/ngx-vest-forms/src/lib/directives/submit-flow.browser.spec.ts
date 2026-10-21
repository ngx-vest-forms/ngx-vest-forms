import { ApplicationRef, Component, forwardRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { ControlWrapperComponent, NgxVestForms } from 'ngx-vest-forms';

/**
 * Browser-mode coverage for the submit flow. jsdom cannot verify
 * `focusFirstInvalidOnSubmit` reliably: real focus movement after a
 * submit click is a browser behavior.
 */
function createSignupSuite() {
  return create((model: { username: string; email: string }) => {
    vestTest('username', 'Username is required', () => {
      enforce(model.username).isNotBlank();
    });
    vestTest('email', 'Email is required', () => {
      enforce(model.email).isNotBlank();
    });
  });
}

@Component({
  selector: 'ngx-test-submit-flow-browser',
  imports: [NgxVestForms, ControlWrapperComponent],
  template: `
    <form
      ngxVestForm
      [suite]="suite()"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
      (ngSubmit)="submitted.set(true)"
    >
      <ngx-control-wrapper>
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue().username" />
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label for="email">Email</label>
        <input id="email" name="email" [ngModel]="formValue().email" />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
      <span id="submitted">{{ submitted() }}</span>
    </form>
  `,
})
class SubmitFlowHostComponent {
  readonly formValue = signal({ username: '', email: '' });
  readonly suite = signal(createSignupSuite());
  readonly submitted = signal(false);
}

/**
 * A custom control whose only focusable part is a button. The host is not an
 * input, so the first-invalid lookup can only find it through the wrapper's
 * `--invalid` class, which renders after the submit.
 */
@Component({
  selector: 'ngx-test-toggle-control',
  template: `
    <button type="button" aria-label="Toggle" (click)="toggle()">
      {{ value() ? 'On' : 'Off' }}
    </button>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleControlComponent),
      multi: true,
    },
  ],
})
class ToggleControlComponent implements ControlValueAccessor {
  readonly value = signal(false);
  #onChange: (value: boolean) => void = () => undefined;

  toggle(): void {
    this.value.update((v) => !v);
    this.#onChange(this.value());
  }

  writeValue(value: boolean | null): void {
    this.value.set(!!value);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(): void {
    // Not needed for this test.
  }
}

@Component({
  selector: 'ngx-test-submit-flow-custom-control',
  imports: [NgxVestForms, ControlWrapperComponent, ToggleControlComponent],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <ngx-test-toggle-control
          name="accepted"
          [ngModel]="formValue().accepted"
        />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
class CustomControlSubmitHostComponent {
  readonly formValue = signal<{ accepted?: boolean }>({});
  readonly suite = create((model: { accepted?: boolean }) => {
    vestTest('accepted', 'Accept the terms', () => {
      enforce(model.accepted).isTruthy();
    });
  });
}

describe('FormDirective - submit flow (browser mode)', () => {
  it('focuses a custom control on the first invalid submit', async () => {
    await render(CustomControlSubmitHostComponent);

    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Accept the terms').query()).toBeTruthy();
    // Keyboard and screen-reader users land on the failing control, not on
    // the submit button they just pressed.
    const toggle = page.getByRole('button', { name: 'Toggle' });
    expect(document.activeElement).toBe(await toggle.element());
  });

  it('shows all field errors and moves focus to the first invalid control on submit', async () => {
    await render(SubmitFlowHostComponent);

    expect(page.getByRole('button', { name: 'Submit' }).query()).toBeTruthy();

    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Username is required').query()).toBeTruthy();
    expect(page.getByText('Email is required').query()).toBeTruthy();

    // focusFirstInvalidOnSubmit (default): the first invalid field
    // receives real focus after the submit click.
    const username = page.getByRole('textbox', { name: 'Username' });
    expect(document.activeElement).toBe(await username.element());
  });

  it('focuses the first still-invalid field after fixing an earlier one', async () => {
    await render(SubmitFlowHostComponent);

    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await TestBed.inject(ApplicationRef).whenStable();

    const username = page.getByRole('textbox', { name: 'Username' });
    const email = page.getByRole('textbox', { name: 'Email' });

    await userEvent.fill(username, 'the-ult');
    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Username is required').query()).toBeNull();
    expect(page.getByText('Email is required').query()).toBeTruthy();
    expect(document.activeElement).toBe(await email.element());
  });
});

@Component({
  selector: 'ngx-test-submit-flow-settled-config',
  imports: [NgxVestForms, ControlWrapperComponent],
  template: `
    <form
      ngxVestForm
      [suite]="suite"
      [formValue]="formValue()"
      [validationConfig]="validationConfig"
      (formValueChange)="formValue.set($event)"
      (submitSettled)="settled.set($event.valid)"
    >
      <ngx-control-wrapper>
        <label for="password">Password</label>
        <input id="password" name="password" [ngModel]="formValue().password" />
      </ngx-control-wrapper>
      <ngx-control-wrapper>
        <label for="confirm">Confirm</label>
        <input
          id="confirm"
          name="confirmPassword"
          [ngModel]="formValue().confirmPassword"
        />
      </ngx-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
class SettledConfigSubmitHostComponent {
  readonly formValue = signal<{ password?: string; confirmPassword?: string }>(
    {}
  );
  readonly settled = signal<boolean | null>(null);
  readonly validationConfig = {
    password: ['confirmPassword'],
    confirmPassword: ['password'],
  };
  readonly suite = create(
    (model: { password?: string; confirmPassword?: string }) => {
      vestTest('password', 'Password is required', () => {
        enforce(model.password).isNotBlank();
      });
      vestTest('confirmPassword', 'Confirm your password', () => {
        enforce(model.confirmPassword).isNotBlank();
      });
    }
  );
}

describe('FormDirective - submit flow with submitSettled and validationConfig (browser mode)', () => {
  it('focuses the first invalid field even though submitSettled revalidates the config dependents', async () => {
    await render(SettledConfigSubmitHostComponent);

    await userEvent.click(page.getByRole('button', { name: 'Submit' }));
    await expect
      .poll(() => document.activeElement?.id, { timeout: 2000 })
      .toBe('password');
  });
});
