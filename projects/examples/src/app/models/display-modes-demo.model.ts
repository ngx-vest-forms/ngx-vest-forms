import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type DisplayModesDemoModel = NgxDeepPartial<{
  alwaysError: string;
  dirtyError: string;
  submitError: string;
  alwaysWarning: string;
  dirtyWarning: string;
  touchWarning: string;
}>;

export const displayModesDemoShape: NgxDeepRequired<DisplayModesDemoModel> = {
  alwaysError: '',
  dirtyError: '',
  submitError: '',
  alwaysWarning: '',
  dirtyWarning: '',
  touchWarning: '',
};
