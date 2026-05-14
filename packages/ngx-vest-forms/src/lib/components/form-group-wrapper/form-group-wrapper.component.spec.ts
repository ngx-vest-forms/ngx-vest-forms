import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NgxVestForms } from '../../exports';

@Component({
  imports: [FormsModule, NgxVestForms],
  template: `
    <form #form="ngForm">
      <ngx-form-group-wrapper ngModelGroup="group">
        <label for="a">A</label>
        <input id="a" name="a" [(ngModel)]="a" required />

        <label for="b">B</label>
        <input id="b" name="b" [(ngModel)]="b" required />
      </ngx-form-group-wrapper>

      <button type="submit">Submit</button>
    </form>
  `,
})
class HostComponent {
  a = '';
  b = '';
}

@Component({
  imports: [FormsModule, NgxVestForms],
  template: `
    <form #form="ngForm">
      <fieldset ngxFormGroupWrapper ngModelGroup="group">
        <legend>Group</legend>

        <label for="alias-a">A</label>
        <input id="alias-a" name="a" [(ngModel)]="a" required />

        <label for="alias-b">B</label>
        <input id="alias-b" name="b" [(ngModel)]="b" required />
      </fieldset>

      <button type="submit">Submit</button>
    </form>
  `,
})
class HostAliasComponent {
  a = '';
  b = '';
}

describe('FormGroupWrapperComponent', () => {
  it('renders group-level errors but does not stamp ARIA onto descendant controls', async () => {
    await render(HostComponent);

    const inputA = screen.getByLabelText('A') as HTMLInputElement;
    const inputB = screen.getByLabelText('B') as HTMLInputElement;

    // Touch a child control (group becomes touched)
    await userEvent.click(inputA);
    await userEvent.tab();

    // Group becomes invalid + touched, so wrapper should reflect invalid state.
    await waitFor(() => {
      const wrapper = document.querySelector('ngx-form-group-wrapper');
      expect(wrapper).toBeTruthy();
      expect(wrapper).toHaveClass('ngx-form-group-wrapper--invalid');
    });

    // Critically: group wrapper must not mutate descendant inputs.
    expect(inputA).not.toHaveAttribute('aria-invalid');
    expect(inputA).not.toHaveAttribute('aria-describedby');
    expect(inputB).not.toHaveAttribute('aria-invalid');
    expect(inputB).not.toHaveAttribute('aria-describedby');
  });

  it('supports ngxFormGroupWrapper on fieldset', async () => {
    await render(HostAliasComponent);

    const inputA = screen.getByLabelText('A') as HTMLInputElement;
    const inputB = screen.getByLabelText('B') as HTMLInputElement;

    await userEvent.click(inputA);
    await userEvent.tab();

    await waitFor(() => {
      const wrapper = document.querySelector('fieldset[ngxformgroupwrapper]');
      expect(wrapper).toBeTruthy();
      expect(wrapper).toHaveClass('ngx-form-group-wrapper--invalid');
    });

    expect(inputA).not.toHaveAttribute('aria-invalid');
    expect(inputA).not.toHaveAttribute('aria-describedby');
    expect(inputB).not.toHaveAttribute('aria-invalid');
    expect(inputB).not.toHaveAttribute('aria-describedby');
  });
});
