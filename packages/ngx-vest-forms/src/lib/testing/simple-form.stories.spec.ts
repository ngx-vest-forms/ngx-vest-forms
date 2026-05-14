import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { selectors } from './simple-form';
import { FormDirectiveDemoComponent } from './simple-form.demo.component';

function getPreJson(testId: string) {
  const textContent = screen.getByTestId(testId).textContent?.trim();

  if (!textContent) {
    throw new Error(`Expected ${testId} to contain JSON, but it was empty.`);
  }

  return JSON.parse(textContent);
}

describe('simple-form stories', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows errors on submit', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.click(screen.getByTestId(selectors.btnSubmit));

    expect(
      screen.getByTestId(selectors.ngxControlWrapperFirstName)
    ).toHaveTextContent('First name is required');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperLastName)
    ).toHaveTextContent('Last name is required');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperPassword)
    ).toHaveTextContent('Password is required');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperConfirmPassword)
    ).not.toHaveTextContent('Confirm password is required');
  });

  it('hides errors when valid', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.click(screen.getByTestId(selectors.btnSubmit));
    await userEvent.type(screen.getByTestId(selectors.inputFirstName), 'first');
    await userEvent.type(screen.getByTestId(selectors.inputLastName), 'last');
    await userEvent.type(screen.getByTestId(selectors.inputPassword), 'pass');

    expect(
      screen.getByTestId(selectors.ngxControlWrapperFirstName)
    ).not.toHaveTextContent('First name is required');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperLastName)
    ).not.toHaveTextContent('Last name is required');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperPassword)
    ).not.toHaveTextContent('Password is required');
  });

  it('shows errors on blur', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.click(screen.getByTestId(selectors.inputFirstName));
    await userEvent.tab();
    expect(
      screen.getByTestId(selectors.ngxControlWrapperFirstName)
    ).toHaveTextContent('First name is required');

    await userEvent.click(screen.getByTestId(selectors.inputLastName));
    await userEvent.tab();
    expect(
      screen.getByTestId(selectors.ngxControlWrapperLastName)
    ).toHaveTextContent('Last name is required');

    await userEvent.click(screen.getByTestId(selectors.inputPassword));
    await userEvent.tab();
    expect(
      screen.getByTestId(selectors.ngxControlWrapperPassword)
    ).toHaveTextContent('Password is required');
  });

  it('validates on groups', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.type(screen.getByTestId(selectors.inputPassword), 'first');
    await userEvent.type(
      screen.getByTestId(selectors.inputConfirmPassword),
      'second'
    );
    await userEvent.tab();

    expect(
      screen.getByTestId(selectors.ngxControlWrapperPasswords)
    ).toHaveTextContent('Passwords do not match');
    expect(
      screen.getByTestId(selectors.ngxControlWrapperPasswords)
    ).toHaveClass('ngx-control-wrapper--invalid');
  });

  it('has correct statuses and form value initially', async () => {
    await render(FormDirectiveDemoComponent);

    await waitFor(() => {
      expect(screen.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'false'
      );
      expect(screen.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'false'
      );
      expect(getPreJson(selectors.preFormValue)).toEqual({
        passwords: {
          password: null,
          confirmPassword: null,
        },
      });
      expect(getPreJson(selectors.preFormErrors)).toEqual({
        firstName: ['First name is required'],
        lastName: ['Last name is required'],
        'passwords.password': ['Password is required'],
      });
    });
  });

  it('has correct statuses on form update', async () => {
    await render(FormDirectiveDemoComponent);

    await userEvent.type(screen.getByTestId(selectors.inputFirstName), 'f');

    await waitFor(() => {
      expect(screen.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'false'
      );
      expect(screen.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'true'
      );
      expect(getPreJson(selectors.preFormValue)).toEqual({
        firstName: 'f',
        passwords: {
          password: null,
          confirmPassword: null,
        },
      });
      expect(getPreJson(selectors.preFormErrors)).toEqual({
        lastName: ['Last name is required'],
        'passwords.password': ['Password is required'],
      });
    });

    await userEvent.type(screen.getByTestId(selectors.inputLastName), 'l');
    await userEvent.type(screen.getByTestId(selectors.inputPassword), 'p');
    await userEvent.type(
      screen.getByTestId(selectors.inputConfirmPassword),
      'p'
    );

    await waitFor(() => {
      expect(screen.getByTestId(selectors.preFormValid)).toHaveTextContent(
        'true'
      );
      expect(screen.getByTestId(selectors.preFormDirty)).toHaveTextContent(
        'true'
      );
      expect(getPreJson(selectors.preFormValue)).toEqual({
        firstName: 'f',
        lastName: 'l',
        passwords: {
          password: 'p',
          confirmPassword: 'p',
        },
      });
      expect(getPreJson(selectors.preFormErrors)).toEqual({});
    });
  });

  it('validates on root form', async () => {
    await render(FormDirectiveDemoComponent);

    await waitFor(() => {
      expect(screen.getByTestId(selectors.btnSubmit)).toBeInTheDocument();
    });
    await userEvent.type(
      screen.getByTestId(selectors.inputFirstName),
      'Brecht'
    );
    await userEvent.type(
      screen.getByTestId(selectors.inputLastName),
      'Billiet'
    );
    await userEvent.type(screen.getByTestId(selectors.inputPassword), '1234');
    await userEvent.type(
      screen.getByTestId(selectors.inputConfirmPassword),
      '1234'
    );
    await userEvent.click(screen.getByTestId(selectors.btnSubmit));

    await waitFor(
      () => {
        expect(getPreJson(selectors.preFormErrors)).toEqual({
          rootForm: ['Brecht his pass is not 1234'],
        });
      },
      { timeout: 2000 }
    );
  });
});
