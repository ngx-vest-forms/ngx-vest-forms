/*
 * Public API Surface of ngx-vest-forms
 */

export { vestForms, vestFormsViewProviders } from './lib/exports';

// Type utilities
export { DeepPartial, NgxDeepPartial } from './lib/utils/deep-partial';
export {
  DeepRequired,
  FormCompatibleDeepRequired,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from './lib/utils/deep-required';
export {
  FieldPath,
  FieldPathValue,
  FormFieldName,
  LeafFieldPath,
  ROOT_FORM as ROOT_FORM_CONSTANT,
  ValidateFieldPath,
  ValidationConfigMap,
} from './lib/utils/field-path-types';
export {
  NgxFormState,
  createEmptyFormState,
} from './lib/utils/form-state.utils';
export {
  NgxFieldKey,
  NgxTypedVestSuite,
  NgxVestSuite,
} from './lib/utils/validation-suite';

// Form utilities
export {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from './lib/utils/array-to-object';
export { fastDeepEqual, shallowEqual } from './lib/utils/equality';
export {
  clearFields,
  clearFieldsWhen,
  keepFieldsWhen,
} from './lib/utils/field-clearing';
export {
  parseFieldPath,
  stringifyFieldPath,
} from './lib/utils/field-path.utils';
export {
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  set,
  setValueAtPath,
} from './lib/utils/form-utils';
export {
  ShapeMismatchError,
  validateShape,
} from './lib/utils/shape-validation';

// Constants
export { ROOT_FORM, VALIDATION_CONFIG_DEBOUNCE_TIME } from './lib/constants';

// Tokens
export { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from './lib/tokens/debounce.token';

// Components
export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';

// Directives
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export {
  FormDirective,
  NgxValidationConfig,
} from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { ValidationOptions } from './lib/directives/validation-options';
