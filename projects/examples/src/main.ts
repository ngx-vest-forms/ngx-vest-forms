import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';
import { BusinessHoursFormComponent } from './app/components/smart/business-hours-form/business-hours-form.component';
import { PurchaseFormComponent } from './app/components/smart/purchase-form/purchase-form.component';
import { ValidationConfigDemoComponent } from './app/components/smart/validation-config-demo/validation-config-demo.component';

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
];
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    // Global configuration for validation config debounce timing
    // Using 150ms instead of default 100ms to reduce validation frequency during rapid typing
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 150 },
  ],
});
