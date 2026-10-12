import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { create, enforce, test as vestTest } from 'vest';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';

import { ControlWrapperComponent, NgxVestForms } from 'ngx-vest-forms';

/**
 * Browser-mode coverage for the aria wiring between a control and the
 * ControlWrapperComponent feedback regions. Real a11y tree semantics
 * (roles, label association, aria-describedby id resolution) only hold
 * in a real browser.
 */
function createUsernameSuite() {
  return create((model: { username: string }) => {
    vestTest('username', 'Username is required', () => {
      enforce(model.username).isNotBlank();
    });
  });
}

@Component({
  selector: 'ngx-test-control-wrapper-a11y-browser',
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
class ControlWrapperA11yHostComponent {
  readonly formValue = signal({ username: '' });
  readonly suite = signal(createUsernameSuite());
}

describe('ControlWrapperComponent - aria wiring (browser mode)', () => {
  it('associates the error region with the control through aria-describedby after blur', async () => {
    await render(ControlWrapperA11yHostComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    await userEvent.click(input);
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    const inputElement = await input.element();
    const describedBy = inputElement.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // The describedby ids resolve to the wrapper's feedback regions,
    // each a role="status" live region.
    const regionIds = (describedBy ?? '')
      .split(' ')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    expect(regionIds.length).toBeGreaterThan(0);

    for (const id of regionIds) {
      const region = document.getElementById(id);
      expect(region).toBeTruthy();
      expect(region?.getAttribute('role')).toBe('status');
      expect(region?.getAttribute('aria-live')).toBe('polite');
    }

    // The error text is rendered inside one of those regions.
    expect(page.getByText('Username is required').query()).toBeTruthy();
  });

  it('marks the control aria-invalid only while it has errors', async () => {
    await render(ControlWrapperA11yHostComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    expect((await input.element()).getAttribute('aria-invalid')).not.toBe(
      'true'
    );

    await userEvent.click(input);
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    expect((await input.element()).getAttribute('aria-invalid')).toBe('true');

    await userEvent.click(input);
    await userEvent.fill(input, 'arjen');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();
    expect((await input.element()).getAttribute('aria-invalid')).not.toBe(
      'true'
    );
  });
});
