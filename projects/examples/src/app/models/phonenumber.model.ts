import { NgxDeepRequired } from 'ngx-vest-forms';

export type PhonenumberModel = Partial<{
  addValue: string;
  values: { [key: string]: string };
}>;
export const phonenumberShape: NgxDeepRequired<PhonenumberModel> = {
  addValue: '',
  values: {
    '0': '',
  },
};
