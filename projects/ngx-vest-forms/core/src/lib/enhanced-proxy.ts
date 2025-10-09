/**
 * Enhanced Field Signals API - Proxy-based field accessor generation
 *
 * This module provides the Enhanced Field Signals API through JavaScript Proxy objects,
 * enabling dynamic field accessors like form.email(), form.emailValid(), etc.
 *
 * The proxy intercepts property access and dynamically generates field-specific signals
 * and operations based on the field path and accessor suffix.
 *
 * @fileoverview Enhanced proxy implementation for dynamic field access
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy} JavaScript Proxy API
 * @see {@link ./docs/enhanced-proxy.md} Enhanced Proxy Documentation
 */

import { createDerivedRegistry } from './utils/derived-field-registry';
import type { EnhancedVestForm, VestForm } from './vest-form.types';

/**
 * Creates a Proxy that provides the Enhanced Field Signals API for dynamic field access.
 *
 * This function wraps a VestForm instance with a Proxy that intercepts property access
 * to dynamically generate field-specific signals and operations. The proxy enables
 * a more ergonomic API by converting field paths into camelCase accessors.
 *
 * ## Field Accessor Pattern
 *
 * For a field path like `"user.profile.email"`, the proxy generates:
 * - `form.userProfileEmail()` - Field value signal
 * - `form.userProfileEmailValid()` - Field validity signal
 * - `form.userProfileEmailInvalid()` - Field invalidity signal (NEW in v2.0)
 * - `form.userProfileEmailDirty()` - Field dirty state signal (NEW in v2.0)
 * - `form.userProfileEmailValidation()` - Structured errors/warnings (NEW in v2.0)
 * - `form.userProfileEmailTouched()` - Field touched state signal
 * - `form.userProfileEmailPending()` - Field pending state signal
 * - `form.userProfileEmailShowErrors()` - Computed show errors signal
 * - `form.setUserProfileEmail(value)` - Field setter function
 * - `form.markAsTouchedUserProfileEmail()` - Mark field as touched (NEW in v2.0)
 * - `form.markAsDirtyUserProfileEmail()` - Mark field as dirty (NEW in v2.0)
 * - `form.resetUserProfileEmail()` - Reset field to initial value
 *
 * **Note:** The naming pattern for methods is `{verb}{CapitalizedFieldPath}`:
 * - Setters: `setEmail()`, `setUserProfileEmail()`
 * - Touch: `markAsTouchedEmail()`, `markAsTouchedUserProfileEmail()`
 * - Dirty: `markAsDirtyEmail()`, `markAsDirtyUserProfileEmail()`
 * - Reset: `resetEmail()`, `resetUserProfileEmail()`
 *
 * Alternatively, use the explicit API: `form.field('user.profile.email').markAsTouched()`
 *
 * ## Browser Compatibility
 *
 * Requires ES2015+ browsers with Proxy support. For environments without Proxy
 * support, use the explicit API via `form.field(path)` instead.
 *
 * ## Performance Considerations
 *
 * - Field accessors are created lazily on first access
 * - Repeated access to the same field accessor returns the cached instance
 * - The proxy overhead is minimal (~1-2ms per property access)
 * - Memory usage scales linearly with the number of unique field paths accessed
 *
 * ## NgForm Integration Strategy (Legacy/Future Reference)
 *
 * NgForm and [(ngModel)] are NOT supported in ngx-vest-forms v2+. All examples and code should use signal-based binding and [ngModel] (one-way) only.
 * The following is for legacy/future reference only:
 *
 * ```typescript
 * // Future ngform-sync package strategy (not supported in v2)
 * export function createFormWithNgFormSupport(suite, data, options = {}) {
 *   const baseForm = createVestForm(suite, data);
 *   // Disable proxy for NgForm compatibility
 *   if (options.useNgForm && !options.enhanceProxy) {
 *     return baseForm; // Use explicit form.field() API
 *   }
 *   return createEnhancedProxy(baseForm);
 * }
 * ```
 *
 * This separation allows for:
 * - Pure signals approach (Enhanced Proxy recommended)
 * - NgForm template-driven approach (explicit API recommended, not supported)
 * - Hybrid approaches with selective enhancement (not supported)
 *
 * @param vestForm - Base VestForm instance to enhance with proxy accessors
 * @param includeFields - Optional allowlist of field names. If provided, only these
 *                       fields will have enhanced accessors generated. Useful for
 *                       large forms where you only need enhanced access to specific fields.
 * @param excludeFields - Optional denylist of field names to exclude from enhanced
 *                       accessors. Takes precedence over includeFields.
 *
 * @returns Enhanced form instance with dynamic field accessors via Proxy
 *
 * @throws {Error} If the vestForm parameter is null or undefined
 * @throws {TypeError} If includeFields or excludeFields contain non-string values
 *
 * @example Basic Usage
 * ```typescript
 * import { createVestForm, createEnhancedProxy } from 'ngx-vest-forms/core';
 *
 * const form = createVestForm(userSuite, { email: '', name: '' });
 * const enhancedForm = createEnhancedProxy(form);
 *
 * // Dynamic field accessors (read-only signals)
 * console.log(enhancedForm.email()); // Current email value
 * console.log(enhancedForm.emailValid()); // Email validity state
 * console.log(enhancedForm.emailValidation()); // { errors: [], warnings: [] }
 *
 * /// Field operations via Enhanced Proxy
 * enhancedForm.setEmail('user@example.com');        // Set value
 * enhancedForm.markAsTouchedEmail();                 // Mark as touched
 * enhancedForm.markAsDirtyEmail();                   // Mark as dirty
 * enhancedForm.resetEmail();                         // Reset to initial
 *
 * /// Or use explicit API (same result)
 * enhancedForm.field('email').set('user@example.com');
 * enhancedForm.field('email').markAsTouched();
 * enhancedForm.field('email').markAsDirty();
 * enhancedForm.field('email').reset();
 * ```
 *
 * @example Nested Field Paths
 * ```typescript
 * interface UserProfile {
 *   user: {
 *     profile: {
 *       email: string;
 *       preferences: { theme: string };
 *     };
 *   };
 * }
 *
 * const form = createVestForm(suite, initialData);
 * const enhanced = createEnhancedProxy(form);
 *
 * // Nested path: "user.profile.email" → "userProfileEmail"
 * enhanced.userProfileEmail(); // Value signal
 * enhanced.userProfileEmailValid(); // Validity signal
 * enhanced.setUserProfileEmail('new@email.com'); // Setter
 *
 * // Deep nesting: "user.profile.preferences.theme" → "userProfilePreferencesTheme"
 * enhanced.userProfilePreferencesTheme(); // Value signal
 * enhanced.setUserProfilePreferencesTheme('dark'); // Setter
 * ```
 *
 * @example Field Filtering
 * ```typescript
 * // Only enhance specific fields (performance optimization)
 * const enhanced = createEnhancedProxy(form, ['email', 'password']);
 * enhanced.email(); // ✅ Works - included
 * enhanced.name(); // ❌ Undefined - not included
 *
 * // Exclude sensitive fields
 * const enhanced = createEnhancedProxy(form, undefined, ['creditCard']);
 * enhanced.email(); // ✅ Works - not excluded
 * enhanced.creditCard(); // ❌ Undefined - excluded
 * ```
 *
 * @example Angular Component Integration
 * ```typescript
 * @Component({
 *   template: `
 *     <form>
 *       <input
 *         [value]="form.email()"
 *         (input)="form.setEmail($event)"
 *         [class.error]="form.emailShowErrors()"
 *       />
 *       @if (form.emailShowErrors()) {
 *         <span>{{ form.emailErrors()[0] }}</span>
 *       }
 *     </form>
 *   `
 * })
 * export class UserFormComponent {
 *   form = createEnhancedProxy(
 *     createVestForm(userSuite, { email: '' })
 *   );
 * }
 * ```
 *
 * @example Fallback for Non-Proxy Environments
 * ```typescript
 * // Graceful degradation
 * function createFormWithFallback(suite, initialData) {
 *   const baseForm = createVestForm(suite, initialData);
 *
 *   if (typeof Proxy !== 'undefined') {
 *     return createEnhancedProxy(baseForm);
 *   }
 *
 *   // Fallback to explicit API
 *   return baseForm; // Use form.field('email').value() instead
 * }
 * ```
 *
 * @since 2.0.0
 * @see {@link VestForm} Base form interface
 * @see {@link EnhancedVestForm} Enhanced form interface with dynamic accessors
 * @see {@link createDerivedRegistry} Field registry implementation details
 */
export function createEnhancedProxy<TModel extends Record<string, unknown>>(
  vestForm: VestForm<TModel>,
  includeFields?: string[],
  excludeFields: string[] = [],
): EnhancedVestForm<TModel> {
  const derivedRegistry = createDerivedRegistry(
    vestForm,
    includeFields,
    excludeFields,
  );

  // Add resolveFieldPath method to the form before proxying
  // This allows auto-touch directive to map camelCase names to field paths
  (vestForm as VestForm<TModel>).resolveFieldPath = (
    camelCaseName: string,
  ): string | null => {
    return derivedRegistry.resolveFieldPath(camelCaseName);
  };

  return new Proxy(vestForm, {
    get(target, property: string | symbol, receiver) {
      const originalValue = Reflect.get(target, property, receiver);
      if (originalValue !== undefined) {
        return originalValue;
      }

      if (typeof property !== 'string') {
        return originalValue;
      }

      if (!derivedRegistry.has(property)) {
        return originalValue;
      }

      return derivedRegistry.get(property);
    },
  }) as EnhancedVestForm<TModel>;
}
