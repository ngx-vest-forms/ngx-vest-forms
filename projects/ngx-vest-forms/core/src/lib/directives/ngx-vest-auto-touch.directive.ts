/**
 * Directive that automatically handles touch state for form controls
 * @module ngx-vest-auto-touch.directive
 */

import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  type OnDestroy,
} from '@angular/core';
import { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from '../tokens';
import { unwrapSignal } from '../utils/type-helpers';
import type { VestForm } from '../vest-form.types';

/**
 * Automatically triggers touch state on blur for form controls with the "on-touch" error display strategy.
 *
 * This directive eliminates the need for manual `(blur)="form.touchFieldName()"` handlers on every
 * input element. It auto-applies to all form controls with `[value]` bindings and automatically
 * handles blur events when the form's error display strategy is set to 'on-touch'.
 *
 * ## Features
 *
 * - **Auto-Application**: Applies to all inputs/textareas/selects with `[value]` binding
 * - **Strategy-Aware**: Only active when `errorStrategy === 'on-touch'`
 * - **Field Name Extraction**: Automatic extraction via 4-tier priority system
 * - **Opt-Out Mechanism**: Use `ngxVestTouchDisabled` attribute to exclude specific fields
 * - **Global Configuration**: Configure behavior via `provideNgxVestFormsConfig()`
 *
 * ## Usage
 *
 * ### Basic Usage (Zero Configuration)
 *
 * ```typescript
 * import { Component } from '@angular/core';
 * import { createVestForm } from 'ngx-vest-forms/core';
 * import { NgxVestAutoTouchDirective } from 'ngx-vest-forms/core';
 *
 * @Component({
 *   imports: [NgxVestAutoTouchDirective],
 *   template: `
 *     <form>
 *       <!-- Auto-touch directive applies automatically -->
 *       <input
 *         id="email"
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *         <!-- No blur handler needed! -->
 *       />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   form = createVestForm(suite, signal({ email: '' }), {
 *     errorStrategy: 'on-touch' // Required for auto-touch to activate
 *   });
 * }
 * ```
 *
 * ### Field Name Extraction Priority
 *
 * The directive extracts field names using a 4-tier priority system:
 *
 * 1. **`data-vest-field` attribute** (highest priority) - For nested paths
 * 2. **Custom resolver** (from global config) - For custom logic
 * 3. **`id` attribute** (WCAG preferred) - Standard forms
 * 4. **`name` attribute** (fallback) - Legacy forms
 *
 * ```html
 * <!-- Priority 1: Explicit nested path -->
 * <input data-vest-field="personalInfo.firstName" [value]="..." />
 *
 * <!-- Priority 3: ID attribute (most common) -->
 * <input id="email" [value]="form.email()" />
 *
 * <!-- Priority 4: Name attribute (fallback) -->
 * <input name="phoneNumber" [value]="form.phoneNumber()" />
 * ```
 *
 * ### Opt-Out Mechanism
 *
 * ```html
 * <!-- Exclude specific fields from auto-touch -->
 * <input
 *   ngxVestTouchDisabled
 *   [value]="form.specialField()"
 *   (blur)="customBlurLogic()"
 * />
 * ```
 *
 * ### Global Configuration
 *
 * ```typescript
 * /// app.config.ts
 * import { provideNgxVestFormsConfig } from 'ngx-vest-forms/core';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: true, // Enable/disable globally
 *       debug: true, // Enable debug logging
 *       fieldNameResolver: (element) => {
 *         /// Custom field name extraction logic
 *         return element.getAttribute('data-field-path');
 *       }
 *     })
 *   ]
 * };
 * ```
 *
 * ## Supported Input Types
 *
 * - ✅ `<input type="text">` with `[value]` binding
 * - ✅ `<input type="email">` with `[value]` binding
 * - ✅ `<input type="number">` with `[value]` binding
 * - ✅ `<input type="range">` with `[value]` binding
 * - ✅ `<textarea>` with `[value]` binding
 * - ✅ `<select>` with `[value]` binding
 * - ❌ `<input type="radio">` with `[checked]` (use `(change)` event instead)
 * - ❌ `<input type="checkbox">` with `[checked]` (use `(change)` event instead)
 *
 * ## Event Binding Compatibility
 *
 * The directive works with **both** `(input)` and `(change)` event bindings:
 *
 * ```html
 * <!-- Pattern 1: Real-time validation with (input) -->
 * <input [value]="form.email()" (input)="form.setEmail($event)" />
 *
 * <!-- Pattern 2: Debounced validation with (change) -->
 * <input [value]="form.email()" (change)="form.setEmail($event)" />
 * ```
 *
 * The selector matches based on `[value]` binding, not event binding, so the blur
 * handler works regardless of which value-change event you use.
 *
 * @example Nested Field Paths
 * ```html
 * <!-- Use data-vest-field for nested paths -->
 * <input
 *   data-vest-field="user.profile.email"
 *   [value]="form.userProfileEmail()"
 *   (input)="form.setUserProfileEmail($event)"
 * />
 * ```
 *
 * @example Component-Level Configuration
 * ```typescript
 * @Component({
 *   providers: [
 *     provideNgxVestFormsConfig({
 *       autoTouch: false // Disable for this component tree
 *     })
 *   ]
 * })
 * export class SpecialFormComponent {
 *   /// Manual blur handlers required here
 * }
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[value]:not([ngxVestTouchDisabled]),
    textarea[value]:not([ngxVestTouchDisabled]),
    select[value]:not([ngxVestTouchDisabled])
  `,
  standalone: true,
  host: {
    '(blur)': 'onBlur()',
  },
})
export class NgxVestAutoTouchDirective implements OnDestroy {
  // ES Private Fields (using # prefix for true runtime privacy)
  readonly #element =
    inject<
      ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    >(ElementRef);
  readonly #form = inject<VestForm<Record<string, unknown>>>(NGX_VEST_FORM, {
    optional: true,
  });
  readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
  readonly #injector = inject(Injector);

  /**
   * Reactive computed signal that determines if the directive should be active.
   * Only active when:
   * 1. Form instance is available
   * 2. Global config allows auto-touch (not explicitly disabled)
   * 3. Form's error strategy is 'on-touch'
   */
  readonly #isActive = computed(() => {
    if (!this.#form || this.#globalConfig?.autoTouch === false) {
      return false;
    }

    // Access errorStrategy from the form (now exposed on VestForm interface)
    const strategy = unwrapSignal(this.#form.errorStrategy);
    return strategy === 'on-touch';
  });

  #cleanupEffectRef?: ReturnType<typeof effect>;

  constructor() {
    // Use effect for reactive strategy changes
    this.#cleanupEffectRef = effect(
      () => {
        if (this.#isActive()) {
          // Directive is active - blur handler will work
          // This effect ensures reactivity when form/config changes dynamically
        }
      },
      { injector: this.#injector },
    );
  }

  /**
   * Blur event handler - automatically applied via host binding.
   * WCAG 2.2 compliant: only triggers when strategy is 'on-touch'.
   *
   * This method is called by Angular's host binding system when the element
   * loses focus. It will:
   * 1. Check if the directive should be active
   * 2. Extract the field name from the element
   * 3. Call the form's touch() method for that field
   *
   * @protected - Called by Angular, not meant for external use
   */
  protected onBlur(): void {
    if (!this.#isActive()) {
      return; // Strategy is not 'on-touch' - skip
    }

    const fieldName = this.#extractFieldName();
    if (!fieldName) {
      return; // Could not extract field name
    }

    // Touch the field (triggers validation + error display)
    this.#form?.field(fieldName).touch();
  }

  /**
   * Extract field name from element using 4-tier priority hierarchy.
   *
   * Priority order:
   * 1. data-vest-field attribute (explicit nested paths)
   * 2. Custom resolver from global config (project-specific logic)
   * 3. id attribute (WCAG preferred)
   * 4. name attribute (fallback)
   *
   * @returns Field name/path or null if not found
   */
  #extractFieldName(): string | null {
    const element = this.#element.nativeElement;

    // Priority 1: Explicit data attribute (supports nested paths)
    const vestField = element.dataset['vestField'];
    if (vestField) {
      return vestField; // e.g., "personalInfo.firstName"
    }

    // Priority 2: Custom resolver from global config
    if (this.#globalConfig?.fieldNameResolver) {
      const resolved = this.#globalConfig.fieldNameResolver(element);
      if (resolved) {
        return resolved;
      }
    }

    // Priority 3: ID attribute (WCAG preferred)
    if (element.id) {
      return this.#convertToFieldPath(element.id);
    }

    // Priority 4: Name attribute (fallback)
    if (element.name) {
      return this.#convertToFieldPath(element.name);
    }

    // No field name found
    if (this.#globalConfig?.debug) {
      console.warn(
        '[NgxVestAutoTouchDirective] Could not extract field name from element:',
        element,
      );
    }
    return null;
  }

  /**
   * Convert HTML attribute value to field path.
   *
   * Handles underscore-to-dot conversion for nested paths:
   * - "firstName" → "firstName"
   * - "personalInfo.firstName" → "personalInfo.firstName"
   * - "address_street" → "address.street"
   *
   * @param value - Attribute value (id or name)
   * @returns Field path
   */
  #convertToFieldPath(value: string): string {
    // Replace underscores with dots for nested paths
    return value.replaceAll('_', '.');
  }

  ngOnDestroy(): void {
    this.#cleanupEffectRef?.destroy();
  }
}
