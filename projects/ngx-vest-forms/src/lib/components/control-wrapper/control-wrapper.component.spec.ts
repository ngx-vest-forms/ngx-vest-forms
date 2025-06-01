import { Component, input, signal, viewChild } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import { enforce, only, staticSuite, test as vestTest, warn } from 'vest';
import { beforeEach, describe, expect, it } from 'vitest';
import { FormControlStateDirective } from '../../directives/form-control-state.directive';
import { FormDirective } from '../../directives/form.directive';
import { ControlWrapperComponent } from './control-wrapper.component';
import { CONTROL_WRAPPER_ERROR_DISPLAY } from './control-wrapper.config';

// Fixed Vest suite with correct error messages for field2
const basicSuite = staticSuite(
  (data: { field1?: string; field2?: string } = {}, field?: string) => {
    only(field);
    vestTest('field1', 'Field1 is required', () => {
      enforce(data.field1).isNotBlank();
    });
    vestTest('field1', 'Field1 is too short', () => {
      enforce(data.field1).isString()['minLength'](3);
    });
    vestTest('field2', 'Field2 is required', () => {
      enforce(data.field2).isNotBlank();
    });
    vestTest('field2', 'Field2 is too short', () => {
      enforce(data.field2).isString()['minLength'](3);
    });
  },
);

const suiteWithWarning = staticSuite(
  (data: { field1?: string } = {}, field?: string) => {
    only(field);
    vestTest('field1', 'Field1 is required', () => {
      enforce(data.field1).isNotBlank();
    });
    vestTest('field1', 'Field1 is too short', () => {
      enforce(data.field1).isString()['minLength'](3);
    });
    warn();
    vestTest(
      'field1',
      'Field1 should ideally be longer than 5 characters',
      () => {
        enforce(data.field1).isString()['minLength'](6);
      },
    );
  },
);

