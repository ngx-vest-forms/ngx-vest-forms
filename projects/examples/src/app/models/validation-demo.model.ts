import { DeepPartial, DeepRequired } from 'ngx-vest-forms';

export type ValidationDemoModel = DeepPartial<{
  // Bidirectional example
  password: string;
  confirmPassword: string;

  // Cross-field requirement example
  quantity: string;
  quantityJustification: string;

  // Conditional validation example
  requiresJustification: boolean;
  justification: string;

  // Multiple dependencies
  country: string;
  state: string;
  zipCode: string;

  // Cross-field business rule
  startDate: string;
  endDate: string;
}>;

export const validationDemoShape: DeepRequired<ValidationDemoModel> = {
  password: '',
  confirmPassword: '',
  quantity: '',
  quantityJustification: '',
  requiresJustification: false,
  justification: '',
  country: '',
  state: '',
  zipCode: '',
  startDate: '',
  endDate: '',
};
