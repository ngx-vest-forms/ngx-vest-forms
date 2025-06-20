// No need to import injectRootFormKey here anymore
import { each, enforce, omitWhen, only, staticSuite, test } from 'vest';
import {
  PartialBusinessHour, // Renamed from BusinessHourFormModel
  PartialBusinessHoursForm, // Renamed from BusinessHoursFormModel
} from './business-hours-form.model';

/**
 * Creates a validation suite for business hours
 *
 * @param rootFormKey - The key used for root form validations, provided by the component
 * @returns A Vest validation suite for business hours
 */
export const createBusinessHoursSuite = (rootFormKey = 'rootForm') =>
  staticSuite(
    (
      model: PartialBusinessHoursForm,
      field?: keyof PartialBusinessHoursForm | string,
    ) => {
      // Use renamed type
      if (field) {
        only(field as string); // Cast to string as `only` might expect a flat string path
      }
      const values = model.businessHours?.values
        ? Object.values(model.businessHours.values)
        : [];

      test(rootFormKey, 'You should have at least one business hour', () => {
        enforce((values?.length || 0) > 0).isTruthy();
      });
      omitWhen(values?.length < 2, () => {
        test(
          `businessHours.values`,
          'There should be no overlap between business hours',
          () => {
            enforce(
              areBusinessHoursValid(values as PartialBusinessHour[]), // Use renamed type
            ).isTruthy();
          },
        );
      });
      each(values, (businessHour, index) => {
        validateBusinessHourModel(
          `businessHours.values.${index}`,
          model.businessHours?.values?.[index],
        );
      });
      validateBusinessHourModel(
        'businessHours.addValue',
        model.businessHours?.addValue,
      );
    },
  );

function validateBusinessHourModel(
  field: string,
  modelValue?: PartialBusinessHour,
) {
  test(`${field}.to`, 'Required', () => {
    enforce(modelValue?.to).isNotBlank();
  });
  test(`${field}.from`, 'Required', () => {
    enforce(modelValue?.from).isNotBlank();
  });
  test(`${field}.from`, 'Should be a valid time (HHMM format)', () => {
    enforce(isValidTimeFormat(modelValue?.from)).isTruthy();
  });
  test(`${field}.to`, 'Should be a valid time (HHMM format)', () => {
    enforce(isValidTimeFormat(modelValue?.to)).isTruthy();
  });
  omitWhen(
    () =>
      !isValidTimeFormat(modelValue?.from) ||
      !isValidTimeFormat(modelValue?.to),
    () => {
      test(field, 'The from time must be earlier than the to time', () => {
        // isFromEarlierThanTo now expects HHMM format
        enforce(
          isFromEarlierThanTo(modelValue?.from, modelValue?.to),
        ).isTruthy();
      });
    },
  );
}

function areBusinessHoursValid(
  businessHours?: PartialBusinessHour[], // Use renamed type
): boolean {
  if (!businessHours) {
    return false;
  }
  for (let index = 0; index < businessHours.length - 1; index++) {
    const currentHour = businessHours[index];
    const nextHour = businessHours[index + 1];

    if (
      !isValidTimeFormat(currentHour.from) ||
      !isValidTimeFormat(currentHour.to) ||
      !isValidTimeFormat(nextHour.from) ||
      !isValidTimeFormat(nextHour.to)
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

  const lastHour = businessHours.at(-1);
  return lastHour
    ? isValidTimeFormat(lastHour.from) &&
        isValidTimeFormat(lastHour.to) &&
        isFromEarlierThanTo(lastHour.from, lastHour.to)
    : false;
}

// Renamed isValidTime to isValidTimeFormat to be more specific about its function
function isValidTimeFormat(time?: string): boolean {
  let valid = false;
  if (time?.length === 4) {
    const first = Number(time?.slice(0, 2));
    const second = Number(time?.slice(2, 4));
    if (
      !Number.isNaN(first) && // Check if conversion to Number was successful
      !Number.isNaN(second) &&
      first >= 0 && // Allow 00 for hours
      first < 24 &&
      second >= 0 && // Allow 00 for minutes
      second < 60
    ) {
      valid = true;
    }
  }
  return valid;
}

function isFromEarlierThanTo(fromTime?: string, toTime?: string): boolean {
  if (!fromTime || !toTime || fromTime.length !== 4 || toTime.length !== 4) {
    return false; // Basic format check
  }
  if (!isValidTimeFormat(fromTime) || !isValidTimeFormat(toTime)) {
    return false; // Ensure both are valid times before comparing
  }

  const fromHours = Number(fromTime.slice(0, 2));
  const fromMinutes = Number(fromTime.slice(2, 4));
  const toHours = Number(toTime.slice(0, 2));
  const toMinutes = Number(toTime.slice(2, 4));

  if (fromHours < toHours) {
    return true;
  } else if (fromHours === toHours) {
    return fromMinutes < toMinutes;
  } else {
    return false;
  }
}
