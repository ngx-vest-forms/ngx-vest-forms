import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { selectors } from './simple-form';
import { FormDirectiveDemoComponent } from './simple-form-with-validation-options.stories';

describe('simple-form-with-validation-options stories', () => {
  it('ShouldShowFirstnameRequiredAfterDelayForNgModel', async () => {
    await render(FormDirectiveDemoComponent);

    const firstNameInput = screen.getByTestId(
      selectors.inputFirstName
    ) as HTMLInputElement;

    await userEvent.click(firstNameInput);
    firstNameInput.blur();

    expect(
      screen.getByTestId(selectors.ngxControlWrapperFirstName)
    ).not.toHaveTextContent('First name is required');

    await waitFor(
      () =>
        expect(
          screen.getByTestId(selectors.ngxControlWrapperFirstName)
        ).toHaveTextContent('First name is required'),
      { timeout: 5000 }
    );
  });

  it('ShouldShowPasswordConfirmationAfterDelayForNgModelGroup', async () => {
    await render(FormDirectiveDemoComponent);

    const passwordInput = screen.getByTestId(
      selectors.inputPassword
    ) as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId(
      selectors.inputConfirmPassword
    ) as HTMLInputElement;

    await userEvent.type(passwordInput, 'first');
    await userEvent.type(confirmPasswordInput, 'second', { delay: 500 });
    await userEvent.click(confirmPasswordInput);
    confirmPasswordInput.blur();

    expect(
      screen.getByTestId(selectors.ngxControlWrapperPasswords)
    ).not.toHaveTextContent('Passwords do not match');

    await waitFor(
      () =>
        expect(
          screen.getByTestId(selectors.ngxControlWrapperPasswords)
        ).toHaveTextContent('Passwords do not match'),
      { timeout: 5000 }
    );
  });

  it('ShouldValidateOnRootFormAfterDelay', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.type(
      screen.getByTestId(selectors.inputFirstName),
      'Brecht'
    );
    await userEvent.type(
      screen.getByTestId(selectors.inputLastName),
      'Billiet'
    );
    await userEvent.type(screen.getByTestId(selectors.inputPassword), '1234');
    await userEvent.click(screen.getByTestId(selectors.btnSubmit));

    await waitFor(
      () => {
        const errorsText = screen
          .getByTestId(selectors.preFormErrors)
          .textContent?.trim();
        const errors = errorsText ? JSON.parse(errorsText) : {};
        expect(errors).toEqual({ rootForm: ['Brecht his pass is not 1234'] });
      },
      { timeout: 5000 }
    );
  });
});
