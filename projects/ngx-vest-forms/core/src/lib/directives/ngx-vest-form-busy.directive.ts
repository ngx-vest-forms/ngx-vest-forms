import { computed, Directive, inject, type Signal } from '@angular/core';
import { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from '../tokens';
import type { VestForm } from '../vest-form.types';

/**
 * Automatically applies `aria-busy` attribute to form elements based on validation state.
 *
 * This directive eliminates the need for manual `[attr.aria-busy]` bindings on form elements.
 * It automatically sets `aria-busy="true"` when the form is processing async validation or
 * submitting, improving accessibility for screen reader users.
 *
 * ## Features
 *
 * - **Auto-Application**: Applies to all `<form>` elements with `NGX_VEST_FORM` provider
 * - **WCAG 2.2 Compliant**: Uses string `"true"` per ARIA spec (not boolean)
 * - **Reactive**: Updates automatically via computed signal
 * - **Opt-Out Mechanism**: Use `ngxVestFormBusyDisabled` attribute to exclude specific forms
 * - **Global Configuration**: Configure behavior via `provideNgxVestFormsConfig()`
 *
 * ## Usage
 *
 * ### Basic Usage (Zero Configuration)
 *
 * ```typescript
 * import { Component, signal } from '@angular/core';
 * import { createVestForm, NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms], // Includes form-busy directive
 *   template: `
 *     <form (submit)="onSubmit($event)">
 *       <!-- aria-busy automatically managed -->
 *       <input [value]="form.email()" (input)="form.setEmail($event)" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   form = createVestForm(suite, signal({ email: '' }));
 *   async onSubmit(e: Event) {
 *     e.preventDefault();
 *     await this.form.submit(); // aria-busy="true" while submitting
 *   }
 * }
 * ```
 *
 * ### Opt-Out Mechanism
 *
 * ```html
 * <!-- Exclude specific forms from auto aria-busy -->
 * <form ngxVestFormBusyDisabled (submit)="onSubmit($event)">
 *   <!-- Manual aria-busy management -->
 * </form>
 * ```
 *
 * ### Global Configuration
 *
 * The NgxVestFormBusyDirective respects the global configuration provided via `provideNgxVestFormsConfig()`.
 *
 * **Default Configuration Values:**
 * - `autoFormBusy: true` - Directive enabled globally
 * - `autoTouch: true` - Auto-touch directive enabled
 * - `autoAria: true` - Auto-ARIA directive enabled
 * - `debug: false` - Debug logging disabled
 *
 * ```typescript
 * // app.config.ts
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoFormBusy: true, // Enable/disable globally (default: true)
 *       debug: false, // Enable debug logging (default: false)
 *     })
 *   ]
 * };
 * ```
 *
 * **Global Disable Example:**
 * ```typescript
 * // Disable all automatic form aria-busy attributes
 * provideNgxVestFormsConfig({ autoFormBusy: false })
 * ```
 *
 * ## ARIA Attribute Behavior
 *
 * ### aria-busy
 *
 * - Set to `"true"` (string) when form is processing or submitting
 * - Removed (null) when form is idle
 * - Uses string `"true"` per ARIA spec (not boolean `true`)
 *
 * **Triggered when:**
 * - `form.pending()` returns `true` (async validation in progress)
 * - `form.submitting()` returns `true` (form submission in progress)
 *
 * ## How It Works
 *
 * 1. Directive applies to all `<form>` elements (unless opted out)
 * 2. Injects `NGX_VEST_FORM` from parent component's DI tree
 * 3. Creates computed signal watching `pending()` and `submitting()`
 * 4. Updates `aria-busy` attribute reactively via host binding
 *
 * ## WCAG 2.2 Compliance
 *
 * This directive helps meet:
 * - **WCAG 4.1.3 Status Messages (Level AA)**: Informs users of async operations
 * - **ARIA 1.2 aria-busy**: Indicates elements are being updated
 *
 * @example With NgxVestForms Bundle
 * ```typescript
 * import { NgxVestForms } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestForms], // All directives + components
 *   template: `
 *     <form (submit)="onSubmit($event)">
 *       <input [value]="form.email()" (input)="form.setEmail($event)" />
 *       <ngx-form-error [field]="form.emailField()" />
 *       <button type="submit">Submit</button>
 *     </form>
 *   `
 * })
 * ```
 *
 * @example With Async Validation
 * ```typescript
 * const suite = createSafeSuite((data) => {
 *   test.memo('email', 'Email taken', async ({ signal }) => {
 *     await checkEmail(data.email, { signal }); // aria-busy="true" while running
 *   }, [data.email]);
 * });
 * ```
 *
 * @example Separate Import (Without Bundle)
 * ```typescript
 * import { NgxVestFormBusyDirective } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestFormBusyDirective],
 *   template: `<form>...</form>` // Auto aria-busy
 * })
 * ```
 *
 * @see {@link NgxVestAutoAriaDirective} - Auto ARIA for form controls
 * @see {@link NgxVestAutoTouchDirective} - Auto touch detection
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-busy - ARIA spec
 * @see https://www.w3.org/WAI/WCAG22/Understanding/status-messages - WCAG 4.1.3
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'form:not([ngxVestFormBusyDisabled])',
  standalone: true,
  host: {
    '[attr.aria-busy]': 'ariaBusy()',
  },
})
export class NgxVestFormBusyDirective {
  /**
   * Inject the VestForm instance from the parent component's DI tree.
   * This is provided by createVestForm() via NGX_VEST_FORM token.
   */
  readonly #form = inject<VestForm<Record<string, unknown>>>(NGX_VEST_FORM, {
    optional: true,
  });

  /**
   * Inject global configuration to check if directive is enabled.
   */
  readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });

  /**
   * Reactive computed signal that determines if the directive should be active.
   * Only active when:
   * 1. Form instance is available
   * 2. Global config allows auto-form-busy (not explicitly disabled)
   */
  readonly #isActive = computed(() => {
    if (!this.#form) {
      return false; // No form context - directive inactive
    }
    if (this.#globalConfig?.autoFormBusy === false) {
      return false; // Globally disabled via config
    }
    return true; // Active when form exists and not disabled
  });

  /**
   * Computed signal for aria-busy attribute.
   *
   * IMPORTANT: Returns 'true' (string) not true (boolean) per ARIA spec.
   * Angular's [attr.aria-busy] binding will:
   * - Set attribute to "true" when signal returns 'true'
   * - Remove attribute entirely when signal returns null
   *
   * @returns 'true' when form is processing, null otherwise
   */
  protected readonly ariaBusy: Signal<'true' | null> = computed(() => {
    if (!this.#isActive() || !this.#form) {
      return null; // Directive disabled or no form
    }

    const isPending = this.#form.pending();
    const isSubmitting = this.#form.submitting();

    return isPending || isSubmitting ? 'true' : null;
  });
}
