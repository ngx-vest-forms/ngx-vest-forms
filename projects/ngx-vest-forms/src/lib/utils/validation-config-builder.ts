import type { FieldPath, ValidationConfigMap } from './field-path-types';

/**
 * Fluent builder for creating type-safe validation configurations.
 *
 * Provides convenience methods for common validation dependency patterns:
 * - **`whenChanged()`**: One-way dependencies (when A changes, revalidate B)
 * - **`bidirectional()`**: Two-way dependencies (A ↔ B revalidate each other)
 * - **`group()`**: All fields in group revalidate each other
 * - **`merge()`**: Combine with existing configurations
 *
 * @template T - The form model type
 *
 * @example Basic usage
 * ```typescript
 * const config = createValidationConfig<MyFormModel>()
 *   .whenChanged('password', 'confirmPassword')
 *   .bidirectional('startDate', 'endDate')
 *   .build();
 * ```
 *
 * @example Complex scenario
 * ```typescript
 * const config = createValidationConfig<OrderFormModel>()
 *   .group(['firstName', 'lastName', 'email'])
 *   .whenChanged('country', ['state', 'zipCode'])
 *   .bidirectional('minPrice', 'maxPrice')
 *   .merge(existingConfig)
 *   .build();
 * ```
 */
export class ValidationConfigBuilder<T> {
  private config: Partial<Record<string, string[]>> = {};

  /**
   * Add a one-way dependency: when `trigger` changes, revalidate `dependents`.
   *
   * This method is cumulative - calling it multiple times with the same trigger
   * will merge all dependents together.
   *
   * **When to Use:**
   * - ✅ Conditional field requirements (country → state/zipCode)
   * - ✅ Calculated fields (quantity/price → total)
   * - ✅ Dependent validations where only one direction matters
   * - ✅ Cascading validations (A changes → B needs revalidation → C needs revalidation)
   *
   * **Real-World Use Case:**
   * In an e-commerce checkout form, when the user selects a country, the available
   * states/provinces and zip code format validation rules change. The country field
   * needs to trigger revalidation of state and zipCode, but changes to state/zipCode
   * don't need to revalidate country (one-way dependency).
   *
   * **Vest.js Patterns That Work Well:**
   * - `skipWhen(res => res.hasErrors('trigger'), () => { test('dependent', ...) })` -
   *   Skip expensive validations on dependent field until trigger field is valid
   * - Async validations on dependent fields that need the trigger's value
   * - Calculated field validations (e.g., total depends on quantity × price)
   * - Conditional `omitWhen` based on trigger field state
   *
   * @param trigger - The field that triggers revalidation
   * @param revalidate - Single field or array of fields to revalidate
   * @returns This builder instance for method chaining
   *
   * @example Single dependent
   * ```typescript
   * builder.whenChanged('password', 'confirmPassword');
   * /// Result: { password: ['confirmPassword'] }
   * ```
   *
   * @example Multiple dependents
   * ```typescript
   * builder.whenChanged('country', ['state', 'zipCode', 'postalCode']);
   * /// Result: { country: ['state', 'zipCode', 'postalCode'] }
   * ```
   *
   * @example Cumulative calls
   * ```typescript
   * builder
   *   .whenChanged('password', 'confirmPassword')
   *   .whenChanged('password', 'securityScore');
   * /// Result: { password: ['confirmPassword', 'securityScore'] }
   * ```
   */
  whenChanged<K extends FieldPath<T>>(
    trigger: K,
    revalidate: FieldPath<T> | FieldPath<T>[]
  ): this {
    const deps = Array.isArray(revalidate) ? revalidate : [revalidate];
    const existing = this.config[trigger] || [];

    // Development mode warning for duplicate dependents
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const duplicates = deps.filter((d) => existing.includes(d));
      if (duplicates.length > 0) {
        console.warn(
          `[ngx-vest-forms] ValidationConfigBuilder: Duplicate dependencies detected.\n` +
            `  Trigger: '${trigger}'\n` +
            `  Duplicates: ${duplicates.map((d) => `'${d}'`).join(', ')}\n` +
            `  These will be automatically deduplicated.`
        );
      }
    }

    // Deduplicate dependents
    const merged = [...existing, ...deps];
    this.config[trigger] = Array.from(new Set(merged));

