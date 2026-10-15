import type { KeyValue } from '@angular/common';

/**
 * `keyvalue` comparator for records keyed by index (as `arrayToObject`
 * builds them). The pipe sorts keys as strings, so without it entry `10`
 * renders before entry `2`.
 */
export const byNumericKey = (
  a: KeyValue<string, unknown>,
  b: KeyValue<string, unknown>
): number => Number(a.key) - Number(b.key);
