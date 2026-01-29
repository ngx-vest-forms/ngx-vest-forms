import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

export type DisplayModesDemoModel = NgxDeepPartial<{
  alwaysError: string;
  dirtyError: string;
  alwaysWarning: string;
  dirtyWarning: string;
  touchWarning: string;
}>;

export const displayModesDemoShape: NgxDeepRequired<DisplayModesDemoModel> = {
  alwaysError: '',
  dirtyError: '',
  alwaysWarning: '',
  dirtyWarning: '',
  touchWarning: '',
};
