import { NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Map of phone numbers indexed by numeric keys
 * Used for template-driven forms with ngModelGroup
 */
export type PhoneNumberMap = Record<string, string>;

export type PhonenumberModel = Partial<{
  addValue: string;
  values: PhoneNumberMap;
}>;
export const phonenumberShape: NgxDeepRequired<PhonenumberModel> = {
  addValue: '',
  values: {
    '0': '',
  },
};
