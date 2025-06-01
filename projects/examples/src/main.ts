import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  Routes,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { AppComponent } from './app/app.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'purchase',
    pathMatch: 'full',
  },
  {
    path: 'purchase',
    loadComponent: () =>
      import('./app/purchase-form/purchase-form.component').then(
        (m) => m.PurchaseFormComponent,
      ),
  },
  {
    path: 'business-hours',
    loadComponent: () =>
      import('./app/business-hours-form/business-hours-form.component').then(
        (m) => m.BusinessHoursFormComponent,
      ),
  },
  {
    path: 'business-hours-zod',
    loadComponent: () =>
      import('./app/business-hours-form/business-hours-form.zod-example').then(
        (m) => m.BusinessHoursFormZodExampleComponent,
      ),
  },
  {
    path: 'contact-form',
    loadComponent: () =>
      import('./app/contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
  },
  {
    path: 'cyclic-dependencies-form',
    loadComponent: () =>
      import(
        './app/cyclic-dependencies-form/cyclic-dependencies-form.component'
      ).then((m) => m.CyclicDependenciesFormComponent),
    title: 'Cyclic Dependencies Form Example',
  },
];
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
  ],
});
