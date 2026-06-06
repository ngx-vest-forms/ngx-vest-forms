/*
 * Internal API Surface of ngx-vest-forms ("ngx-vest-forms/internal").
 *
 * These symbols are marked `@internal` in their source files. They are
 * exposed here for advanced use cases only and may change without notice
 * (no semver guarantees). Prefer the primary "ngx-vest-forms" entry point.
 */

export { fastDeepEqual, shallowEqual } from './lib/utils/equality';
export { parseFieldPath } from './lib/utils/field-path.utils';
export {
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
} from './lib/utils/form-utils';
