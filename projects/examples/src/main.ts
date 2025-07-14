import { provideHttpClient } from '@angular/common/http';
import '@angular/compiler'; // Import for JIT compiler support
import {
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
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
    redirectTo: 'contact',
    pathMatch: 'full',
  },
  {
    path: 'contact',
    loadComponent: () =>
      import(
        './app/01-getting-started/contact-form/contact-form.component'
      ).then((m) => m.ContactFormComponent),
  },
  /*
  {
    path: 'purchase',
    loadComponent: () =>
      import('./app/05-complex-integrations/purchase-form/purchase-form.component').then(
        (m) => m.PurchaseFormComponent,
      ),
  },
  {
    path: 'business-hours',
    loadComponent: () =>
      import('./app/02-standard-forms/business-hours-form/business-hours-form.component').then(
        (m) => m.BusinessHoursFormComponent,
      ),
  },
  */
  /*
  {
    path: 'business-hours-zod',
    loadComponent: () =>
      import('./app/02-standard-forms/business-hours-form/business-hours-form.zod-example').then(
        (m) => m.BusinessHoursFormZodExampleComponent,
      ),
  },
  {
    path: 'contact-form',
    loadComponent: () =>
      import('./app/01-getting-started/contact-form/contact-form.component').then(
        (m) => m.ContactFormComponent,
      ),
  },
  */
  /*
  {
    path: 'cyclic-dependencies-form',
    loadComponent: () =>
      import(
        './app/backup-old-examples/cyclic-dependencies-form/cyclic-dependencies-form.component'
      ).then((m) => m.CyclicDependenciesFormComponent),
    title: 'Cyclic Dependencies Form Example',
  },
  */
];
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(),
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),
  ],
});
