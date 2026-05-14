import { NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Map of phone numbers indexed by numeric keys
 * Used for template-driven forms with ngModelGroup
 */
export type PhoneNumberMap = Record<string, string>;

export type PhoneNumberModel = Partial<{
  addValue: string;
  values: PhoneNumberMap;
}>;
export const phoneNumberShape: NgxDeepRequired<PhoneNumberModel> = {
  addValue: '',
  values: {
    '0': '',
  },
};
