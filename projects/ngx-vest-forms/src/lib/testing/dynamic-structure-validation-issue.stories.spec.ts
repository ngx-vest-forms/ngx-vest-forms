import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DynamicStructureComponent,
  DynamicFormValidationSuite,
} from './dynamic-structure-validation-issue.stories';

describe('dynamic-structure-validation-issue stories', () => {
  beforeEach(() => {
    DynamicFormValidationSuite.reset();
  });

  it('keeps the workaround transition flow valid after an extra structure change', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
      expect(screen.getByTestId('debug__form-valid')).toHaveTextContent(
        'false'
      );
    });

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeB');
    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.getByTestId('debug__form-valid')).toHaveTextContent('true');
      expect(screen.getByTestId('debug__has-errors')).toHaveTextContent(
        'false'
      );
    });
  });

  it('clears stale field values as the structure changes', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });

    const fieldAInput = screen.getByTestId('input__field-a') as HTMLInputElement;
    await userEvent.type(fieldAInput, 'Test value for field A');

    await waitFor(() => {
      expect(fieldAInput.value).toBe('Test value for field A');
    });

    await userEvent.selectOptions(selectElement, 'typeB');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-b')).toBeInTheDocument();
    });

    const fieldBInput = screen.getByTestId('input__field-b') as HTMLInputElement;
    await userEvent.type(fieldBInput, 'Test value for field B');

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await waitFor(() => {
      const formValueText =
        screen.getByTestId('debug__form-value').textContent ?? '';

      expect(formValueText).not.toContain('Test value for field A');
      expect(formValueText).not.toContain('Test value for field B');
      expect(formValueText).toContain('"procedureType": "typeC"');
    });
  });

  it('renders the expected controls for each structure transition', async () => {
    await render(DynamicStructureComponent);

    const selectElement = screen.getByTestId(
      'select__procedure-type'
    ) as HTMLSelectElement;

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeB');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-a')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-b')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeC');

    await waitFor(() => {
      expect(screen.queryByTestId('input__field-b')).not.toBeInTheDocument();
      expect(screen.getByTestId('info__type-c')).toBeInTheDocument();
    });

    await userEvent.selectOptions(selectElement, 'typeA');

    await waitFor(() => {
      expect(screen.queryByTestId('info__type-c')).not.toBeInTheDocument();
      expect(screen.getByTestId('input__field-a')).toBeInTheDocument();
    });
  });
});
