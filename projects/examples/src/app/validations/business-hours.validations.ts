import { FormFieldName, NgxTypedVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { each, enforce, omitWhen, only, staticSuite, test } from 'vest';
import {
  BusinessHourFormModel,
  BusinessHoursFormModel,
} from '../models/business-hours-form.model';

export const businessHoursSuite: NgxTypedVestSuite<BusinessHoursFormModel> =
  staticSuite(
    (
      model: BusinessHoursFormModel,
      field?: FormFieldName<BusinessHoursFormModel>
    ) => {
      only(field);
      const values = model.businessHours?.values
        ? Object.values(model.businessHours.values)
        : [];

      test(ROOT_FORM, 'You should have at least one business hour', () => {
        enforce((values?.length || 0) > 0).isTruthy();
      });
      omitWhen(values?.length < 2, () => {
        test(
          `businessHours.values`,
          'There should be no overlap between business hours',
          () => {
            enforce(
              areBusinessHoursValid(values as BusinessHourFormModel[])
            ).isTruthy();
          }
        );
      });
      each(values, (businessHour, index) => {
        validateBusinessHourModel(
          `businessHours.values.${index}`,
          model.businessHours?.values?.[index]
        );
      });
      validateBusinessHourModel(
        'businessHours.addValue',
        model.businessHours?.addValue
      );
    }
  );

function validateBusinessHourModel(
  field: string,
  model?: BusinessHourFormModel
) {
  test(`${field}.to`, 'Required', () => {
    enforce(model?.to).isNotBlank();
  });
  test(`${field}.from`, 'Required', () => {
    enforce(model?.from).isNotBlank();
  });
  test(`${field}.from`, 'Should be a valid time', () => {
    enforce(isValidTime(model?.from)).isTruthy();
  });
  test(`${field}.to`, 'Should be a valid time', () => {
    enforce(isValidTime(model?.to)).isTruthy();
  });
  omitWhen(
    () => !isValidTime(model?.from) || !isValidTime(model?.to),
    () => {
      test(field, 'The from should be earlier than the to', () => {
        const fromFirst = Number(model?.from?.slice(0, 2));
        const fromSecond = Number(model?.from?.slice(2, 4));
        const toFirst = Number(model?.to?.slice(0, 2));
        const toSecond = Number(model?.to?.slice(2, 4));
        const from = `${fromFirst}:${fromSecond}`;
        const to = `${toFirst}:${toSecond}`;
        enforce(isFromEarlierThanTo(from, to)).isTruthy();
      });
    }
  );
}

function areBusinessHoursValid(
  businessHours?: BusinessHourFormModel[]
): boolean {
  if (!businessHours) {
    return false;
  }
  for (let i = 0; i < businessHours.length - 1; i++) {
    const currentHour = businessHours[i];
    const nextHour = businessHours[i + 1];

    if (
      !isValidTime(currentHour.from) ||
      !isValidTime(currentHour.to) ||
      !isValidTime(nextHour.from) ||
      !isValidTime(nextHour.to)
    ) {
      return false;
    }

    if (!isFromEarlierThanTo(currentHour?.from, currentHour?.to)) {
      return false;
    }

    if (!isFromEarlierThanTo(currentHour.to, nextHour.from)) {
      return false;
    }
  }

  const lastHour = businessHours[businessHours.length - 1];
  return (
    isValidTime(lastHour.from) &&
    isValidTime(lastHour.to) &&
    isFromEarlierThanTo(lastHour.from, lastHour.to)
  );
}

function timeStrToMinutes(time?: string): number {
  if (!time) {
    return 0;
  }
  const hours = Number(time?.slice(0, 2));
  const minutes = Number(time?.slice(2, 4));
  return hours * 60 + minutes;
}

function isValidTime(time?: string): boolean {
  let valid = false;
  if (time?.length === 4) {
    const first = Number(time?.slice(0, 2));
    const second = Number(time?.slice(2, 4));
    if (
      typeof first === 'number' &&
      typeof second === 'number' &&
      first < 24 &&
      second < 60
    ) {
      valid = true;
    }
  }
  return valid;
}

function isFromEarlierThanTo(from?: string, to?: string) {
  if (!from || !to) {
    return false;
  }
  // Split the "from" and "to" strings into hours and minutes
  const [fromHours, fromMinutes] = from.split(':').map(Number);
  const [toHours, toMinutes] = to.split(':').map(Number);

  // Check if the "from" time is earlier than the "to" time
  if (fromHours < toHours) {
    return true;
  } else if (fromHours === toHours) {
    return fromMinutes < toMinutes;
  } else {
    return false;
  }
}
