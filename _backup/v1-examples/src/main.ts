import { provideHttpClient } from '@angular/common/http';
import {
  importProvidersFrom,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withEnabledBlockingInitialNavigation,
  withViewTransitions,
} from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

// Ensure JIT compiler is available in dev server (Angular Vite builder) for components
// that rely on templateUrl/styleUrls during E2E and local dev.
// Use isDevMode() to avoid importing the compiler in production builds.
try {
  if (isDevMode()) {
    await import('@angular/compiler');
  }
} catch {
  // Ignore if not available; production builds don’t need it
}

await bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    importProvidersFrom(),
    provideHttpClient(),
    provideEnvironmentNgxMask({ validation: false }),
    provideRouter(
      appRoutes,
      withEnabledBlockingInitialNavigation(),
      withComponentInputBinding(),
      withViewTransitions(),
    ),
  ],
});
