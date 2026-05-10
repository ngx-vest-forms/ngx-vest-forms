/**
 * Makes every property and child property partial recursively.
 * Template-driven forms are deep partial because they are created by the DOM.
 */
export type NgxDeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<NgxDeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<NgxDeepPartial<U>>
      : T[P] extends object
        ? NgxDeepPartial<T[P]>
        : T[P];
};
