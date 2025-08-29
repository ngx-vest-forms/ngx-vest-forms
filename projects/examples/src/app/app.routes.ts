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
    ],
  },

  // Fallback routes
  { path: '**', redirectTo: 'fundamentals/minimal-form' },
];

// Legacy route redirects for backwards compatibility
// TODO: Remove these once all examples are restored
export const legacyRoutes: Routes = [
  // Old flat route redirects
  {
    path: '01-fundamentals/minimal-form',
    redirectTo: 'fundamentals/minimal-form',
  },
  {
    path: '01-fundamentals/basic-validation',
    redirectTo: 'fundamentals/basic-validation',
  },
  {
    path: '01-fundamentals/error-display-modes',
    redirectTo: 'fundamentals/error-display-modes',
  },
];
