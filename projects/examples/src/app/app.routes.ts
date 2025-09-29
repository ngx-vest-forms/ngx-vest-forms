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
        path: 'form-state-demo',
        loadComponent: () =>
          import('./01-fundamentals/form-state-demo/form-state-demo.page').then(
            (m) => m.FormStateDemoPageComponent,
          ),
        title: 'Form State Demo - Real-time Monitoring',
      },
    ],
  },
  {
    path: 'mini-vest',
    children: [
      { path: '', redirectTo: 'simple', pathMatch: 'full' },
      {
        path: 'simple',
        loadComponent: () =>
          import('./mini-vest/example-form-simple/example-form-simple').then(
            (m) => m.ExampleFormSimple,
          ),
        title: 'Mini Vest - Simple Form',
      },
      {
        path: 'array',
        loadComponent: () =>
          import('./mini-vest/example-form-array/example-form-array').then(
            (m) => m.ExampleFormArray,
          ),
        title: 'Mini Vest - Array Form',
      },
      {
        path: 'nested',
        loadComponent: () =>
          import('./mini-vest/example-form-nested/example-form-nested').then(
            (m) => m.ExampleFormNested,
          ),
        title: 'Mini Vest - Nested Form',
      },
    ],
  },

  // Fallback routes
  { path: '**', redirectTo: 'fundamentals/minimal-form' },
];
