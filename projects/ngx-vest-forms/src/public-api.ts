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
  NgxVestSuite,
  NgxFieldKey,
  NgxTypedVestSuite,
} from './lib/utils/validation-suite';
export {
  NgxFormState,
  createEmptyFormState,
} from './lib/utils/form-state.utils';
export {
  FieldPath,
  ValidationConfigMap,
  FormFieldName,
  FieldPathValue,
  ValidateFieldPath,
  LeafFieldPath,
  ROOT_FORM as ROOT_FORM_CONSTANT,
} from './lib/utils/field-path-types';

// Form utilities
export {
  set,
  setValueAtPath,
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
export {
  arrayToObject,
  deepArrayToObject,
  objectToArray,
} from './lib/utils/array-to-object';
export {
  clearFieldsWhen,
  clearFields,
  keepFieldsWhen,
} from './lib/utils/field-clearing';
export { shallowEqual, fastDeepEqual } from './lib/utils/equality';

// Constants
export { ROOT_FORM, VALIDATION_CONFIG_DEBOUNCE_TIME } from './lib/constants';

// Tokens
export { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from './lib/tokens/debounce.token';

// Components
export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';

// Directives
export {
  FormDirective,
  NgxValidationConfig,
} from './lib/directives/form.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { ValidationOptions } from './lib/directives/validation-options';
