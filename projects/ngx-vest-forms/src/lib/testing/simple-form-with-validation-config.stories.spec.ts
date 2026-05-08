import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import { beforeEach, describe, expect, it } from 'vitest';
import { selectors, formValidationSuite } from './simple-form';
import { FormDirectiveDemoComponent } from './simple-form-with-validation-config.stories';

describe('simple-form-with-validation-config stories', () => {
  beforeEach(() => {
    formValidationSuite.reset?.();
  });

  it('updates cross-field revalidation when the component swaps validationConfig references', async () => {
    const { fixture } = await render(FormDirectiveDemoComponent);
    const settle = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      fixture.detectChanges();
      await fixture.whenStable();
    };

    await settle();

    const passwordInput = screen.getByTestId(
      selectors.inputPassword
    ) as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId(
      selectors.inputConfirmPassword
    ) as HTMLInputElement;
    const confirmPasswordWrapper = screen.getByTestId(
      selectors.ngxControlWrapperConfirmPassword
    );
    const toggleButton = screen.getByTestId(selectors.btnToggleValidationConfig);

    fireEvent.blur(confirmPasswordInput);
    await settle();

    fireEvent.click(toggleButton);
    await settle();
    fireEvent.input(passwordInput, { target: { value: 'f' } });
    await settle();

    await waitFor(() => {
      expect(confirmPasswordWrapper).not.toHaveTextContent(
        'Confirm password is required'
      );
    });

    fireEvent.click(toggleButton);
    await settle();
    fireEvent.input(passwordInput, { target: { value: 'fg' } });
    await settle();

    await waitFor(() => {
      expect(confirmPasswordWrapper).toHaveTextContent(
        'Confirm password is required'
      );
    });
  });
});
