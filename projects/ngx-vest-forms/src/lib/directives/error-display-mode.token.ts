import { InjectionToken } from '@angular/core';
import { ScErrorDisplayMode } from './form-error-display.directive';

export const SC_ERROR_DISPLAY_MODE_TOKEN =
  new InjectionToken<ScErrorDisplayMode>('SC_ERROR_DISPLAY_MODE_TOKEN', {
    providedIn: 'root',
    factory: () => 'on-blur-or-submit',
  });