// Modernized Test Host Component using signal inputs
@Component({
  standalone: true,
  imports: [
    FormsModule,
    ControlWrapperComponent,
    FormDirective,
    FormControlStateDirective,
  ],
  template: `
    <form
      scVestForm
      [vestSuite]="suite()"
      [(formValue)]="formValue"
      #vestForm="scVestForm"
    >
      <sc-control-wrapper>
        <label for="field1">Field 1</label>
        <input id="field1" name="field1" [ngModel]="formValue().field1" />
      </sc-control-wrapper>

      <sc-control-wrapper errorDisplayMode="submit">
        <label for="field2">Field 2 (Submit Only)</label>
        <input id="field2" name="field2" [ngModel]="formValue().field2" />
      </sc-control-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
class TestHostComponent {
  suite = input(basicSuite); // Signal input with default value
  formValue = signal<{ field1: string; field2: string }>({
    field1: '',
    field2: '',
  });

  vestForm = viewChild(FormDirective);
  field1Model = viewChild<NgModel>('#field1');
  field2Model = viewChild<NgModel>('#field2');
}

describe('ControlWrapperComponent', () => {
  beforeEach(() => {
    // Reset any shared state if necessary
  });

  describe('Functional Correctness', () => {
    it('should render projected form controls (input and label)', async () => {
      await render(TestHostComponent);
      expect(screen.getByLabelText('Field 1')).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: 'Field 1' }),
      ).toBeInTheDocument();
    });

    it('should display errors when field is invalid and touched (default mode)', async () => {
      await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.type(inputField1, 'a');
      await userEvent.tab();

      expect(
        within(wrapperField1).queryByText('Field1 is required'),
      ).not.toBeInTheDocument();
      expect(
        within(wrapperField1).getByText('Field1 is too short'),
      ).toBeInTheDocument();
    });

    it('should display warnings if present', async () => {
      await render(TestHostComponent, {
        componentInputs: {
          suite: suiteWithWarning,
        },
      });

      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.type(inputField1, 'four');
      await userEvent.tab();

      expect(
        within(wrapperField1).queryByText('Field1 is required'),
      ).not.toBeInTheDocument();
      expect(
        within(wrapperField1).queryByText('Field1 is too short'),
      ).not.toBeInTheDocument();
      expect(
        within(wrapperField1).getByText(
          'Field1 should ideally be longer than 5 characters',
        ),
      ).toBeInTheDocument();
    });

    it('should not display errors for untouched fields in default mode', async () => {
      const { fixture } = await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      fixture.componentInstance.formValue.update((current) => ({
        ...current,
        field1: '',
      }));

      expect(
        within(wrapperField1).queryByText('Field1 is required'),
      ).not.toBeInTheDocument();
      expect(
        within(wrapperField1).queryByText('Field1 is too short'),
      ).not.toBeInTheDocument();
    });

    it('should display errors after form submission even if not touched', async () => {
      const { fixture } = await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      fixture.componentInstance.formValue.update((current) => ({
        ...current,
        field1: '',
      }));

      expect(
        within(wrapperField1).queryByText('Field1 is required'),
      ).not.toBeInTheDocument();

      await userEvent.click(submitButton);

      expect(
        within(wrapperField1).getByText('Field1 is required'),
      ).toBeInTheDocument();
    });

    it('should support (formValueChange) for backward compatibility (not recommended)', async () => {
      @Component({
        standalone: true,
        imports: [
          FormsModule,
          ControlWrapperComponent,
          FormDirective,
          FormControlStateDirective,
        ],
        template: `
          <form
            scVestForm
            [vestSuite]="suite"
            [formValue]="formValue()"
            (formValueChange)="formValue.set($event)"
            #vestForm="scVestForm"
          >
            <sc-control-wrapper>
              <label for="field1">Field 1</label>
              <input id="field1" name="field1" [ngModel]="formValue().field1" />
            </sc-control-wrapper>
          </form>
        `,
      })
      class LegacyHostComponent {
        formValue = signal<{ field1: string }>({ field1: '' });
        suite = basicSuite;
      }

      await render(LegacyHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.type(inputField1, 'a');
      await userEvent.tab();

      expect(
        within(wrapperField1).getByText('Field1 is too short'),
      ).toBeInTheDocument();
    });

    it('should support two-way binding with [(ngModel)] (not recommended)', async () => {
      @Component({
        standalone: true,
        imports: [
          FormsModule,
          ControlWrapperComponent,
          FormDirective,
          FormControlStateDirective,
        ],
        template: `
          <form
            scVestForm
            [vestSuite]="suite"
            [formValue]="formValue()"
            (formValueChange)="formValue.set($event)"
            #vestForm="scVestForm"
          >
            <sc-control-wrapper>
              <label for="field1">Field 1</label>
              <input
                id="field1"
                name="field1"
                [(ngModel)]="formValue().field1"
              />
            </sc-control-wrapper>
          </form>
        `,
      })
      class TwoWayHostComponent {
        formValue = signal<{ field1: string }>({ field1: '' });
        suite = basicSuite;
      }

      await render(TwoWayHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.type(inputField1, 'a');
      await userEvent.tab();

      expect(
        within(wrapperField1).getByText('Field1 is too short'),
      ).toBeInTheDocument();
    });
  });

  describe('Error Display Modes', () => {
    it('should respect errorDisplayMode="submit" and only show errors after submit', async () => {
      await render(TestHostComponent);
      const inputField2 = screen.getByRole('textbox', {
        name: 'Field 2 (Submit Only)',
      });
      const wrapperField2 = inputField2.closest('sc-control-wrapper');
      if (!(wrapperField2 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await userEvent.clear(inputField2);
      await userEvent.tab();

      expect(
        within(wrapperField2).queryByText('Field2 is required'),
      ).not.toBeInTheDocument();
      expect(
        within(wrapperField2).queryByText('Field2 is too short'),
      ).not.toBeInTheDocument();

      await userEvent.click(submitButton);

      expect(
        within(wrapperField2).getByText('Field2 is required'),
      ).toBeInTheDocument();
    });

    it('should respect global errorDisplayMode configuration', async () => {
      await render(TestHostComponent, {
        providers: [
          {
            provide: CONTROL_WRAPPER_ERROR_DISPLAY,
            useValue: 'submit',
          },
        ],
      });

      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      await userEvent.clear(inputField1);
      await userEvent.tab();

      expect(
        within(wrapperField1).queryByText('Field1 is required'),
      ).not.toBeInTheDocument();

      await userEvent.click(submitButton);

      expect(
        within(wrapperField1).getByText('Field1 is required'),
      ).toBeInTheDocument();
    });
  });

  describe('CSS Classes and ARIA Attributes', () => {
    it('should apply "sc-control-wrapper--invalid" class when errors are shown', async () => {
      await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.clear(inputField1);
      await userEvent.tab();

      expect(wrapperField1).toHaveClass('sc-control-wrapper--invalid');
    });

    it('should not apply "sc-control-wrapper--invalid" class when errors are present but not shown', async () => {
      const { fixture } = await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      fixture.componentInstance.formValue.update((current) => ({
        ...current,
        field1: '',
      }));

      expect(wrapperField1).not.toHaveClass('sc-control-wrapper--invalid');
    });

    it('should associate error messages with controls via aria-describedby', async () => {
      await render(TestHostComponent);
      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.clear(inputField1);
      await userEvent.tab();

      const errorMessage =
        within(wrapperField1).getByText('Field1 is required');
      expect(errorMessage).toBeInTheDocument();

      const describedBy = inputField1.getAttribute('aria-describedby') || '';
      expect(describedBy.length).toBeGreaterThan(0);
      expect(errorMessage.id).toBeTruthy();
      expect(describedBy.split(' ')).toContain(errorMessage.id);
    });
  });

  describe('Pending State (Async Validation)', () => {
    it('should show pending state during async validation', async () => {
      let resolveAsync: (() => void) | undefined;
      const asyncSuite = staticSuite(
        (data: { field1?: string } = {}, field?: string) => {
          only(field);
          vestTest('field1', 'Field1 is required', () => {
            enforce(data.field1).isNotBlank();
          });
          vestTest('field1', 'Async check', () => {
            return new Promise<void>((resolve) => {
              resolveAsync = resolve;
            });
          });
        },
      );

      await render(TestHostComponent, {
        componentInputs: {
          suite: asyncSuite,
        },
      });

      const inputField1 = screen.getByRole('textbox', { name: 'Field 1' });
      const wrapperField1 = inputField1.closest('sc-control-wrapper');
      if (!(wrapperField1 instanceof HTMLElement))
        throw new Error('Wrapper not found');

      await userEvent.type(inputField1, 'test');
      await userEvent.tab();

      expect(within(wrapperField1).getByRole('status')).toBeInTheDocument();
      expect(wrapperField1).toHaveAttribute('aria-busy', 'true');

      if (resolveAsync) resolveAsync();

      await expect
        .poll(() => within(wrapperField1).queryByRole('status'))
        .toBe(null);

      expect(wrapperField1).not.toHaveAttribute('aria-busy');
    });
  });
});