    return this;
  }

  /**
   * Add bidirectional dependency: when either field changes, revalidate the other.
   *
   * This is a convenience method that calls `whenChanged()` in both directions.
   * Commonly used for password/confirmPassword, min/max ranges, start/end dates.
   *
   * **When to Use:**
   * - ✅ Password confirmation (password ↔ confirmPassword)
   * - ✅ Min/max range validation (minPrice ↔ maxPrice, minAge ↔ maxAge)
   * - ✅ Start/end date validation (startDate ↔ endDate)
   * - ✅ Any field comparison where both fields need mutual revalidation
   *
   * **Real-World Use Case:**
   * In a job posting form, when setting salary range, changing either minSalary or
   * maxSalary should revalidate the other to ensure minSalary ≤ maxSalary. Users
   * can change either field first, so both directions need validation. This prevents
   * invalid ranges like "$80k min, $50k max".
   *
   * **Vest.js Patterns That Work Well:**
   * - Comparison validations: `enforce(data.min).lessThanOrEquals(data.max)`
   * - Password matching: `enforce(data.password).equals(data.confirmPassword)`
   * - Date range validation with `enforce(data.startDate).lessThan(data.endDate)`
   * - `skipWhen` to prevent comparison when either field has errors:
   *   ```typescript
   *   skipWhen(res => res.hasErrors('field1') || res.hasErrors('field2'), () => {
   *     test('field1', 'Min must be ≤ Max', () => enforce(min).lessThanOrEquals(max));
   *   });
   *   ```
   *
   * @param field1 - First field in the bidirectional relationship
   * @param field2 - Second field in the bidirectional relationship
   * @returns This builder instance for method chaining
   *
   * @example Password confirmation
   * ```typescript
   * builder.bidirectional('password', 'confirmPassword');
   * /// Result: {
   * ///   password: ['confirmPassword'],
   * ///   confirmPassword: ['password']
   * /// }
   * ```
   *
   * @example Date range
   * ```typescript
   * builder.bidirectional('startDate', 'endDate');
   * /// Result: {
   * ///   startDate: ['endDate'],
   * ///   endDate: ['startDate']
   * /// }
   * ```
   */
  bidirectional<K1 extends FieldPath<T>, K2 extends FieldPath<T>>(
    field1: K1,
    field2: K2
  ): this {
    // Development mode warning for exact duplicate
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const hasField1ToField2 =
        this.config[field1]?.includes(field2 as string) ?? false;
      const hasField2ToField1 =
        this.config[field2]?.includes(field1 as string) ?? false;

      if (hasField1ToField2 && hasField2ToField1) {
        console.warn(
          `[ngx-vest-forms] ValidationConfigBuilder: Duplicate bidirectional relationship detected.\n` +
            `  Fields: '${field1}' ↔ '${field2}'\n` +
            `  This bidirectional relationship was already configured.`
        );
      }
    }

    this.whenChanged(field1, field2);
    this.whenChanged(field2, field1);
    return this;
  }

  /**
   * Create a validation group where all fields revalidate each other.
   *
   * When any field in the group changes, all other fields in the group are revalidated.
   * This is useful for fields that collectively form a validation rule.
   *
   * **When to Use:**
   * - ✅ "At least one required" scenarios (email OR phone OR address)
   * - ✅ Interdependent field sets (credit card: number + expiry + CVV)
   * - ✅ Contact information (firstName + lastName + email)
   * - ✅ Fields that collectively satisfy a business rule
   *
   * **Real-World Use Case:**
   * In a customer registration form with a "at least one contact method required"
   * business rule, the validation suite checks `email || phone || mailingAddress`.
   * When user fills any of these fields, the other fields need revalidation to clear
   * the "at least one required" error. All three fields are interdependent, so
   * grouping them ensures validation updates correctly regardless of which field
   * the user fills first.
   *
   * **Vest.js Patterns That Work Well:**
   * - "At least one required" logic:
   *   ```typescript
   *   test('email', 'Provide at least one contact method', () => {
   *     enforce(data.email || data.phone || data.address).isTruthy();
   *   });
   *   ```
   * - Interdependent field validation where all fields collectively satisfy a rule
   * - Credit card validation (number + expiry + CVV all need each other)
   * - Use `optional()` for groups where fields can all be empty together:
   *   ```typescript
   *   optional(['email', 'phone', 'address']);
   *   ```
   *
   * **Performance Note:** This creates N×(N-1) dependencies, which can impact
   * performance for large groups. Consider using `whenChanged()` for more targeted
   * dependencies if performance is a concern (e.g., groups > 10 fields).
   *
   * @param fields - Array of fields that should all revalidate each other
   * @returns This builder instance for method chaining
   *
   * @example Contact information group
   * ```typescript
   * builder.group(['firstName', 'lastName', 'email']);
   * /// Result: {
   * ///   firstName: ['lastName', 'email'],
   * ///   lastName: ['firstName', 'email'],
   * ///   email: ['firstName', 'lastName']
   * /// }
   * ```
   *
   * @example Address validation group
   * ```typescript
   * builder.group(['street', 'city', 'state', 'zipCode']);
   * ```
   */
  group<K extends FieldPath<T>>(fields: K[]): this {
    // Each field triggers validation of all other fields in the group
    for (const field of fields) {
      const others = fields.filter((f) => f !== field);
      this.whenChanged(field, others);
    }
    return this;
  }

  /**
   * Merge with an existing validation configuration.
   *
   * This method is useful for:
   * - Combining base configurations with conditional configurations
   * - Composing configurations from multiple sources
   * - Adding dynamic configurations based on runtime conditions
   *
   * **When to Use:**
   * - ✅ Conditional features (international shipping adds customs fields)
   * - ✅ Reusable configuration modules (address config, payment config)
   * - ✅ Dynamic forms where validation rules change at runtime
   * - ✅ Feature flags or A/B testing variations
   *
   * **Real-World Use Case:**
   * In an e-commerce checkout, your form has base validation (shipping address,
   * payment info). When user selects international shipping, you need additional
   * validations (customs declaration, tax ID). Instead of duplicating the base
   * config, use `merge()` to conditionally add the international validation rules.
   * This keeps your code DRY and makes it easy to toggle features on/off.
   *
   * **Vest.js Patterns That Work Well:**
   * - Conditional features with `omitWhen`:
   *   ```typescript
   *   omitWhen(!isInternational, () => {
   *     test('customsForm', 'Customs declaration required', () => {
   *       enforce(data.customsForm).isNotBlank();
   *     });
   *   });
   *   ```
   * - Reusable validation modules that can be composed
   * - Feature flags: merge different configs based on enabled features
   * - A/B testing: conditionally merge test-specific validation rules
   * - Use with computed signals for reactive configuration:
   *   ```typescript
   *   const config = computed(() =>
   *     createValidationConfig<T>()
   *       .merge(baseConfig)
   *       .merge(featureEnabled() ? featureConfig : {})
   *       .build()
   *   );
   *   ```
   *
   * **Note:** Dependencies are merged and deduplicated. If both configs have
   * the same trigger field, dependents are combined into a single array.
   *
   * @param other - Existing ValidationConfigMap to merge
   * @returns This builder instance for method chaining
   *
   * @example Conditional configuration
   * ```typescript
   * const baseConfig = createValidationConfig<FormModel>()
   *   .bidirectional('password', 'confirmPassword')
   *   .build();
   *
   * const config = createValidationConfig<FormModel>()
   *   .merge(baseConfig)
   *   .merge(
   *     isInternational
   *       ? { country: ['customsForm'] }
   *       : {}
   *   )
   *   .build();
   * ```
   *
   * @example Composition
   * ```typescript
   * const addressConfig = { 'street': ['city', 'zipCode'] };
   * const contactConfig = { 'email': ['phone'] };
   *
   * const config = createValidationConfig<FormModel>()
   *   .merge(addressConfig)
   *   .merge(contactConfig)
   *   .build();
   * ```
   */
  merge(other: ValidationConfigMap<T>): this {
    for (const [key, deps] of Object.entries(other)) {
      if (deps && Array.isArray(deps)) {
        const existing = this.config[key] || [];
        const merged = [...existing, ...deps];
        this.config[key] = Array.from(new Set(merged));
      }
    }
    return this;
  }

  /**
   * Build the final validation configuration object.
   *
   * Returns a deep copy of the configuration to prevent accidental mutations.
   * The returned object can be used with the `validationConfig` input of `scVestForm`.
   *
   * @returns Immutable ValidationConfigMap ready for use
   *
   * @example
   * ```typescript
   * protected readonly validationConfig = createValidationConfig<MyFormModel>()
   *   .bidirectional('password', 'confirmPassword')
   *   .whenChanged('country', 'state')
   *   .build();
   * ```
   */
  build(): ValidationConfigMap<T> {
    // Return a deep copy to prevent external mutations affecting the builder
    const copy: Partial<Record<string, string[]>> = {};
    for (const [key, deps] of Object.entries(this.config)) {
      if (deps && Array.isArray(deps)) {
        copy[key] = [...deps];
      }
    }
    return copy as ValidationConfigMap<T>;
  }
}

