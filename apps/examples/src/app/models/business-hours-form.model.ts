import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type BusinessHoursFormModel = NgxDeepPartial<{
  businessHours: {
    addValue: BusinessHourFormModel;
    values: Record<string, BusinessHourFormModel>;
  };
}>;

export type BusinessHourFormModel = NgxDeepPartial<{
  from: string;
  to: string;
}>;

export const businessHourFormContract: NgxDeepRequired<BusinessHourFormModel> =
  {
    from: '00:00',
    to: '00:00',
  };

export const businessHoursFormContract: NgxDeepRequired<BusinessHoursFormModel> =
  {
    businessHours: {
      addValue: { ...businessHourFormContract },
      values: {
        '0': { ...businessHourFormContract },
      },
    },
  };

export const initialBusinessHoursFormValue: BusinessHoursFormModel = {
  businessHours: {
    addValue: { from: '', to: '' },
    values: {},
  },
};
