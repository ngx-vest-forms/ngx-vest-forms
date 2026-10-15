import {
  computed,
  inject,
  InjectionToken,
  isSignal,
  Signal,
} from '@angular/core';

/**
 * Text, or a signal of text, for the pending message that
 * `<ngx-control-wrapper>` and `<ngx-form-group-wrapper>` show while async
 * validation runs. A signal lets the label follow a runtime language switch.
 */
export type NgxPendingLabel = string | Signal<string>;

/**
 * Injection token for the pending ("Validating…") message the built-in
 * wrappers render. Defaults to `'Validating…'`.
 *
 * Provide it at the application level to translate the label, or on a
 * component to change it for the wrappers in that component's view. Custom
 * wrappers read it through `FormErrorControlDirective.pendingLabel`.
 *
 * @example Translate with `$localize`
 * ```ts
 * import { NGX_PENDING_LABEL } from 'ngx-vest-forms';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     { provide: NGX_PENDING_LABEL, useValue: $localize`Validating…` },
 *   ],
 * };
 * ```
 *
 * @example Follow a runtime language switch
 * ```ts
 * {
 *   provide: NGX_PENDING_LABEL,
 *   useFactory: () => {
 *     const i18n = inject(TranslationService);
 *     return computed(() => i18n.translate('form.validating'));
 *   },
 * }
 * ```
 */
export const NGX_PENDING_LABEL = new InjectionToken<NgxPendingLabel>(
  'NGX_PENDING_LABEL',
  {
    providedIn: 'root',
    factory: () => 'Validating…',
  }
);

/**
 * @internal Injects {@link NGX_PENDING_LABEL} as a `Signal<string>`.
 * Must run in an injection context.
 */
export function injectPendingLabel(): Signal<string> {
  const label = inject(NGX_PENDING_LABEL);
  return isSignal(label) ? computed(() => label()) : computed(() => label);
}
