import { InjectionToken } from '@angular/core';
import { ScErrorDisplayMode } from './form-error-display.directive';

/**
 * @deprecated Use NGX_ERROR_DISPLAY_MODE_TOKEN instead
 */
export const SC_ERROR_DISPLAY_MODE_TOKEN =
  new InjectionToken<ScErrorDisplayMode>('SC_ERROR_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-blur-or-submit',
  });

/**
 * Injection token for configuring the default error display mode.
 * Values: 'on-blur' | 'on-submit' | 'on-blur-or-submit' (default)
 */
export const NGX_ERROR_DISPLAY_MODE_TOKEN =
  new InjectionToken<ScErrorDisplayMode>('NGX_ERROR_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-blur-or-submit',
  });
