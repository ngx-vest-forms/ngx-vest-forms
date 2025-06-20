import { InjectionToken } from '@angular/core';

/**
 * Defines the available modes for displaying validation errors.
 * - 'on-blur': Errors are displayed when the control is blurred (touched).
 * - 'on-submit': Errors are displayed when the form is submitted.
 * - 'on-blur-or-submit': Errors are displayed when the control is blurred (touched) or the form is submitted.
 */
export type ErrorDisplayMode = 'on-blur' | 'on-submit' | 'on-blur-or-submit';

/**
 * Injection token for configuring the default error display mode for ngx-vest-forms components/directives
 * that handle error visibility.
 *
 * The default value is 'on-blur-or-submit'. This token can be used to provide a different
 * error display mode at the application or module level.
 */
export const ERROR_DISPLAY_MODE_DEFAULT = new InjectionToken<ErrorDisplayMode>(
  'Default error display mode for ngx-vest-forms error display handling',
  { providedIn: 'root', factory: () => 'on-blur-or-submit' },
);
