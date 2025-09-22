/**
 * Utility functions for managing form field state in dynamic forms.
 * These functions help maintain component state consistency when form structure changes.
 */

/**
 * Conditionally clears fields from form state based on provided conditions.
 *
 * **CRITICAL: When This Utility is Required**
 * This utility is specifically needed when conditional logic switches between:
 * - **Form inputs** (e.g., `<input>`, `<select>`, `<textarea>`)
 * - **NON-form elements** (e.g., `<p>`, `<div>`, informational content)
 *
 * **Primary Use Case - Form Input ↔ Non-Form Content:**
 * ```typescript
 * @if (mode === 'input') {
 *   <input name="field" [ngModel]="value" />  // Form input
 * } @else {
 *   <p>No input required</p>                  // NON-form element
 * }
 * ```
 *
 * **Why This Creates a Problem:**
 * 1. Switching FROM input TO non-form content: Angular removes FormControl, but component signal retains old value
 * 2. This creates state inconsistency between `ngForm.form.value` (clean) and `formValue()` (stale)
 * 3. Manual clearing synchronizes component state with actual form structure
 *
 * **When NOT Required:**
 * Pure form-to-form conditionals usually don't need manual clearing:
 * ```typescript
 * @if (type === 'text') {
 *   <input name="field" [ngModel]="value" type="text" />
 * } @else {
 *   <input name="field" [ngModel]="value" type="number" />  // Still a form input
 * }
 * ```
 *
 * **Performance Note:**
 * Uses `Object.entries()` for efficient field clearing without mutation.
 * Only processes fields that need to be cleared, preserving other field values.
 *
 * @template T - The form model type, must extend Record<string, any>
 * @param currentState - The current form state object
 * @param conditions - Object mapping field names to boolean conditions (true = clear field)
 * @returns New state object with specified fields cleared (set to undefined)
 *
 * @example
 * ```typescript
 * ///  REQUIRED: Form input switching to non-form content
 * onProcedureTypeChange(newValue: string) {
 *   this.formValue.update((current) =>
 *     clearFieldsWhen(current, {
 *       fieldA: newValue !== 'typeA',  // Clear when switching to non-form content
 *       fieldB: newValue !== 'typeB',  // Clear when switching to non-form content
 *     })
 *   );
 * }
 *
 * ///  Template structure that REQUIRES clearing:
 * ///  @if (type === 'typeA') { <input name="fieldA" /> }
 * ///  @else if (type === 'typeB') { <input name="fieldB" /> }
 * ///  @else { <p>No input needed</p> }  // ← NON-form element!
 * ```
 *
 * @example
 * ```typescript
 * ///  Complex conditional clearing with mixed form/non-form scenarios
 * const cleanedState = clearFieldsWhen(form, {
 *   shippingAddress: !form.useShippingAddress,    // Clear when not using shipping
 *   emergencyContact: (form.age || 0) >= 18,      // Clear when adult (no emergency contact form)
 *   childInfo: form.userType !== 'parent',        // Clear when not parent (shows info text instead)
 * });
 * ```
 *
 * @example
 * ```typescript
 * ///  State inconsistency example - WHY manual clearing is needed:
 *
 * ///  BEFORE switching from input to non-form content (typeA → typeC):
 * formValue() = { procedureType: 'typeA', fieldA: 'user-input' }
 * ngForm.form.value = { procedureType: 'typeA', fieldA: 'user-input' }
 *
 * ///  AFTER switching WITHOUT clearing (PROBLEMATIC):
 * formValue() = { procedureType: 'typeC', fieldA: 'user-input' }  // ❌ Stale fieldA!
 * ngForm.form.value = { procedureType: 'typeC' }                  // ✅ Clean (Angular removed FormControl)
 *
 * ///  AFTER switching WITH clearing (CONSISTENT):
 * formValue() = { procedureType: 'typeC' }  // ✅ Clean component state
 * ngForm.form.value = { procedureType: 'typeC' }  // ✅ Clean form state
 * ```
 *
 */
