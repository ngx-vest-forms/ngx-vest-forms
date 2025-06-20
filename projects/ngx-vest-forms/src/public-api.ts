/*
 * Public API Surface of ngx-vest-forms
 */

export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormDirective, FormState } from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { ValidationOptions } from './lib/directives/validation-options';
export {
  injectRootFormKey,
  ngxVestForms,
  ngxVestFormsViewProviders,
} from './lib/exports';

export { arrayToObject } from './lib/utils/array-to-object';
export { DeepPartial } from './lib/utils/deep-partial';
export {
  DeepRequired,
  FormCompatibleDeepRequired,
} from './lib/utils/deep-required';
export {
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  setValueAtPath as set,
} from './lib/utils/form-utils';

export { FieldKey, VestSuite } from './lib/utils/validation-suite';

export {
  ERROR_DISPLAY_MODE_DEFAULT,
  ErrorDisplayMode,
} from './lib/config/error-display.config';
export * from './lib/utils/field-path.utils';
