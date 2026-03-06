import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';
import { mockPeopleApiInterceptor } from './app/services/mock-people-api.interceptor';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'purchase',
    pathMatch: 'full',
  },
  {
    path: 'purchase',
    loadComponent: () =>
      import('./app/pages/purchase-form/purchase.page').then(
        (m) => m.PurchasePageComponent
      ),
    data: {
      title: 'Purchase Form',
      subtitle:
        'Complete a full checkout flow with conditional and cross-field validation.',
    },
  },
  {
    path: 'business-hours',
    loadComponent: () =>
      import('./app/pages/business-hours-form/business-hours.page').then(
        (m) => m.BusinessHoursPageComponent
      ),
    data: {
      title: 'Business Hours Form',
      subtitle:
        'Validate dynamic time ranges with cross-field and form-level rules.',
    },
  },
  {
    path: 'validation-config-demo',
    loadComponent: () =>
      import('./app/pages/validation-config-demo/validation-config-demo.page').then(
        (m) => m.ValidationConfigDemoPageComponent
      ),
    data: {
      title: 'Validation Config Demo',
      subtitle:
        'Explore dependency-aware revalidation patterns with a configuration map.',
    },
  },
  {
    path: 'wizard',
    loadComponent: () =>
      import('./app/pages/wizard-form/wizard-form.page').then(
        (m) => m.WizardFormPageComponent
      ),
    data: {
      title: 'Multi-Form Wizard',
      subtitle:
        'Run three coordinated forms with per-step validation and one final submission flow.',
    },
  },
  {
    path: 'display-modes-demo',
    loadComponent: () =>
      import('./app/pages/display-modes-demo/display-modes-demo.page').then(
        (m) => m.DisplayModesDemoPageComponent
      ),
    data: {
      title: 'Display Modes Demo',
      subtitle:
        'Compare error and warning visibility timing across display modes.',
    },
  },
  {
    path: 'zod-schema-demo',
    loadComponent: () =>
      import('./app/pages/zod-schema-demo/zod-schema-demo.page').then(
        (m) => m.ZodSchemaDemoPageComponent
      ),
    data: {
      title: 'Zod Schema Demo',
      subtitle:
        'Combine Zod structural validation with Vest per-field business rules via Standard Schema.',
    },
  },
];
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([mockPeopleApiInterceptor])),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    // Global configuration for validation config debounce timing
    // Using 150ms instead of default 100ms to reduce validation frequency during rapid typing
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
    },
  ],
});
