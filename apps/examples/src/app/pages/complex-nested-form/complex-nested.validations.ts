import { NgxVestSuite, ROOT_FORM } from 'ngx-vest-forms';
import { create, enforce, test, warn } from 'vest';
import { ComplexNestedModel } from '../../models/complex-nested.model';
import { addressValidations } from '../../shared/validations/address.validations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Vest suite for the team-registration form.
 *
 * The suite is stateless: it simply reads the current model on each run. Since
 * `teamMembers` is keyed by a stable id (never re-indexed on remove), each
 * member's field paths stay constant, so add/remove refreshes validation
 * correctly and a removed row's tests disappear with its key.
 */
export const complexNestedSuite: NgxVestSuite<ComplexNestedModel> = create(
  (model: ComplexNestedModel) => {
    const memberEntries = Object.entries(model.teamMembers ?? {});

    test(ROOT_FORM, 'At least one team member is required', () => {
      enforce(memberEntries.length).greaterThan(0);
    });

    test(ROOT_FORM, 'Large teams are harder to manage — keep it under 9', () => {
      warn();
      enforce(memberEntries.length).lessThanOrEquals(8);
    });

    test('company.name', 'Company name is required', () => {
      enforce(model.company?.name).isNotBlank();
    });

    addressValidations(model.company?.address, 'company.address');

    for (const [key, member] of memberEntries) {
      test(
        `teamMembers.${key}.fullName`,
        'Full name is required',
        () => {
          enforce(member?.fullName).isNotBlank();
        }
      );

      test(`teamMembers.${key}.email`, 'Email is required', () => {
        enforce(member?.email).isNotBlank();
      });
      test(`teamMembers.${key}.email`, 'Enter a valid email address', () => {
        enforce(member?.email ?? '').matches(EMAIL_PATTERN);
      });

      test(`teamMembers.${key}.role`, 'Role is required', () => {
        enforce(member?.role).isNotBlank();
      });
    }
  }
);
