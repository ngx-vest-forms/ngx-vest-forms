import { FormFieldName } from 'ngx-vest-forms';
import { enforce, omitWhen, only, staticSuite, test, warn } from 'vest';
import { TravelFormModel } from '../../models/travel-form.model';

const MIN_DAYS_ADVANCE = 3;
const MS_PER_DAY = 86_400_000;

export const travelValidationSuite = staticSuite(
  (model: TravelFormModel, field?: FormFieldName<TravelFormModel>) => {
    only(field);

    test('departureDate', 'Departure date is required', () => {
      enforce(model.departureDate).isNotEmpty();
    });

    test('returnDate', 'Return date is required', () => {
      enforce(model.returnDate).isNotEmpty();
    });

    omitWhen(!model.departureDate || !model.returnDate, () => {
      test('returnDate', 'Return date must be after departure date', () => {
        if (!model.departureDate || !model.returnDate) return;
        const departure = new Date(model.departureDate);
        const returnD = new Date(model.returnDate);
        enforce(returnD.getTime()).greaterThan(departure.getTime());
      });

      test(
        'returnDate',
        `Consider allowing at least ${MIN_DAYS_ADVANCE} days between dates`,
        () => {
          warn();
          if (!model.departureDate || !model.returnDate) return;
          const departure = new Date(model.departureDate);
          const returnD = new Date(model.returnDate);
          const diffDays =
            (returnD.getTime() - departure.getTime()) / MS_PER_DAY;
          enforce(diffDays).greaterThanOrEquals(MIN_DAYS_ADVANCE);
        }
      );
    });
  }
);
