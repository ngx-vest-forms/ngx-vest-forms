import { NgxVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { create, each, enforce, test, warn } from 'vest';
import { ComplexNestedModel } from '../../models/complex-nested.model';
import { addressValidations } from '../../shared/validations/address.validations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Vest suite for the team-registration form.
 *
 * `teamMembers` is keyed by a stable row id (never re-indexed on remove), so
 * each member's field paths stay constant. The suite keeps state between
 * runs, and Vest matches tests by call order; removing a middle row changes
 * that order. `each` plus a unique key per test (built from the row id) lets
 * Vest match tests by key instead, so a removed row's tests disappear with
 * it and the other rows keep their results.
 */
export const complexNestedSuite: NgxVestSuite<ComplexNestedModel> = create(
  (model: ComplexNestedModel) => {
    const memberEntries = Object.entries(model.teamMembers ?? {});

    test(ROOT_FORM, 'At least one team member is required', () => {
      enforce(memberEntries.length).greaterThan(0);
    });

    test(
      ROOT_FORM,
      'Large teams are harder to manage — keep it under 9',
      () => {
        warn();
        enforce(memberEntries.length).lessThanOrEquals(8);
      }
    );

    test('company.name', 'Company name is required', () => {
      enforce(model.company?.name).isNotBlank();
    });

    addressValidations(model.company?.address, 'company.address');

    each(memberEntries, ([key, member]) => {
      test(
        `teamMembers.${key}.fullName`,
        'Full name is required',
        () => {
          enforce(member?.fullName).isNotBlank();
        },
        `${key}.fullName`
      );

      test(
        `teamMembers.${key}.email`,
        'Email is required',
        () => {
          enforce(member?.email).isNotBlank();
        },
        `${key}.email.required`
      );
      test(
        `teamMembers.${key}.email`,
        'Enter a valid email address',
        () => {
          enforce(member?.email ?? '').matches(EMAIL_PATTERN);
        },
        `${key}.email.format`
      );

      test(
        `teamMembers.${key}.role`,
        'Role is required',
        () => {
          enforce(member?.role).isNotBlank();
        },
        `${key}.role`
      );
    });
  }
);
