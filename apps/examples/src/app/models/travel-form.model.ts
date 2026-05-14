import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type TravelFormModel = NgxDeepPartial<{
  departureDate: string;
  returnDate: string;
}>;

export const travelFormShape: NgxDeepRequired<TravelFormModel> = {
  departureDate: '',
  returnDate: '',
};
