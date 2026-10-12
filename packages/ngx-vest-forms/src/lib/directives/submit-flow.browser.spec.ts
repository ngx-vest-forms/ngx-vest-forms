import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

describe('FormDirective - submit flow (browser mode)', () => {
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
