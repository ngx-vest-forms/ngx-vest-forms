import type { Provider } from '@angular/core';
import {
  NGX_ERROR_DISPLAY_MODE_DEFAULT,
  NGX_WARNING_DISPLAY_MODE_DEFAULT,
  type NgxErrorDisplayMode,
  type NgxWarningDisplayMode,
} from './config/error-display.config';
import { NGX_ROOT_FORM } from './utils/form-token';

export type NgxVestFormsCoreOptions = {
  /** Root key used for cross-field/root-level validation bucket */
  rootFormKey?: string;
  /** Default error display mode for error display directive/wrapper */
  errorDisplayMode?: NgxErrorDisplayMode;
  /** Default warning display mode for error display directive/wrapper */
  warningDisplayMode?: NgxWarningDisplayMode;
};

/**
 * Core-level provider factory for configuring ngx-vest-forms defaults.
 * - Thin, tree-shakeable, and scoped to core-only tokens
 * - Use at app/route/component level to override defaults hierarchically
 */
export function provideNgxVestFormsCore(
  options: NgxVestFormsCoreOptions = {},
): Provider[] {
  const providers: Provider[] = [];

  if (options.rootFormKey !== undefined) {
    providers.push({ provide: NGX_ROOT_FORM, useValue: options.rootFormKey });
  }

  if (options.errorDisplayMode !== undefined) {
    providers.push({
      provide: NGX_ERROR_DISPLAY_MODE_DEFAULT,
      useValue: options.errorDisplayMode,
    });
  }

  if (options.warningDisplayMode !== undefined) {
    providers.push({
      provide: NGX_WARNING_DISPLAY_MODE_DEFAULT,
      useValue: options.warningDisplayMode,
    });
  }

  return providers;
}

/** Granular helper for feature composition. */
export function withErrorDisplayMode(mode: NgxErrorDisplayMode): Provider {
  return { provide: NGX_ERROR_DISPLAY_MODE_DEFAULT, useValue: mode };
}

/** Granular helper for configuring default warning display mode. */
export function withWarningDisplayMode(mode: NgxWarningDisplayMode): Provider {
  return { provide: NGX_WARNING_DISPLAY_MODE_DEFAULT, useValue: mode };
}

/** Granular helper to override the root form key. */
export function withRootFormKey(key: string): Provider {
  return { provide: NGX_ROOT_FORM, useValue: key };
}

/**
 * Optional aggregator that simply composes provider arrays without importing optional features.
 * Keeps tree-shaking intact by letting consumers pass providers from other entry points.
 */
export function provideNgxVestForms(...features: Provider[]): Provider[] {
  return features;
}
