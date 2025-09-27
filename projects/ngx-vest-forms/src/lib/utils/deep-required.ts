/**
 * Like DeepRequired, but allows Date | string for all Date fields (for form compatibility).
 * Useful for Angular forms where model fields may be Date or string (empty input).
 */
export type FormCompatibleDeepRequired<T> = {
  [K in keyof T]-?: T[K] extends Date | undefined
    ? Date | string
    : T[K] extends Date
      ? Date | string
      : T[K] extends object | undefined
        ? FormCompatibleDeepRequired<NonNullable<T[K]>>
        : T[K];
};
/**
 * Sometimes we want to make every property of a type
 * required, but also child properties recursively
 */
export type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object ? DeepRequired<T[K]> : T[K];
};
