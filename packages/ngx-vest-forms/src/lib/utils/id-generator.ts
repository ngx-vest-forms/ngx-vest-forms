import { APP_ID, inject, Injectable } from '@angular/core';

/**
 * @internal Generates the ids the wrappers use for their ARIA message regions.
 *
 * The counters live on the application's root injector, not in module scope:
 * on the server every request gets a fresh root injector, so the server and the
 * hydrating client number their elements the same way. A non-default `APP_ID`
 * is part of the id, so two applications on one page (which Angular requires
 * to have distinct `APP_ID`s) cannot produce the same id.
 */
@Injectable({ providedIn: 'root' })
export class NgxIdGenerator {
  readonly #appId = inject(APP_ID);
  readonly #counters = new Map<string, number>();

  /** Returns `prefix-N`, or `prefix-<appId>-N` when `APP_ID` is not `'ng'`. */
  next(prefix: string): string {
    const count = this.#counters.get(prefix) ?? 0;
    this.#counters.set(prefix, count + 1);
    return this.#appId === 'ng'
      ? `${prefix}-${count}`
      : `${prefix}-${this.#appId}-${count}`;
  }
}
