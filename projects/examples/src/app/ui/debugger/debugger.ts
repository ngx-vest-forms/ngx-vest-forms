import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { EnhancedVestForm } from 'ngx-vest-forms';

@Component({
  selector: 'ngx-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
  templateUrl: './debugger.html',
  styleUrl: './debugger.css',
})
export class Debugger {
  readonly form = input.required<EnhancedVestForm<Record<string, unknown>>>();
  readonly schema = input<StandardSchemaV1 | undefined>();

  protected readonly model = computed(() => this.form().model());
  protected readonly valid = computed(() => this.form().valid());
  protected readonly invalid = computed(() => this.form().invalid());
  protected readonly dirty = computed(() => this.form().dirty());
  protected readonly pending = computed(() => this.form().pending());
  protected readonly submitting = computed(() => this.form().submitting());
  protected readonly submittedStatus = computed(() =>
    this.form().submittedStatus(),
  );

  /**
   * Detect schema vendor from StandardSchemaV1 specification.
   * Returns 'zod', 'valibot', 'arktype', or undefined.
   * No type guard needed - just check the vendor property!
   */
  protected readonly schemaVendor = computed(() => {
    const s = this.schema();
    if (!s || typeof s !== 'object' || !('~standard' in s)) return;
    return (s as StandardSchemaV1)['~standard'].vendor;
  });

  /**
   * Format vendor name for display
   */
  protected readonly schemaVendorDisplay = computed(() => {
    const vendor = this.schemaVendor();
    if (!vendor) return 'Schema';
    return vendor.charAt(0).toUpperCase() + vendor.slice(1);
  });

  /**
   * Get schema-specific errors (Layer 1 validation) filtered by error display strategy.
   * Respects touch state and submit state to show errors consistently with Vest errors.
   */
  protected readonly schemaErrors = computed(() => {
    return this.form().visibleSchemaErrors() || {};
  });

  /**
   * Check if there are any schema errors
   */
  protected readonly hasSchemaErrors = computed(() => {
    const errors = this.schemaErrors();
    return Object.keys(errors).length > 0;
  });

  /**
   * Count total schema errors
   */
  protected readonly schemaErrorCount = computed(() => {
    const errors = this.schemaErrors();
    return Object.values(errors).reduce((total, errs) => {
      return total + (Array.isArray(errs) ? errs.length : 1);
    }, 0);
  });

  /**
   * Use the form's visibleErrors convenience API which automatically filters
   * errors based on the error display strategy (immediate, on-touch, on-submit, manual).
   * This respects which fields should show errors according to their showErrors() state.
   *
   * When a schema is present, this shows MERGED errors (schema + vest).
   * For two-layer display, use vestOnlyErrors() to show Layer 2 separately.
   */
  protected readonly visibleErrors = computed(() =>
    this.form().visibleErrors(),
  );

  /**
   * Get Vest-only errors (Layer 2 validation)
   * Filters out schema errors to show only business logic validation errors.
   */
  protected readonly vestOnlyErrors = computed(() => {
    const allErrors = this.visibleErrors();
    const schemaErrs = this.schemaErrors();

    // If no schema, all errors are from Vest
    if (!this.schema()) {
      return allErrors;
    }

    // Filter out schema errors to show only Vest errors
    const vestOnly: Record<string, string[]> = {};
    for (const [field, errors] of Object.entries(allErrors)) {
      const schemaFieldErrors = schemaErrs[field] || [];
      const filteredErrors = errors.filter(
        (error) => !schemaFieldErrors.includes(error),
      );
      if (filteredErrors.length > 0) {
        vestOnly[field] = filteredErrors;
      }
    }
    return vestOnly;
  });

  /**
   * Get error entries for display (Vest-only when schema present, all errors otherwise)
   */
  protected readonly errorEntries = computed(() =>
    Object.entries(this.vestOnlyErrors())
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => ({
        field,
        messages,
      })),
  );

  /** Expose Object for template use */
  protected readonly Object = Object;
}

export function asDebuggerForm<TModel extends Record<string, unknown>>(
  form: EnhancedVestForm<TModel>,
): EnhancedVestForm<Record<string, unknown>> {
  return form as unknown as EnhancedVestForm<Record<string, unknown>>;
}
