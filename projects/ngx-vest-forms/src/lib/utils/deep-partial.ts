/**
 * Simple type that makes every property and child property
 * partial, recursively. Why? Because template-driven forms are
 * deep partial, since they get created by the DOM
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

/**
 * NgxDeepPartial - recommended alias for DeepPartial
 * Prevents naming conflicts with other libraries and clearly identifies ngx-vest-forms utilities.
 *
 * Makes every property and child property partial recursively.
 * Template-driven forms are inherently deep partial since they're created by the DOM.
 *
 * @example
 * ```typescript
 * type FormModel = NgxDeepPartial<{
 *   name: string;
 *   profile: { age: number; }
 * }>;
 * // Result: { name?: string; profile?: { age?: number; } }
 * ```
 */
export type NgxDeepPartial<T> = DeepPartial<T>;
