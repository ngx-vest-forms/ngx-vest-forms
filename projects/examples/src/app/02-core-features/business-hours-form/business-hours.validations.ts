import { each, enforce, only, skipWhen, staticSuite, test } from 'vest';
import { PartialBusinessHoursForm } from './business-hours-form.model';
import {
  isBusinessHoursOverlapping,
  isFromEarlierThanTo,
  isValidTimeFormat,
} from './business-hours.utils';

/**
 * Creates a validation suite for the business hours form.
 * This suite handles complex validation scenarios including root-level,
 * conditional, and nested field validations.
 *
 * @param rootFormKey The key for root-level form errors.
 * @returns A validation suite for the business hours form.
 */
export const createBusinessHoursSuite = (rootFormKey: string) =>
  staticSuite((model: PartialBusinessHoursForm, field?: string) => {
    only(field);

    // Root-level validation for business hours
    test(rootFormKey, 'At least one business hour must be added.', () => {
      enforce(model.businessHours?.values).isNotEmpty();
    });

    // More specific root-level validation for overlapping hours
    test(rootFormKey, 'Business hours cannot overlap.', () => {
      const businessHours = Object.values(
        model.businessHours?.values ?? {},
      ).map((hour) => ({
        from: hour?.from,
        to: hour?.to,
      }));
      enforce(isBusinessHoursOverlapping(businessHours)).isFalsy();
    });

    // Field-level validations for each business hour entry
    each(Object.values(model.businessHours?.values ?? {}), (hour, index) => {
      const key = Object.keys(model.businessHours?.values ?? {})[index];
      if (!hour || !key) return;

      const fromPath = `businessHours.values.${key}.from`;
      const toPath = `businessHours.values.${key}.to`;

      test(fromPath, 'From is required', () => {
        enforce(hour.from).isNotBlank();
      });

      test(toPath, 'To is required', () => {
        enforce(hour.to).isNotBlank();
      });

      test(fromPath, 'From must be a valid time', () => {
        enforce(isValidTimeFormat(hour.from)).isTruthy();
      });

      test(toPath, 'To must be a valid time', () => {
        enforce(isValidTimeFormat(hour.to)).isTruthy();
      });

      // Conditional validation: only run if both times are valid
      skipWhen(
        () =>
          !hour.from ||
          !hour.to ||
          !isValidTimeFormat(hour.from) ||
          !isValidTimeFormat(hour.to),
        () => {
          test(toPath, 'To must be later than from', () => {
            if (hour.from && hour.to) {
              enforce(isFromEarlierThanTo(hour.from, hour.to)).isTruthy();
            }
          });
        },
      );
    });
  });
