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
 * - `form.userProfileEmailErrors()` - Field errors signal
 * - `form.userProfileEmailTouched()` - Field touched state signal
 * - `form.userProfileEmailPending()` - Field pending state signal
 * - `form.userProfileEmailShowErrors()` - Computed show errors signal
 * - `form.setUserProfileEmail(value)` - Field setter function
 * - `form.touchUserProfileEmail()` - Mark field as touched
 * - `form.resetUserProfileEmail()` - Reset field to initial value
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
 * ## NgForm Integration Strategy
 *
 * This proxy is designed for conditional enablement based on NgForm usage patterns.
 * Future NgForm integration packages may need to disable proxy enhancement to avoid
 * conflicts with template-driven form bindings:
 *
 * ```typescript
 * /// Future ngform-sync package strategy:
 * export function createFormWithNgFormSupport(suite, data, options = {}) {
 *   const baseForm = createVestForm(suite, data);
 *
 *   /// Disable proxy for NgForm compatibility
 *   if (options.useNgForm && !options.enhanceProxy) {
 *     return baseForm; // Use explicit form.field() API
 *   }
 *
 *   return createEnhancedProxy(baseForm);
 * }
 * ```
 *
 * This separation allows for:
 * - Pure signals approach (Enhanced Proxy recommended)
 * - NgForm template-driven approach (explicit API recommended)
 * - Hybrid approaches with selective enhancement
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
 * // Dynamic field accessors
 * console.log(enhancedForm.email()); // Current email value
 * console.log(enhancedForm.emailValid()); // Email validity state
 *
 * // Field operations
 * enhancedForm.setEmail('user@example.com');
 * enhancedForm.touchEmail();
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
