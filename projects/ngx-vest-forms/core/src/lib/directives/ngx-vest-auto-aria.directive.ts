import {
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  type OnDestroy,
  type Signal,
} from '@angular/core';
import {
  NGX_VEST_FIELD,
  NGX_VEST_FORM,
  NGX_VEST_FORMS_CONFIG,
} from '../tokens';
import type { VestField } from '../vest-form.types';
import { NgxVestFormProviderDirective } from './ngx-vest-form-provider.directive';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[value]:not([ngxVestAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[value]:not([ngxVestAutoAriaDisabled]),
    select[value]:not([ngxVestAutoAriaDisabled]),
    input[type="checkbox"]:not([ngxVestAutoAriaDisabled]),
    input[type="radio"]:not([ngxVestAutoAriaDisabled])
  `,
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
  },
})
export class NgxVestAutoAriaDirective implements OnDestroy {
  // 1. Dependency Injection
  readonly #element =
    inject<
      ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    >(ElementRef);

  // Try field-level injection first (via [ngxVestField]), then form-level
  readonly #field = inject<VestField<unknown>>(NGX_VEST_FIELD, {
    optional: true,
  });
  readonly #formProvider = inject<NgxVestFormProviderDirective>(NGX_VEST_FORM, {
    optional: true,
  });
  readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
  readonly #injector = inject(Injector);

  /**
   * Computed to get the actual form instance from the provider directive.
   */
  readonly #form = computed(() => this.#formProvider?.getForm() ?? null);

  // 2. Manual Override Detection (HostAttributeToken)
  readonly #manualAriaInvalid = inject(new HostAttributeToken('aria-invalid'), {
    optional: true,
  });
  readonly #manualAriaDescribedBy = inject(
    new HostAttributeToken('aria-describedby'),
    { optional: true },
  );

  /**
   * Extracted field name for this control.
   * Uses same 4-tier priority system as NgxVestAutoTouchDirective:
   * 1. data-vest-field attribute
   * 2. Custom resolver from config
   * 3. id attribute
   * 4. name attribute
   */
  #fieldName = '';

  /**
   * Cache of existing aria-describedby value (for preserving hint text IDs).
   */
  #existingAriaDescribedBy: string | null = null;

  /**
   * Check if developer manually set static aria-invalid attribute.
   */
  #hasManualAriaInvalid = () => this.#manualAriaInvalid !== null;

  // 4. Reactive Activation State
  readonly #isActive = computed(() => {
    if (this.#globalConfig?.autoAria === false) {
      return false; // Globally disabled via config
    }
    // Active if field OR form is available
    if (!this.#field && !this.#form()) {
      return false; // No context - directive inactive
    }
    return true; // Active when field or form exists and not disabled
  });

  /**
   * Computed signal for aria-invalid attribute.
   *
   * IMPORTANT: Returns 'true' (string) not true (boolean) per ARIA spec.
   * Angular's [attr.aria-invalid] binding will:
   * - Set attribute to "true" when signal returns 'true'
   * - Remove attribute entirely when signal returns null
   * - Preserve manual value when signal returns the manual value
   *
   * @returns 'true' when field has errors, manual value if manually set, null otherwise
   */
  protected readonly ariaInvalid: Signal<string | null> = computed(() => {
    // If manually set, preserve the manual value
    if (this.#hasManualAriaInvalid()) {
      return this.#manualAriaInvalid;
    }

    if (!this.#isActive()) {
      return null; // Directive disabled
    }

    // Field-level injection (direct access)
    let field: VestField<unknown> | null = this.#field;

    // Form-level injection (extract field name then access)
    const form = this.#form();
    if (!field && form && this.#fieldName) {
      field = form.field(this.#fieldName);
    }

    if (!field) {
      return null; // No field context
    }

    const showErrors = field.showErrors();
    const isValid = field.valid();

    return showErrors && !isValid ? 'true' : null;
  });

  /**
   * Computed signal for aria-describedby attribute.
   * Appends error ID when errors are visible.
   *
   * NOTE: Unlike aria-invalid, we DO NOT block modification when aria-describedby
   * is manually set. Instead, we treat the initial value as a "hint" ID that we
   * append the error ID to. This allows developers to add hint text via
   * `aria-describedby="email-hint"` and the directive will append "email-error"
   * when errors occur, resulting in `aria-describedby="email-hint email-error"`.
   *
   * Special handling for radio buttons:
   * - Only first radio in group gets aria-describedby
   * - Prevents repetitive screen reader announcements
   *
   * @returns Space-separated ID list or null
   */
  protected readonly ariaDescribedBy: Signal<string | null> = computed(() => {
    // Note: We do NOT check #hasManualAriaDescribedBy() here!
    // Manual aria-describedby values are treated as initial hints to append to.

    if (!this.#isActive()) {
      return null; // Directive disabled
    }

    // Field-level injection (direct access)
    let field: VestField<unknown> | null = this.#field;
    const fieldName = this.#fieldName;

    // Form-level injection (extract field name then access)
    const form = this.#form();
    if (!field && form && fieldName) {
      field = form.field(fieldName);
    }

    if (!field || !fieldName) {
      return null; // No field context
    }

    // Special handling for radio buttons (only first in group gets aria-describedby)
    const element = this.#element.nativeElement;
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      const radioGroup = document.querySelectorAll<HTMLInputElement>(
        `input[type="radio"][name="${element.name}"]`,
      );
      if (radioGroup.length > 0 && radioGroup[0] !== element) {
        return null; // Not the first radio - skip aria-describedby
      }
    }

    const showErrors = field.showErrors();
    const hasErrors = field.validation().errors.length > 0;

    if (!showErrors || !hasErrors) {
      // No errors - preserve existing IDs (hint text, etc.)
      return this.#existingAriaDescribedBy;
    }

    // Append error ID to existing IDs
    const errorId = `${fieldName}-error`;
    const existing = this.#existingAriaDescribedBy;

    return existing ? `${existing} ${errorId}` : errorId;
  });

  // 6. Cleanup
  #cleanupEffectRef?: ReturnType<typeof effect>;

  constructor() {
    this.#fieldName = this.#extractFieldName() || '';
    this.#existingAriaDescribedBy = this.#manualAriaDescribedBy;

    this.#cleanupEffectRef = effect(
      () => {
        if (this.#isActive()) {
          // Directive is active - host bindings will work
          // This effect ensures reactivity when form/config changes dynamically
        }
      },
      { injector: this.#injector },
    );
  }

  /**
   * Extract field name from element using 4-tier priority hierarchy.
   *
   * Priority order (with special handling for radio buttons):
   * 1. data-vest-field attribute (explicit nested paths)
   * 2. Custom resolver from global config (project-specific logic)
   * 3a. name attribute (for radio buttons - represents the field/group)
   * 3b. id attribute (WCAG preferred for other inputs)
   * 4. name attribute (fallback for non-radio inputs)
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

    // Special case for radio buttons: use name attribute (represents the field group)
    if (
      element instanceof HTMLInputElement &&
      element.type === 'radio' &&
      element.name
    ) {
      return this.#convertToFieldPath(element.name);
    }

    // Priority 3: ID attribute (WCAG preferred)
    if (element.id) {
      return this.#convertToFieldPath(element.id);
    }

    // Priority 4: Name attribute (fallback)
    if ('name' in element && element.name) {
      return this.#convertToFieldPath(element.name);
    }

    // No field name found
    if (this.#globalConfig?.debug) {
      console.warn(
        '[NgxVestAutoAriaDirective] Could not extract field name from element:',
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
