import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withEnabledBlockingInitialNavigation,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import {
  NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
  NGX_VALIDATION_DEBOUNCE_PRESETS,
} from 'ngx-vest-forms';
import { AppComponent } from './app/app.component';
import { mockPeopleApiInterceptor } from './app/services/mock-people-api.interceptor';
import { toAppRoutes } from './app/shared/routes.metadata';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([mockPeopleApiInterceptor])),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(toAppRoutes(), withEnabledBlockingInitialNavigation()),
    // Global configuration for validation config debounce timing.
    // Using the relaxed preset reduces validation frequency during rapid typing.
    {
      provide: NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN,
      useValue: NGX_VALIDATION_DEBOUNCE_PRESETS.relaxed,
    },
  ],
});
