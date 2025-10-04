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
import { NGX_VEST_FORM, NGX_VEST_FORMS_CONFIG } from '../tokens';
import type { VestForm } from '../vest-form.types';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[value]:not([ngxVestAriaDisabled]),
    textarea[value]:not([ngxVestAriaDisabled]),
    select[value]:not([ngxVestAriaDisabled]),
    input[type="checkbox"][checked]:not([ngxVestAriaDisabled]),
    input[type="radio"][checked]:not([ngxVestAriaDisabled])
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
  readonly #form = inject<VestForm<Record<string, unknown>>>(NGX_VEST_FORM, {
    optional: true,
  });
  readonly #globalConfig = inject(NGX_VEST_FORMS_CONFIG, { optional: true });
  readonly #injector = inject(Injector);

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

  /**
   * Check if developer manually set static aria-describedby attribute.
   */
  #hasManualAriaDescribedBy = () => this.#manualAriaDescribedBy !== null;

  // 4. Reactive Activation State
  readonly #isActive = computed(() => {
    if (!this.#form) {
      return false; // No form context - directive inactive
    }
    if (this.#globalConfig?.autoAria === false) {
      return false; // Globally disabled via config
    }
    return true; // Active when form exists and not disabled
  });

  /**
   * Computed signal for aria-invalid attribute.
   *
   * IMPORTANT: Returns 'true' (string) not true (boolean) per ARIA spec.
   * Angular's [attr.aria-invalid] binding will:
   * - Set attribute to "true" when signal returns 'true'
   * - Remove attribute entirely when signal returns null
   *
   * @returns 'true' when field has errors, null otherwise
   */
  protected readonly ariaInvalid: Signal<'true' | null> = computed(() => {
    if (!this.#isActive() || this.#hasManualAriaInvalid()) {
      return null; // Directive disabled OR manual override exists
    }

    if (!this.#fieldName || !this.#form) {
      return null; // No field name or form context
    }

    const field = this.#form.field(this.#fieldName);
    const showErrors = field.showErrors();
    const isValid = field.valid();

    return showErrors && !isValid ? 'true' : null;
  });

  /**
   * Computed signal for aria-describedby attribute.
   * Appends error ID when errors are visible.
   *
   * Special handling for radio buttons:
   * - Only first radio in group gets aria-describedby
   * - Prevents repetitive screen reader announcements
   *
   * @returns Space-separated ID list or null
   */
  protected readonly ariaDescribedBy: Signal<string | null> = computed(() => {
    if (!this.#isActive() || this.#hasManualAriaDescribedBy()) {
      return null; // Directive disabled OR manual override exists
    }

    if (!this.#fieldName || !this.#form) {
      return null; // No field name or form context
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

    const field = this.#form.field(this.#fieldName);
    const showErrors = field.showErrors();
    const hasErrors = field.validation().errors.length > 0;

    if (!showErrors || !hasErrors) {
      // No errors - preserve existing IDs (hint text, etc.)
      return this.#existingAriaDescribedBy;
    }

    // Append error ID to existing IDs
    const errorId = `${this.#fieldName}-error`;
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
