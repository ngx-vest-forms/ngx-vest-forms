import type { NgxVestSuite } from 'ngx-vest-forms';
import { create, enforce, omitWhen, test } from 'vest';
import { AccessibleWrapperModel } from '../../models/accessible-wrapper.model';

export const accessibleWrapperSuite: NgxVestSuite<AccessibleWrapperModel> =
  create((model: AccessibleWrapperModel) => {
    test('preferredName', 'Preferred name is required', () => {
      enforce(model.preferredName).isNotBlank();
    });

    omitWhen(!model.preferredName, () => {
      test(
        'preferredName',
        'Preferred name must be at least 3 characters',
        () => {
          enforce(model.preferredName).longerThanOrEquals(3);
        }
      );
    });

    test('searchQuery', 'Search query is required', () => {
      enforce(model.searchQuery).isNotBlank();
    });
  });
