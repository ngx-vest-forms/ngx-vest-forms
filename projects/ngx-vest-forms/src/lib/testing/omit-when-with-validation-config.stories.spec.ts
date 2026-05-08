import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { OmitWhenValidationConfigComponent } from './omit-when-with-validation-config.stories';

const REQUIRED_AANTAL_MESSAGE =
  'Aantal is verplicht wanneer onderbouwing is ingevuld';
const REQUIRED_ONDERBOUWING_MESSAGE =
  'Onderbouwing is verplicht wanneer aantal is ingevuld';
const VALIDATION_WAIT_MS = 200;
const selectors = {
  inputAantal: 'input__aantal',
  inputOnderbouwing: 'input__onderbouwing',
  ngxControlWrapperAantal: 'ngx-control-wrapper__aantal',
  ngxControlWrapperOnderbouwing: 'ngx-control-wrapper__onderbouwing',
  btnSubmit: 'btn__submit',
  btnClearAantal: 'btn__clear-aantal',
  btnClearOnderbouwing: 'btn__clear-onderbouwing',
} as const;

const waitForValidationCycle = async (): Promise<void> => {
  await TestBed.inject(ApplicationRef).whenStable();
  await new Promise((resolve) => setTimeout(resolve, VALIDATION_WAIT_MS));
  await TestBed.inject(ApplicationRef).whenStable();
};

const renderStory = async (): Promise<void> => {
  await render(OmitWhenValidationConfigComponent);
  await waitForValidationCycle();
};

const blurField = async (element: HTMLElement): Promise<void> => {
  await userEvent.click(element);
  element.blur();
  await waitForValidationCycle();
};

describe('omitWhen + validationConfig stories', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'Scenario 1: Fill aantal first', async () => {
      await renderStory();

      const aantalInput = screen.getByTestId(selectors.inputAantal);
      await userEvent.clear(aantalInput);
      await userEvent.type(aantalInput, '1');
      await waitForValidationCycle();

      await blurField(screen.getByTestId(selectors.inputOnderbouwing));

      await waitFor(
        () => {
          expect(
            screen.getByTestId(selectors.ngxControlWrapperOnderbouwing)
          ).toHaveTextContent(REQUIRED_ONDERBOUWING_MESSAGE);
        },
        { timeout: 5000 }
      );
    },
    20000
  );

  it(
    'Scenario 2: Fill onderbouwing first', async () => {
      await renderStory();

      const onderbouwingInput = screen.getByTestId(selectors.inputOnderbouwing);
      await userEvent.clear(onderbouwingInput);
      await userEvent.type(onderbouwingInput, 'Some explanation text');
      await waitForValidationCycle();

      await blurField(screen.getByTestId(selectors.inputAantal));

      await waitFor(
        () => {
          expect(
            screen.getByTestId(selectors.ngxControlWrapperAantal)
          ).toHaveTextContent(REQUIRED_AANTAL_MESSAGE);
        },
        { timeout: 5000 }
      );
    },
    20000
  );

  it(
    'Scenario 3: Clear trigger field removes dependent requirement', async () => {
      await renderStory();

      const aantalInput = screen.getByTestId(selectors.inputAantal);
      await userEvent.clear(aantalInput);
      await userEvent.type(aantalInput, '1');
      await waitForValidationCycle();

      await userEvent.click(screen.getByTestId(selectors.btnClearAantal));
      await waitForValidationCycle();
      await blurField(screen.getByTestId(selectors.inputOnderbouwing));

      expect(
        screen.getByTestId(selectors.ngxControlWrapperOnderbouwing)
      ).not.toHaveTextContent(REQUIRED_ONDERBOUWING_MESSAGE);
    },
    20000
  );

  it(
    'Scenario 4: Bidirectional dependency cycle works correctly', async () => {
      await renderStory();

      const aantalInput = screen.getByTestId(selectors.inputAantal);
      const onderbouwingInput = screen.getByTestId(selectors.inputOnderbouwing);

      await userEvent.clear(aantalInput);
      await userEvent.type(aantalInput, '1');
      await waitForValidationCycle();

      await userEvent.clear(onderbouwingInput);
      await userEvent.type(onderbouwingInput, 'Filled justification');
      await waitForValidationCycle();

      await userEvent.click(screen.getByTestId(selectors.btnClearAantal));
      await waitForValidationCycle();
      await blurField(aantalInput);

      await waitFor(
        () => {
          expect(
            screen.getByTestId(selectors.ngxControlWrapperAantal)
          ).toHaveTextContent(REQUIRED_AANTAL_MESSAGE);
          expect(
            screen.getByTestId(selectors.ngxControlWrapperOnderbouwing)
          ).not.toHaveTextContent(REQUIRED_ONDERBOUWING_MESSAGE);
        },
        { timeout: 5000 }
      );
    },
    20000
  );

  it(
    'Scenario 5: Submit with empty fields', async () => {
      await renderStory();

      await userEvent.click(screen.getByTestId(selectors.btnSubmit));
      await waitForValidationCycle();

      expect(
        screen.getByTestId(selectors.ngxControlWrapperAantal)
      ).not.toHaveTextContent(REQUIRED_AANTAL_MESSAGE);
      expect(
        screen.getByTestId(selectors.ngxControlWrapperOnderbouwing)
      ).not.toHaveTextContent(REQUIRED_ONDERBOUWING_MESSAGE);
    },
    20000
  );

  it(
    'Scenario 6: Rapid field switching', async () => {
      await renderStory();

      const aantalInput = screen.getByTestId(selectors.inputAantal);
      const onderbouwingInput = screen.getByTestId(selectors.inputOnderbouwing);

      await userEvent.type(aantalInput, '1');
      await userEvent.click(onderbouwingInput);
      await userEvent.type(onderbouwingInput, 'T');
      await userEvent.click(aantalInput);
      await userEvent.clear(aantalInput);
      await blurField(onderbouwingInput);

      await waitFor(
        () => {
          expect(
            screen.getByTestId(selectors.ngxControlWrapperAantal)
          ).toHaveTextContent(REQUIRED_AANTAL_MESSAGE);
        },
        { timeout: 5000 }
      );
    },
    20000
  );
});
