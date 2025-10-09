import { Component, input } from '@angular/core';
import type { VestForm } from 'ngx-vest-forms';

/**
 * Field States Table Component
 *
 * Displays a live table of field states for ngx-vest-forms.
 * Shows field values, dirty, touched, invalid, and valid states with color-coded badges.
 *
 * @example
 * ```typescript
 * <ngx-field-states-table
 *   [form]="myForm"
 *   [fields]="['email', 'username', 'password']"
 * />
 * ```
 */
@Component({
  selector: 'ngx-field-states-table',
  standalone: true,
  template: `
    <div
      class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <h3 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        📊 Live Field States
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-2 py-2 text-left font-semibold">Field</th>
              <th class="px-2 py-2 text-center font-semibold">Value</th>
              <th class="px-2 py-2 text-center font-semibold">dirty()</th>
              <th class="px-2 py-2 text-center font-semibold">touched()</th>
              <th class="px-2 py-2 text-center font-semibold">invalid()</th>
              <th class="px-2 py-2 text-center font-semibold">valid()</th>
            </tr>
          </thead>
          <tbody class="text-xs">
            @for (fieldName of fields(); track fieldName) {
              <tr
                class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
              >
                <!-- Field Name -->
                <td class="px-2 py-2 font-medium">{{ fieldName }}</td>

                <!-- Value -->
                <td class="px-2 py-2 text-center">
                  <code
                    class="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-900"
                  >
                    {{ getFieldValue(fieldName) }}
                  </code>
                </td>

                <!-- dirty() -->
                <td class="px-2 py-2 text-center">
                  <span
                    class="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-semibold"
                    [class.bg-amber-100]="getFieldDirty(fieldName)"
                    [class.text-amber-700]="getFieldDirty(fieldName)"
                    [class.bg-gray-100]="!getFieldDirty(fieldName)"
                    [class.text-gray-500]="!getFieldDirty(fieldName)"
                  >
                    {{ getFieldDirty(fieldName) ? 'T' : 'F' }}
                  </span>
                </td>

                <!-- touched() -->
                <td class="px-2 py-2 text-center">
                  <span
                    class="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-semibold"
                    [class.bg-blue-100]="getFieldTouched(fieldName)"
                    [class.text-blue-700]="getFieldTouched(fieldName)"
                    [class.bg-gray-100]="!getFieldTouched(fieldName)"
                    [class.text-gray-500]="!getFieldTouched(fieldName)"
                  >
                    {{ getFieldTouched(fieldName) ? 'T' : 'F' }}
                  </span>
                </td>

                <!-- invalid() -->
                <td class="px-2 py-2 text-center">
                  <span
                    class="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-semibold"
                    [class.bg-red-100]="getFieldInvalid(fieldName)"
                    [class.text-red-700]="getFieldInvalid(fieldName)"
                    [class.bg-gray-100]="!getFieldInvalid(fieldName)"
                    [class.text-gray-500]="!getFieldInvalid(fieldName)"
                  >
                    {{ getFieldInvalid(fieldName) ? 'T' : 'F' }}
                  </span>
                </td>

                <!-- valid() -->
                <td class="px-2 py-2 text-center">
                  <span
                    class="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-semibold"
                    [class.bg-green-100]="getFieldValid(fieldName)"
                    [class.text-green-700]="getFieldValid(fieldName)"
                    [class.bg-gray-100]="!getFieldValid(fieldName)"
                    [class.text-gray-500]="!getFieldValid(fieldName)"
                  >
                    {{ getFieldValid(fieldName) ? 'T' : 'F' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
        T = true, F = false. Watch states change as you interact with the form.
      </p>
    </div>
  `,
})
export class FieldStatesTableComponent {
  /** The form instance to display states for */
  readonly form = input.required<
    VestForm<Record<string, unknown>> | undefined
  >();

  /** Array of field names to display in the table */
  readonly fields = input.required<string[]>();

  /**
   * Get display value for a field (masks passwords with bullets)
   */
  protected getFieldValue(fieldName: string): string {
    const f = this.form();
    if (!f) return '(empty)';

    // Use Enhanced Proxy accessors (e.g., form.email())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (f as any)[fieldName]?.();

    if (!value) return '(empty)';

    // Mask password fields
    if (
      fieldName.toLowerCase().includes('password') &&
      typeof value === 'string'
    ) {
      return '•'.repeat(value.length);
    }

    return String(value);
  }

  /**
   * Get dirty state for a field
   */
  protected getFieldDirty(fieldName: string): boolean {
    const f = this.form();
    if (!f) return false;

    // Use Enhanced Proxy: form.emailDirty()
    const dirtyMethod = `${fieldName}Dirty`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f as any)[dirtyMethod]?.() ?? false;
  }

  /**
   * Get touched state for a field
   */
  protected getFieldTouched(fieldName: string): boolean {
    const f = this.form();
    if (!f) return false;

    // Use Enhanced Proxy: form.emailTouched()
    const touchedMethod = `${fieldName}Touched`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f as any)[touchedMethod]?.() ?? false;
  }

  /**
   * Get invalid state for a field
   */
  protected getFieldInvalid(fieldName: string): boolean {
    const f = this.form();
    if (!f) return false;

    // Use Enhanced Proxy: form.emailInvalid()
    const invalidMethod = `${fieldName}Invalid`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f as any)[invalidMethod]?.() ?? false;
  }

  /**
   * Get valid state for a field
   */
  protected getFieldValid(fieldName: string): boolean {
    const f = this.form();
    if (!f) return false;

    // Use Enhanced Proxy: form.emailValid()
    const validMethod = `${fieldName}Valid`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (f as any)[validMethod]?.() ?? false;
  }
}
