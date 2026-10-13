import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type AccessibleWrapperModel = NgxDeepPartial<{
  preferredName: string;
  searchQuery: string;
}>;

export const accessibleWrapperContract: NgxDeepRequired<AccessibleWrapperModel> =
  {
    preferredName: '',
    searchQuery: '',
  };
