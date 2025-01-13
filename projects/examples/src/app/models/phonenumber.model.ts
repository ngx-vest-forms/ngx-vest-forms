import { DeepRequired } from 'ngx-vest-forms';

export type PhonenumberModel = Partial<{
  addValue: string;
  values: Record<string, string>;
}>;
export const phonenumberShape: DeepRequired<PhonenumberModel> = {
  addValue: '',
  values: {
    '0': '',
  },
};
