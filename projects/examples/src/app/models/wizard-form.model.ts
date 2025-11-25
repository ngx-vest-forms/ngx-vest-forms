import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Step 1: Account Setup
 * Demonstrates bidirectional validation (email ↔ confirmEmail, password ↔ confirmPassword)
 */
export type WizardStep1Model = NgxDeepPartial<{
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
}>;

export const wizardStep1Shape: NgxDeepRequired<WizardStep1Model> = {
  email: '',
  confirmEmail: '',
  password: '',
  confirmPassword: '',
};

/**
 * Step 2: Profile Information
 * Demonstrates conditional validation (newsletter → frequency required)
 */
export type WizardStep2Model = NgxDeepPartial<{
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  subscribeNewsletter: boolean;
  newsletterFrequency: string;
}>;

export const wizardStep2Shape: NgxDeepRequired<WizardStep2Model> = {
  firstName: '',
  lastName: '',
  phone: '',
  dateOfBirth: '',
  subscribeNewsletter: false,
  newsletterFrequency: '',
};

/**
 * Step 3: Review & Confirmation
 * Final step with terms acceptance
 */
export type WizardStep3Model = NgxDeepPartial<{
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  comments: string;
}>;

export const wizardStep3Shape: NgxDeepRequired<WizardStep3Model> = {
  acceptTerms: false,
  acceptPrivacy: false,
  comments: '',
};

/**
 * Combined wizard data for final submission
 */
export type WizardCompleteModel = {
  step1: WizardStep1Model;
  step2: WizardStep2Model;
  step3: WizardStep3Model;
};
