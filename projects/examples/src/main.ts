import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
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
  ],
});
