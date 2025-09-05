/**
 * Simple type that makes every property and child property
 * partial, recursively. Why? Because template-driven forms are
 * deep partial, since they get created by the DOM
 */
export type NgxDeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? NgxDeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly NgxDeepPartial<U>[]
      : T[P] extends object
        ? NgxDeepPartial<T[P]>
        : T[P];
};
