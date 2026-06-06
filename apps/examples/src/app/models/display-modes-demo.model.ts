import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type DisplayModesDemoModel = NgxDeepPartial<{
  tokenDefaultError: string;
  tokenDefaultWarning: string;
  alwaysError: string;
  dirtyError: string;
  submitError: string;
  alwaysWarning: string;
  dirtyWarning: string;
  touchWarning: string;
}>;

export const displayModesDemoContract: NgxDeepRequired<DisplayModesDemoModel> = {
  tokenDefaultError: '',
  tokenDefaultWarning: '',
  alwaysError: '',
  dirtyError: '',
  submitError: '',
  alwaysWarning: '',
  dirtyWarning: '',
  touchWarning: '',
};
