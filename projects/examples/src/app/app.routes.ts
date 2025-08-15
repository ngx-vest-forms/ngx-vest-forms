import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', redirectTo: 'simple-form', pathMatch: 'full' },
  {
    path: 'minimal-form',
    loadComponent: () =>
      import('./01-fundamentals/minimal-form/minimal-form.component').then(
        (m) => m.MinimalFormComponent,
      ),
    title: 'Minimal Form',
  },
  {
    path: 'simple-form',
    loadComponent: () =>
      import('./02-core-features/simple-form/simple-form.component').then(
        (m) => m.SimpleFormComponent,
      ),
    title: 'Simple Form Example',
  },
  {
    path: 'contact-form',
    loadComponent: () =>
      import('./02-core-features/contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
    title: 'Contact Form',
  },
  {
    path: 'registration-form',
    loadComponent: () =>
      import(
        './02-core-features/registration-form/registration-form.component'
      ).then((m) => m.RegistrationFormComponent),
    title: 'Registration Form Example',
  },
  {
    path: 'profile-form',
    loadComponent: () =>
      import('./02-core-features/profile-form/profile-form.component').then(
        (m) => m.ProfileFormComponent,
      ),
    title: 'Profile Form',
  },
  {
    path: 'business-hours-form',
    loadComponent: () =>
      import(
        './02-core-features/business-hours-form/business-hours-form.component'
      ).then((m) => m.BusinessHoursFormComponent),
    title: 'Business Hours Form',
  },
  {
    path: 'survey-form',
    loadComponent: () =>
      import('./02-core-features/survey-form/survey-form.component').then(
        (m) => m.SurveyFormComponent,
      ),
    title: 'Survey Form',
  },
  {
    path: 'async-validation-form',
    loadComponent: () =>
      import(
        './02-core-features/async-validation-form/async-validation-form.component'
      ).then((m) => m.AsyncValidationFormComponent),
    title: 'Async Validation Form',
  },
  {
    path: 'control-wrapper-simple',
    loadComponent: () =>
      import(
        './03-control-wrapper/control-wrapper-basics/control-wrapper-basics.component'
      ).then((m) => m.ControlWrapperBasicsComponent),
    title: 'Simple (Control Wrapper)',
  },
  {
    path: 'control-wrapper-registration',
    loadComponent: () =>
      import(
        './03-control-wrapper/registration-with-wrapper/registration-with-wrapper.component'
      ).then((m) => m.RegistrationWithWrapperComponent),
    title: 'Registration (Control Wrapper)',
  },
  {
    path: 'zod-schema-form',
    loadComponent: () =>
      import(
        './04-schema-integration/zod-schema-form/zod-schema-form.component'
      ).then((m) => m.ZodSchemaFormComponent),
    title: 'Zod Schema Form',
  },
  {
    path: 'valibot-schema-form',
    loadComponent: () =>
      import(
        './04-schema-integration/valibot-schema-form/valibot-schema-form.component'
      ).then((m) => m.ValibotSchemaFormComponent),
    title: 'Valibot Schema Form',
  },
  {
    path: 'custom-schema-form',
    loadComponent: () =>
      import(
        './04-schema-integration/custom-schema-form/custom-schema-form.component'
      ).then((m) => m.CustomSchemaFormComponent),
    title: 'Custom Schema Form',
  },
  {
    path: 'phone-numbers-form',
    loadComponent: () =>
      import(
        './05-smart-state/phone-numbers-form/phone-numbers-form.component'
      ).then((m) => m.PhoneNumbersFormComponent),
    title: 'Phone Numbers Form',
  },
  {
    path: 'smart-profile-form',
    loadComponent: () =>
      import(
        './05-smart-state/smart-profile-form/smart-profile-form.component'
      ).then((m) => m.SmartProfileFormComponent),
    title: 'Smart Profile Form',
  },
  {
    path: 'purchase-form',
    loadComponent: () =>
      import(
        './06-advanced-patterns/purchase-form/purchase-form.component'
      ).then((m) => m.PurchaseFormComponent),
    title: 'Purchase Form',
  },
  {
    path: 'wizard-form',
    loadComponent: () =>
      import('./06-advanced-patterns/wizard-form/wizard-form.component').then(
        (m) => m.WizardFormComponent,
      ),
    title: 'Wizard Form',
  },
  {
    path: 'arktype-schema-form',
    loadComponent: () =>
      import(
        './04-schema-integration/arktype-schema-form/arktype-schema-form.component'
      ).then((m) => m.ArkTypeSchemaFormComponent),
    title: 'ArkType Schema Form',
  },
  {
    path: 'migration-example',
    loadComponent: () =>
      import(
        './04-schema-integration/migration-example/migration-example.component'
      ).then((m) => m.MigrationExampleComponent),
    title: 'Migration Example',
  },
  {
    path: 'basic-smart-state',
    loadComponent: () =>
      import(
        './05-smart-state/basic-smart-state/basic-smart-state.component'
      ).then((m) => m.BasicSmartStateComponent),
    title: 'Basic Smart State',
  },
  {
    path: 'realtime-sync',
    loadComponent: () =>
      import('./05-smart-state/realtime-sync/realtime-sync.component').then(
        (m) => m.RealtimeSyncComponent,
      ),
    title: 'Realtime Sync',
  },
  {
    path: 'nested-arrays',
    loadComponent: () =>
      import(
        './06-advanced-patterns/nested-arrays/nested-arrays.component'
      ).then((m) => m.NestedArraysComponent),
    title: 'Nested Arrays',
  },
  {
    path: 'dynamic-forms',
    loadComponent: () =>
      import(
        './06-advanced-patterns/dynamic-forms/dynamic-forms.component'
      ).then((m) => m.DynamicFormsComponent),
    title: 'Dynamic Forms',
  },
  {
    path: 'custom-wrapper',
    loadComponent: () =>
      import(
        './06-advanced-patterns/custom-wrapper/custom-wrapper.component'
      ).then((m) => m.CustomWrapperComponent),
    title: 'Custom Wrapper',
  },
];
