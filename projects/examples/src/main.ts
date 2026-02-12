import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';
import { BusinessHoursFormComponent } from './app/pages/business-hours-form/business-hours-form.component';
import { DisplayModesDemoComponent } from './app/pages/display-modes-demo/display-modes-demo.component';
import { PurchaseFormComponent } from './app/pages/purchase-form/purchase-form.component';
import { ValidationConfigDemoComponent } from './app/pages/validation-config-demo/validation-config-demo.component';
import { WizardFormComponent } from './app/pages/wizard-form/wizard-form.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'purchase',
    pathMatch: 'full',
  },
  {
    path: 'purchase',
    component: PurchaseFormComponent,
  },
  {
    path: 'business-hours',
    component: BusinessHoursFormComponent,
  },
  {
    path: 'validation-config-demo',
    component: ValidationConfigDemoComponent,
  },
  {
    path: 'wizard',
    component: WizardFormComponent,
  },
  {
    path: 'display-modes-demo',
    component: DisplayModesDemoComponent,
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
