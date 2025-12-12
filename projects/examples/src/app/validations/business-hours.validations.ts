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
      const addValue = model.businessHours?.addValue;

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

      // The add-new fields are an optional entry area.
      // If both are empty, they should not make the whole form invalid.
      // Once the user starts typing in either field, we validate the pair.
      validateBusinessHourModel('businessHours.addValue', addValue, {
        allowEmptyPair: true,
      });
    }
  );

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function validateBusinessHourModel(
  field: string,
  model?: BusinessHourFormModel,
  options?: { allowEmptyPair?: boolean }
) {
  const isEmptyPair =
    options?.allowEmptyPair && isBlank(model?.from) && isBlank(model?.to);

  test(`${field}.to`, 'Required', () => {
    if (isEmptyPair) return;
    enforce(model?.to).isNotBlank();
  });
  test(`${field}.from`, 'Required', () => {
    if (isEmptyPair) return;
    enforce(model?.from).isNotBlank();
  });
  test(`${field}.from`, 'Should be a valid time', () => {
    if (isEmptyPair || isBlank(model?.from)) return;
    enforce(isValidTime(model?.from)).isTruthy();
  });
  test(`${field}.to`, 'Should be a valid time', () => {
    if (isEmptyPair || isBlank(model?.to)) return;
    enforce(isValidTime(model?.to)).isTruthy();
  });
  omitWhen(
    () => !isValidTime(model?.from) || !isValidTime(model?.to),
    () => {
      test(field, 'The from should be earlier than the to', () => {
        enforce(isFromEarlierThanTo(model?.from, model?.to)).isTruthy();
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

function isValidTime(time?: string): boolean {
  return parseTime(time) !== null;
}

type ParsedTime = { hours: number; minutes: number };

function parseTime(time: unknown): ParsedTime | null {
  if (typeof time !== 'string') return null;
  const trimmed = time.trim();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':');
    if (!h || !m) return null;
    const hours = Number(h);
    const minutes = Number(m);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) return null;
    return { hours, minutes };
  }

  if (trimmed.length === 4) {
    const hours = Number(trimmed.slice(0, 2));
    const minutes = Number(trimmed.slice(2, 4));
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) return null;
    return { hours, minutes };
  }

  return null;
}

function isFromEarlierThanTo(from?: string, to?: string): boolean {
  const fromTime = parseTime(from);
  const toTime = parseTime(to);
  if (!fromTime || !toTime) {
    return false;
  }

  const fromMinutesTotal = fromTime.hours * 60 + fromTime.minutes;
  const toMinutesTotal = toTime.hours * 60 + toTime.minutes;
  return fromMinutesTotal < toMinutesTotal;
}
