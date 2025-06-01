import { InjectionToken } from '@angular/core';

/**
 * Defines the available modes for displaying validation errors in the ControlWrapperComponent.
 * - 'on-blur': Errors are displayed when the control is blurred (touched).
 * - 'on-submit': Errors are displayed when the form is submitted.
 * - 'on-blur-or-submit': Errors are displayed when the control is blurred (touched) or the form is submitted.
 */
export type ErrorDisplayMode = 'on-blur' | 'on-submit' | 'on-blur-or-submit';

/**
 * Injection token for configuring the default error display mode in ControlWrapperComponent.
 *
 * The default value is 'on-blur-or-submit'. This token can be used to provide a different
 * error display mode at the application or module level.
 */
export const CONTROL_WRAPPER_ERROR_DISPLAY =
  new InjectionToken<ErrorDisplayMode>(
    'Default error display mode for ControlWrapperComponent',
    { providedIn: 'root', factory: () => 'on-blur-or-submit' },
  );
