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

export const businessHourFormShape: NgxDeepRequired<BusinessHourFormModel> = {
  from: '00:00',
  to: '00:00',
};

export const businessHoursFormShape: NgxDeepRequired<BusinessHoursFormModel> = {
  businessHours: {
    addValue: { ...businessHourFormShape },
    values: {
      '0': { ...businessHourFormShape },
    },
  },
};
