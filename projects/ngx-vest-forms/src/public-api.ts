/*
 * Public API Surface of ngx-vest-forms
 */

export { vestForms, vestFormsViewProviders } from './lib/exports';

// Type utilities
export { DeepPartial } from './lib/utils/deep-partial';
export {
  DeepRequired,
  FormCompatibleDeepRequired,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from './lib/utils/deep-required';
export { NgxVestSuite, NgxFieldKey } from './lib/utils/validation-suite';

// Form utilities
export {
  set,
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
} from './lib/utils/form-utils';
export {
  parseFieldPath,
  stringifyFieldPath,
} from './lib/utils/field-path.utils';
export {
  validateShape,
  ShapeMismatchError,
} from './lib/utils/shape-validation';
export { arrayToObject } from './lib/utils/array-to-object';
export {
  clearFieldsWhen,
  clearFields,
  keepFieldsWhen,
} from './lib/utils/field-clearing';
export { shallowEqual, fastDeepEqual } from './lib/utils/equality';

// Constants
export { ROOT_FORM, VALIDATION_CONFIG_DEBOUNCE_TIME } from './lib/constants';

// Components
export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';

// Directives
export { FormDirective } from './lib/directives/form.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { ValidationOptions } from './lib/directives/validation-options';
