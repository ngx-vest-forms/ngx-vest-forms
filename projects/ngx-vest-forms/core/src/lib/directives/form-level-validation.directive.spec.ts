import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { createTestValidationSuite } from './form-level-validation-test.validations';
import { NgxFormLevelValidationDirective } from './form-level-validation.directive';
import { NgxFormDirective } from './form.directive';

/**
 * Form-level (root) validator directive tests (modern Angular + ATL)
 */

describe('NgxFormLevelValidationDirective', () => {
  it('is disabled by default (no attribute)', async () => {
    await render(
      `<form ngxVestForm data-testid="form">
         <input name="email" ngModel data-testid="email" />
       </form>`,
      {
        imports: [
          FormsModule,
          NgxFormDirective,
          NgxFormLevelValidationDirective,
        ],
      },
    );
    await expect.element(screen.getByTestId('email')).toBeValid();
  });

  it('enables via boolean attribute (empty string)', async () => {
    await render(
      `<form ngxVestForm formLevelValidation data-testid="form">
         <input name="email" ngModel data-testid="email" />
       </form>`,
      {
        imports: [
          FormsModule,
          NgxFormDirective,
          NgxFormLevelValidationDirective,
        ],
      },
    );
    await expect.element(screen.getByTestId('email')).toBeInTheDocument();
  });

  it('submit mode: validates on submit only', async () => {
    @Component({
      imports: [FormsModule, NgxFormDirective, NgxFormLevelValidationDirective],
      template: `
        <form
          ngxVestForm
          formLevelValidation
          [formLevelValidation]="true"
          [formLevelSuite]="suite"
          #form="ngxVestForm"
        >
          <input name="password" [ngModel]="model.password" />
          <input name="confirmPassword" [ngModel]="model.confirmPassword" />
          @if (form.formState().root?.errors?.length) {
            <div data-testid="root-error">root error</div>
          }
          <button type="submit">Submit</button>
        </form>
      `,
    })
    class SubmitCmp {
      suite = createTestValidationSuite;
      model = { password: 'abc12345', confirmPassword: 'mismatch' };
    }

    await render(SubmitCmp);
    expect(screen.queryByTestId('root-error')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    const rootError = await screen.findByTestId('root-error');
    await expect.element(rootError).toBeInTheDocument();
  });

  it('live mode: validates without submit', async () => {
    @Component({
      imports: [FormsModule, NgxFormDirective, NgxFormLevelValidationDirective],
      template: `
        <form
          ngxVestForm
          formLevelValidation
          [formLevelValidation]="true"
          [formLevelValidationMode]="'live'"
          [formLevelSuite]="suite"
          #form="ngxVestForm"
        >
          <input name="password" [ngModel]="model.password" />
          <input name="confirmPassword" [ngModel]="model.confirmPassword" />
          @if (form.formState().root?.errors?.length) {
            <div data-testid="root-error">root error</div>
          }
        </form>
      `,
    })
    class LiveCmp {
      suite = createTestValidationSuite;
      model = { password: 'abc12345', confirmPassword: 'mismatch' };
    }

    await render(LiveCmp);
    const rootError = await screen.findByTestId('root-error');
    await expect.element(rootError).toBeInTheDocument();
  });
});
