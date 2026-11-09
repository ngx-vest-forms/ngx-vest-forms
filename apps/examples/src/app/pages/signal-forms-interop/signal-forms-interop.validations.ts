import { type NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';
import {
  SEAT_LIMITS,
  SignalFormsInteropModel,
} from '../../models/signal-forms-interop.model';

/**
 * Vest suite for the Signal Forms interop demo. A plain Vest spec: it does not
 * know that `seats` and `acceptTerms` come from Signal Forms controls.
 */
export const signalFormsInteropSuite: NgxVestSuite<SignalFormsInteropModel> =
  create((model: SignalFormsInteropModel) => {
    // A locked (disabled) stepper is not validated. Its value still reaches
    // the suite and the submitted value: ngx-vest-forms builds the form value
    // from getRawValue(), which includes disabled controls.
    omitWhen(model.lockSeats === true, () => {
      test('seats', 'Choose how many seats you need', () => {
        enforce(model.seats).isNotNullish();
      });

      omitWhen(typeof model.seats !== 'number', () => {
        test(
          'seats',
          `Book between ${SEAT_LIMITS.min} and ${SEAT_LIMITS.max} seats`,
          () => {
            enforce(model.seats).isBetween(SEAT_LIMITS.min, SEAT_LIMITS.max);
          }
        );
      });
    });

    test('acceptTerms', 'Accept the booking terms to continue', () => {
      enforce(model.acceptTerms).isTruthy();
    });
  });