/**
 * Factory function to create a type-safe validation configuration builder.
 *
 * This is the recommended entry point for creating validation configurations.
 * It provides full type safety and IDE autocomplete for field names.
 *
 * @template T - The form model type
 * @returns A new ValidationConfigBuilder instance
 *
 * @example Basic usage
 * ```typescript
 * protected readonly validationConfig = createValidationConfig<FormModel>()
 *   .bidirectional('password', 'confirmPassword')
 *   .whenChanged('country', 'state')
 *   .build();
 * ```
 *
 * @example With DeepPartial form model
 * ```typescript
 * type FormModel = DeepPartial<{
 *   user: {
 *     profile: {
 *       email: string;
 *       phone: string;
 *     }
 *   }
 * }>;
 *
 * const config = createValidationConfig<FormModel>()
 *   .bidirectional('user.profile.email', 'user.profile.phone')
 *   .build();
 * ```
 *
 * @example Complex scenario with all methods
 * ```typescript
 * const config = createValidationConfig<OrderFormModel>()
 *   .group(['firstName', 'lastName', 'email'])
 *   .bidirectional('startDate', 'endDate')
 *   .bidirectional('minPrice', 'maxPrice')
 *   .whenChanged('orderType', ['deliveryDate', 'priority'])
 *   .whenChanged('country', ['state', 'zipCode'])
 *   .merge(conditionalConfig)
 *   .build();
 * ```
 */
export function createValidationConfig<T>(): ValidationConfigBuilder<T> {
  return new ValidationConfigBuilder<T>();
}
