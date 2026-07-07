import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type TravelFormModel = NgxDeepPartial<{
  departureDate: string;
  returnDate: string;
}>;

export const travelFormContract: NgxDeepRequired<TravelFormModel> = {
  departureDate: '',
  returnDate: '',
};
