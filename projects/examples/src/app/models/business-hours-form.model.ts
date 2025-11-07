import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type BusinessHoursFormModel = NgxDeepPartial<{
  businessHours: {
    addValue: BusinessHourFormModel;
    values: { [key: string]: BusinessHourFormModel };
  };
}>;

export type BusinessHourFormModel = NgxDeepPartial<{
  from: string;
  to: string;
}>;

export const businesssHourFormShape: NgxDeepRequired<BusinessHourFormModel> = {
  from: '00:00',
  to: '00:00',
};

export const businessHoursFormShape: NgxDeepRequired<BusinessHoursFormModel> = {
  businessHours: {
    addValue: { ...businesssHourFormShape },
    values: {
      '0': { ...businesssHourFormShape },
    },
  },
};