export function clearFieldsWhen<T extends Record<string, any>>(
  currentState: T,
  conditions: Partial<Record<keyof T, boolean>>
): T {
  const result = { ...currentState };

  Object.entries(conditions).forEach(([fieldName, shouldClear]) => {
    if (shouldClear) {
      (result as any)[fieldName] = undefined;
    }
  });

  return result;
}

/**
 * Clears multiple fields from form state unconditionally.
 *
 * **Use Cases:**
 * - Form reset operations when switching between form modes
 * - Clearing temporary/wizard data when exiting multi-step forms
 * - Cleanup after form submission or cancellation
 * - When you want explicit control over which fields to clear
 *
 * **Note:** Unlike `clearFieldsWhen`, this function always clears the specified fields
 * regardless of conditions. Use this when you want unconditional field removal.
 *
 * @template T - The form model type, must extend Record<string, any>
 * @param currentState - The current form state object
 * @param fieldsToClear - Array of field names to clear (set to undefined)
 * @returns New state object with specified fields cleared
 *
 * @example
 * ```typescript
 * ///  Clear specific fields during form mode transitions
 * const cleanedState = clearFields(currentFormValue, ['fieldA', 'fieldB']);
 *
 * ///  Reset wizard or temporary data
 * onFormModeChange() {
 *   this.formValue.update((current) =>
 *     clearFields(current, ['temporaryData', 'wizardStep', 'draftSaved'])
 *   );
 * }
 *
 * ///  Clear all optional fields on form submission
 * onSubmit() {
 *   const finalData = clearFields(this.formValue(), ['draftField', 'tempNotes']);
 *   this.submitForm(finalData);
 * }
 * ```
 */
export function clearFields<T extends Record<string, any>>(
  currentState: T,
  fieldsToClear: Array<keyof T>
): T {
  const result = { ...currentState };

  fieldsToClear.forEach((fieldName) => {
    (result as any)[fieldName] = undefined;
  });

  return result;
}

/**
 * Creates a clean form state containing only fields that meet specified conditions.
 *
 * **Philosophy:** Instead of clearing unwanted fields (like `clearFieldsWhen`), this function
 * takes a "whitelist" approach - building a new state with only the fields you explicitly want to keep.
 *
 * **Best Use Cases:**
 * - Complex form transformations where you want to be explicit about kept fields
 * - Building clean data objects for API submission (exclude UI-only fields)
 * - Form mode switching where different modes have completely different field sets
 * - Data export scenarios where only certain fields should be included
 *
 * **Returns:** `Partial<T>` because the result may not contain all original fields.
 *
 * @template T - The form model type, must extend Record<string, any>
 * @param currentState - The current form state object
 * @param conditions - Object mapping field names to boolean conditions (true = keep field)
 * @returns New state object containing only fields where condition is true
 *
 * @example
 * ```typescript
 * ///  Keep only relevant fields based on form mode
 * const filteredState = keepFieldsWhen(currentFormValue, {
 *   procedureType: true, // always keep
 *   fieldA: procedureType === 'typeA',
 *   fieldB: procedureType === 'typeB',
 *   // Note: fieldC is omitted when procedureType === 'typeC' (non-form content)
 * });
 *
 * ///  Build clean data for API submission (exclude UI-only fields)
 * const apiData = keepFieldsWhen(formValue(), {
 *   // Business data - keep these
 *   userName: true,
 *   email: true,
 *   preferences: true,
 *   // UI state fields omitted: wizardStep, draftSaved, validationErrors, etc.
 * });
 *
 * ///  Dynamic form sections based on user permissions
 * const relevantData = keepFieldsWhen(form, {
 *   basicInfo: true,
 *   addressInfo: form.needsAddress && userCanEditAddress,
 *   paymentInfo: form.requiresPayment && userCanMakePayments,
 *   adminFields: userIsAdmin,
 * });
 * ```
 *
 * @since 1.0.0
 */
export function keepFieldsWhen<T extends Record<string, any>>(
  currentState: T,
  conditions: Partial<Record<keyof T, boolean>>
): Partial<T> {
  const result: Partial<T> = {};
  Object.entries(conditions).forEach(([fieldName, shouldKeep]) => {
    if (shouldKeep && fieldName in currentState) {
      (result as any)[fieldName] = currentState[fieldName as keyof T];
    }
  });
  return result;
}
