/**
 * Provider functions for ngx-vest-forms configuration
 * @module providers
 */

import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import {
  NGX_VEST_FORM,
  NGX_VEST_FORMS_CONFIG,
  type NgxVestFormsConfig,
} from './tokens';

/**
 * Provide global ngx-vest-forms configuration.
 *
 * Use this function in `app.config.ts` to configure ngx-vest-forms behavior
 * across your entire application, or in component providers to override
 * configuration for a specific component tree.
 *
 * @param config - Partial configuration object (all properties optional)
 * @returns Environment providers for the configuration
 *
 * @example App-wide configuration
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: true,
 *       debug: true,
 *       defaultErrorStrategy: 'on-touch'
 *     })
 *   ]
 * };
 * ```
 *
 * @example Component-level override
 * ```typescript
 * import { Component } from '@angular/core';
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   selector: 'app-special-form',
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: false, // Disable auto-touch for this component tree
 *       debug: true
 *     })
 *   ],
 *   template: `...`
 * })
 * export class SpecialFormComponent {
 *   // This component and its children will use the overridden config
 * }
 * ```
 *
 * @example Custom field name resolver
 * ```typescript
 * provideNgxVestFormsConfig({
 *   fieldNameResolver: (element) => {
 *     // Custom logic: extract from formControlName attribute
 *     const formControlName = element.getAttribute('formControlName');
 *     if (formControlName) {
 *       return formControlName;
 *     }
 *
 *     // Custom logic: extract from data-field attribute
 *     const dataField = element.getAttribute('data-field');
 *     if (dataField) {
 *       return dataField;
 *     }
 *
 *     // Return null to continue with default extraction (id, name)
 *     return null;
 *   }
 * })
 * ```
 */
export function provideNgxVestFormsConfig(
  config: Partial<NgxVestFormsConfig>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_VEST_FORMS_CONFIG, useValue: config },
  ]);
}

/**
 * Provide a Vest form instance to child directives (NgxVestAutoTouch, NgxVestAutoAria).
 *
 * This helper simplifies the provider boilerplate required for auto-directives to discover
 * their parent form context. Instead of manually writing the factory pattern, use this
 * function to reduce code and improve maintainability.
 *
 * ## When to use
 *
 * **Required** when using auto-directives:
 * - `NgxVestAutoTouch` - Automatic blur-to-touch detection
 * - `NgxVestAutoAria` - Automatic ARIA attribute management
 *
 * **Optional** when using manual patterns:
 * - Explicit `(blur)="form.touchField()"` handlers
 * - Manual `[attr.aria-invalid]` bindings
 * - `<ngx-form-error [field]="form.field()">` with input binding
 *
 * @param formFactory - Function that returns the form instance (usually a component property)
 * @returns View providers array ready for `@Component({ viewProviders: [...] })`
 *
 * @example Basic usage
 * ```typescript
 * import { Component, signal } from '@angular/core';
 * import { createVestForm, provideVestForm } from 'ngx-vest-forms/core';
 * import { userValidations } from './user.validations';
 *
 * @Component({
 *   selector: 'app-user-form',
 *   viewProviders: provideVestForm((self: UserFormComponent) => self.form),
 *   template: `
 *     <form>
 *       <!-- Auto-touch and auto-ARIA work automatically -->
 *       <input id="email" [value]="form.email()" (input)="form.setEmail($event)" />
 *       <ngx-form-error [field]="form.emailField()" />
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   readonly form = createVestForm(userValidations, signal({ email: '' }));
 * }
 * ```
 *
 * @example Without auto-directives (provider not needed)
 * ```typescript
 * @Component({
 *   selector: 'app-manual-form',
 *   // No viewProviders needed - everything is explicit
 *   template: `
 *     <form>
 *       <input
 *         id="email"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *         (blur)="form.touchEmail()"
 *         [attr.aria-invalid]="form.emailShowErrors() && !form.emailValid()"
 *       />
 *       @if (form.emailShowErrors() && form.emailErrors().length) {
 *         <span role="alert">{{ form.emailErrors()[0] }}</span>
 *       }
 *     </form>
 *   `
 * })
 * export class ManualFormComponent {
 *   readonly form = createVestForm(userValidations, signal({ email: '' }));
 * }
 * ```
 */
export function provideVestForm<T>(formFactory: (component: T) => unknown): {
  provide: unknown;
  useFactory: (component: T) => unknown;
  deps: [new () => T];
}[] {
  return [
    {
      provide: NGX_VEST_FORM,
      useFactory: formFactory,
      deps: [formFactory as never as new () => T],
    },
  ];
}
