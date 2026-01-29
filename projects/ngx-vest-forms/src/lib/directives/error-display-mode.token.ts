import { InjectionToken } from '@angular/core';
import {
  NgxWarningDisplayMode,
  ScErrorDisplayMode,
} from './form-error-display.directive';

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
 * Values:
 * - 'on-blur': Show errors after field is touched/blurred
 * - 'on-submit': Show errors after form submission
 * - 'on-blur-or-submit': Show errors after blur or form submission (default)
 * - 'on-dirty': Show errors as soon as the field value changes
 * - 'always': Show errors immediately, even on pristine fields
 */
export const NGX_ERROR_DISPLAY_MODE_TOKEN =
  new InjectionToken<ScErrorDisplayMode>('NGX_ERROR_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-blur-or-submit',
  });

/**
 * Injection token for configuring the default warning display mode.
 * Values:
 * - 'on-touch': Show warnings after field is touched/blurred
 * - 'on-validated-or-touch': Show warnings after validation runs or field is touched (default)
 * - 'on-dirty': Show warnings as soon as the field value changes
 * - 'always': Show warnings immediately, even on pristine fields
 */
export const NGX_WARNING_DISPLAY_MODE_TOKEN =
  new InjectionToken<NgxWarningDisplayMode>('NGX_WARNING_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-validated-or-touch',
  });
