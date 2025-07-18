import { provideHttpClient } from '@angular/common/http';
import '@angular/compiler';
import {
  importProvidersFrom,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(),
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(
      appRoutes,
      withEnabledBlockingInitialNavigation(),
      withComponentInputBinding(),
    ),
  ],
});
