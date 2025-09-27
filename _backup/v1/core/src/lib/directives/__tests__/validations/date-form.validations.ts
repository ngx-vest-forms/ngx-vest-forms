import { enforce, only, staticSuite, test as vestTest } from 'vest';
import { NgxFormCompatibleDeepRequired } from '../../../utils/deep-required';
import { EventFormModel } from '../models/event-form.model';

/**
 * Date form validation suite that handles both string and Date types
 */
export const dateFormValidations = staticSuite(
  (
    data: NgxFormCompatibleDeepRequired<EventFormModel> | undefined,
    field?: string,
  ) => {
    const actualData =
      data ??
      ({
        title: '',
        startDate: '',
        endDate: '',
        details: {
          createdAt: '',
          category: '',
          metadata: {
            lastUpdated: '',
            version: 0,
          },
        },
      } satisfies NgxFormCompatibleDeepRequired<EventFormModel>);
    only(field);

    vestTest('title', 'Title is required', () => {
      enforce(actualData.title).isNotEmpty();
    });

    vestTest('startDate', 'Start date is required', () => {
      if (typeof actualData.startDate === 'string') {
        enforce(actualData.startDate).isNotEmpty();
      } else {
        enforce(actualData.startDate).isNotEmpty();
      }
    });

    vestTest('endDate', 'End date is required', () => {
      if (typeof actualData.endDate === 'string') {
        enforce(actualData.endDate).isNotEmpty();
      } else {
        enforce(actualData.endDate).isNotEmpty();
      }
    });

    vestTest('startDate', 'Start date must be valid', () => {
      if (actualData.startDate) {
        const date =
          typeof actualData.startDate === 'string'
            ? new Date(actualData.startDate)
            : actualData.startDate;
        enforce(date).condition(
          (d) => d instanceof Date && !Number.isNaN(d.getTime()),
        );
      }
    });

    vestTest('details.createdAt', 'Created date is required', () => {
      if (typeof actualData.details.createdAt === 'string') {
        enforce(actualData.details.createdAt).isNotEmpty();
      } else {
        enforce(actualData.details.createdAt).isNotEmpty();
      }
    });

    vestTest('details.category', 'Category is required', () => {
      enforce(actualData.details.category).isNotEmpty();
    });

    vestTest('details.metadata.lastUpdated', 'Last updated is required', () => {
      if (typeof actualData.details.metadata.lastUpdated === 'string') {
        enforce(actualData.details.metadata.lastUpdated).isNotEmpty();
      } else {
        enforce(actualData.details.metadata.lastUpdated).isNotEmpty();
      }
    });
  },
);
