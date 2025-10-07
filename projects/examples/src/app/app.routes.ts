import { Routes } from '@angular/router';

// Simplified routes focusing on fundamentals only
// Other examples are temporarily moved to _backup/ folder for progressive restoration

export const appRoutes: Routes = [
  { path: '', redirectTo: 'fundamentals/minimal-form', pathMatch: 'full' },
  {
    path: 'fundamentals',
    children: [
      { path: '', redirectTo: 'minimal-form', pathMatch: 'full' },
      {
        path: 'minimal-form',
        loadComponent: () =>
          import('./01-fundamentals/minimal-form/minimal-form.page').then(
            (m) => m.MinimalFormPage,
          ),
        title: 'Minimal Form',
      },
      {
        path: 'basic-validation',
        loadComponent: () =>
          import(
            './01-fundamentals/basic-validation/basic-validation.page'
          ).then((m) => m.BasicValidationPage),
        title: 'Basic Validation - Foundation',
      },
      {
        path: 'error-display-modes',
        loadComponent: () =>
          import(
            './01-fundamentals/error-display-modes/error-display-modes.page'
          ).then((m) => m.ErrorDisplayModesPageComponent),
        title: 'Error Display Modes - Interactive Demo',
      },
      {
        path: 'form-arrays',
        loadComponent: () =>
          import(
            './01-fundamentals/example-form-array/example-form-array.page'
          ).then((m) => m.FormArrayPage),
        title: 'Form Arrays - Dynamic Collections',
      },
      {
        path: 'nested-forms',
        loadComponent: () =>
          import(
            './01-fundamentals/example-form-nested/example-form-nested.page'
          ).then((m) => m.NestedFormPage),
        title: 'Nested Forms - Multi-Section',
      },
    ],
  },

  {
    path: 'form-field',
    children: [
      { path: '', redirectTo: 'form-field-showcase', pathMatch: 'full' },
      {
        path: 'form-field-showcase',
        loadComponent: () =>
          import(
            './02-form-field/form-field-showcase/form-field-showcase.page'
          ).then((m) => m.FormFieldShowcasePage),
        title: 'Form Field Showcase - NgxVestFormField',
      },
    ],
  },

  // Fallback routes
  { path: '**', redirectTo: 'fundamentals/minimal-form' },
];
