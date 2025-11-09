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
];
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
    // Global configuration for validation config debounce timing
    // Default is 100ms - this example shows how to configure it globally
    { provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN, useValue: 150 },
  ],
});
