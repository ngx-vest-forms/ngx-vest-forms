import { InjectionToken } from '@angular/core';
import type {
  NgxErrorDisplayMode,
  NgxWarningDisplayMode,
} from './form-error-display.directive';

/**
 * Injection token for configuring the default error display mode.
 * Values:
 * - 'on-blur-or-submit': Show errors after blur or form submission (default)
 * - 'on-blur': Deprecated alias for `'on-blur-or-submit'` (opens on blur or form
 *   submission; scheduled for removal in v4)
 * - 'on-submit': Show errors after form submission
 * - 'on-dirty': Show errors as soon as the field value changes, or after touch/submit
 * - 'always': Show errors immediately, even on pristine fields
 */
export const NGX_ERROR_DISPLAY_MODE_TOKEN =
  new InjectionToken<NgxErrorDisplayMode>('NGX_ERROR_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-blur-or-submit',
  });

/**
 * Injection token for configuring the default warning display mode.
 * Values:
 * - 'on-validated-or-touch': Show warnings after validation runs, touch, or form submission (default)
 * - 'on-touch': Show warnings after field is touched/blurred or the form is submitted
 * - 'on-dirty': Show warnings as soon as the field value changes, or after touch/submit
 * - 'always': Show warnings immediately, even on pristine fields
 */
export const NGX_WARNING_DISPLAY_MODE_TOKEN =
  new InjectionToken<NgxWarningDisplayMode>('NGX_WARNING_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-validated-or-touch',
  });
