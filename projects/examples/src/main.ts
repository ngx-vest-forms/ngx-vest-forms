import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';
import { BusinessHoursPageComponent } from './app/pages/business-hours-form/business-hours.page';
import { DisplayModesDemoPageComponent } from './app/pages/display-modes-demo/display-modes-demo.page';
import { PurchasePageComponent } from './app/pages/purchase-form/purchase.page';
import { ValidationConfigDemoPageComponent } from './app/pages/validation-config-demo/validation-config-demo.page';
import { WizardFormPageComponent } from './app/pages/wizard-form/wizard-form.page';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'purchase',
    pathMatch: 'full',
  },
  {
    path: 'purchase',
    component: PurchasePageComponent,
    data: {
      title: 'Purchase Form',
      subtitle:
        'Complete a full checkout flow with conditional and cross-field validation.',
    },
  },
  {
    path: 'business-hours',
    component: BusinessHoursPageComponent,
    data: {
      title: 'Business Hours Form',
      subtitle:
        'Validate dynamic time ranges with cross-field and form-level rules.',
    },
  },
  {
    path: 'validation-config-demo',
    component: ValidationConfigDemoPageComponent,
    data: {
      title: 'Validation Config Demo',
      subtitle:
        'Explore dependency-aware revalidation patterns with a configuration map.',
    },
  },
  {
    path: 'wizard',
    component: WizardFormPageComponent,
    data: {
      title: 'Multi-Form Wizard',
      subtitle:
        'Run three coordinated forms with per-step validation and one final submission flow.',
    },
  },
  {
    path: 'display-modes-demo',
    component: DisplayModesDemoPageComponent,
    data: {
      title: 'Display Modes Demo',
      subtitle:
        'Compare error and warning visibility timing across display modes.',
    },
  },
];
bootstrapApplication(AppComponent, {
  providers: [
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    // Global configuration for validation config debounce timing
    // Using 150ms instead of default 100ms to reduce validation frequency during rapid typing
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 150 },
  ],
});
