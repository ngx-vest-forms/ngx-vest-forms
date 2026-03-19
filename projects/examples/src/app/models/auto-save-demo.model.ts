import { NgxDeepPartial } from 'ngx-vest-forms';

export type AutoSaveDemoModel = NgxDeepPartial<{
  projectName: string;
  quantity: string;
  quantityJustification: string;
  preferredContactMethod: 'email' | 'phone';
  email: string;
  notes: string;
}>;

export const initialAutoSaveDemoValue: AutoSaveDemoModel = {
  preferredContactMethod: 'email',
};
