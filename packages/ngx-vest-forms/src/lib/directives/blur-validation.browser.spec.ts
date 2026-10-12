import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { ControlWrapperComponent, NgxVestForms } from 'ngx-vest-forms';

/**
 * Browser-mode coverage for validation-on-blur. jsdom cannot be
 * trusted here: focus/blur sequencing, `:focus` state, and the
 * touch-then-validate path behave differently in a real browser.
 */
function createUsernameSuite() {
  return create((model: { username: string }) => {
    vestTest('username', 'Username is required', () => {
      enforce(model.username).isNotBlank();
    });
  });
}

@Component({
  selector: 'ngx-test-blur-validation-browser',
  imports: [NgxVestForms, ControlWrapperComponent],
  template: `
    <form
      ngxVestForm
      [suite]="suite()"
      [formValue]="formValue()"
      (formValueChange)="formValue.set($event)"
    >
      <ngx-control-wrapper>
        <label for="username">Username</label>
        <input id="username" name="username" [ngModel]="formValue().username" />
      </ngx-control-wrapper>
    </form>
  `,
})
class BlurValidationHostComponent {
  readonly formValue = signal({ username: '' });
  readonly suite = signal(createUsernameSuite());
}

describe('FormDirective - blur validation timing (browser mode)', () => {
  it('shows the field error only after the control is blurred', async () => {
    await render(BlurValidationHostComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    expect(input.query()).toBeTruthy();
    expect(await input.element()).toBeVisible();

    // Untouched: no error rendered, the field is not aria-invalid yet.
    expect((await input.element()).getAttribute('aria-invalid')).not.toBe(
      'true'
    );
    expect(page.getByText('Username is required').query()).toBeNull();

    // Focus the field, leave it empty, tab away: validation on touch.
    await userEvent.click(input);
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Username is required').query()).toBeTruthy();
    expect((await input.element()).getAttribute('aria-invalid')).toBe('true');
  });

  it('clears the error once a valid value is entered and blurred', async () => {
    await render(BlurValidationHostComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    await userEvent.click(input);
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(page.getByText('Username is required').query()).toBeTruthy();

    await userEvent.click(input);
    await userEvent.fill(input, 'the-ult');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Username is required').query()).toBeNull();
  });

  it('does not show the error while the user is still typing a valid value', async () => {
    await render(BlurValidationHostComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    await userEvent.click(input);
    await userEvent.type(input, 'bre');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(page.getByText('Username is required').query()).toBeNull();
    expect((await input.element()).getAttribute('aria-invalid')).not.toBe(
      'true'
    );
  });
});
