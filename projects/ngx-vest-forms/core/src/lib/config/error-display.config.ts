import { InjectionToken } from '@angular/core';

/**
 * Error display modes (blocking validation messages). Intentionally *does not* include 'on-change'.
 * Progressive live feedback is now controlled separately via NgxWarningDisplayMode.
 */
export type NgxErrorDisplayMode = 'on-blur' | 'on-submit' | 'on-blur-or-submit';

/**
 * Warning display modes (non-blocking guidance).
 * - 'on-change': Show warnings while typing (debounced) for progressive feedback
 * - 'on-blur': Conservative approach, warnings only after field loses focus
 */
export type NgxWarningDisplayMode = 'on-change' | 'on-blur';

/**
 * Injection token for configuring the default error display mode for ngx-vest-forms components/directives
 * that handle error visibility.
 *
 * The default value is 'on-blur-or-submit'. This token can be used to provide a different
 * error display mode at the application or module level.
 */
export const NGX_ERROR_DISPLAY_MODE_DEFAULT =
  new InjectionToken<NgxErrorDisplayMode>(
    'Default error display mode for ngx-vest-forms error display handling',
    { providedIn: 'root', factory: () => 'on-blur-or-submit' },
  );

/**
 * Injection token configuring the default warning display mode. Defaults to 'on-change'.
 */
export const NGX_WARNING_DISPLAY_MODE_DEFAULT =
  new InjectionToken<NgxWarningDisplayMode>(
    'Default warning display mode for ngx-vest-forms warning display handling',
    { providedIn: 'root', factory: () => 'on-change' },
  );

/**
 * Debounce time (ms) used when warningDisplayMode is 'on-change' for live warning display.
 * Keep small to feel responsive but large enough to avoid flicker (150–250ms typical).
 */
export const NGX_ON_CHANGE_WARNING_DEBOUNCE = new InjectionToken<number>(
  'Debounce time for on-change warning visibility',
  { providedIn: 'root', factory: () => 180 },
);
