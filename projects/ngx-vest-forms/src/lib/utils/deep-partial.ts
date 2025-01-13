/**
 * Simple type that makes every property and child property
 * partial, recursively. Why? Because template-driven forms are
 * deep partial, since they get created by the DOM
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly DeepPartial<U>[]
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};
