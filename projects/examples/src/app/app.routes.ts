import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'simple-form', pathMatch: 'full' },
  {
    path: 'simple-form',
    loadComponent: () =>
      import('./01-getting-started/simple-form/simple-form.component').then(
        (m) => m.SimpleFormComponent,
      ),
    title: 'Simple Form Example',
  },
  {
    path: 'contact-form',
    loadComponent: () =>
      import('./01-getting-started/contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
    title: 'Contact Form',
  },
  {
    path: 'registration-form',
    loadComponent: () =>
      import(
        './01-getting-started/registration-form/registration-form.component'
      ).then((m) => m.RegistrationFormComponent),
    title: 'Registration Form Example',
  },
  {
    path: 'profile-form',
    loadComponent: () =>
      import('./02-standard-forms/profile-form/profile-form.component').then(
        (m) => m.ProfileFormComponent,
      ),
    title: 'Profile Form',
  },
  {
    path: 'business-hours-form',
    loadComponent: () =>
      import(
        './02-standard-forms/business-hours-form/business-hours-form.component'
      ).then((m) => m.BusinessHoursFormComponent),
    title: 'Business Hours Form',
  },
  {
    path: 'survey-form',
    loadComponent: () =>
      import('./02-standard-forms/survey-form/survey-form.component').then(
        (m) => m.SurveyFormComponent,
      ),
    title: 'Survey Form',
  },
  {
    path: 'async-validation-form',
    loadComponent: () =>
      import(
        './02-standard-forms/async-validation-form/async-validation-form.component'
      ).then((m) => m.AsyncValidationFormComponent),
    title: 'Async Validation Form',
  },
  {
    path: 'zod-schema-form',
    loadComponent: () =>
      import(
        './03-schema-integration/zod-schema-form/zod-schema-form.component'
      ).then((m) => m.ZodSchemaFormComponent),
    title: 'Zod Schema Form',
  },
  {
    path: 'phone-numbers-form',
    loadComponent: () =>
      import(
        './04-advanced-state/phone-numbers-form/phone-numbers-form.component'
      ).then((m) => m.PhoneNumbersFormComponent),
    title: 'Phone Numbers Form',
  },
  {
    path: 'smart-profile-form',
    loadComponent: () =>
      import(
        './04-advanced-state/smart-profile-form/smart-profile-form.component'
      ).then((m) => m.SmartProfileFormComponent),
    title: 'Smart Profile Form',
  },
  {
    path: 'purchase-form',
    loadComponent: () =>
      import(
        './05-complex-integrations/purchase-form/purchase-form.component'
      ).then((m) => m.PurchaseFormComponent),
    title: 'Purchase Form',
  },
  {
    path: 'wizard-form',
    loadComponent: () =>
      import(
        './05-complex-integrations/wizard-form/wizard-form.component'
      ).then((m) => m.WizardFormComponent),
    title: 'Wizard Form',
  },
];
