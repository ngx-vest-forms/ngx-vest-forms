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
  ValidationConfigBuilder,
  createValidationConfig,
} from './lib/utils/validation-config-builder';
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
export {
  clearFields,
  clearFieldsWhen,
  keepFieldsWhen,
} from './lib/utils/field-clearing';
export { stringifyFieldPath } from './lib/utils/field-path.utils';
export { setValueAtPath } from './lib/utils/form-utils';
export {
  DebouncedPendingStateOptions,
  DebouncedPendingStateResult,
  createDebouncedPendingState,
} from './lib/utils/pending-state.utils';
export { validateShape } from './lib/utils/shape-validation';

// Internal utilities - exported for advanced use cases but not part of the primary API
// These are marked with @internal in their source files and may change without notice
/** @internal */ export {
  fastDeepEqual,
  shallowEqual,
} from './lib/utils/equality';
/** @internal */ export { parseFieldPath } from './lib/utils/field-path.utils';
/** @internal */ export {
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
} from './lib/utils/form-utils';

// Deprecated - kept for backward compatibility, will be removed in future major version
/** @deprecated Use setValueAtPath instead */ export {
  cloneDeep,
  set,
} from './lib/utils/form-utils';

// Constants
export { ROOT_FORM } from './lib/constants';

// Tokens
export {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  SC_ERROR_DISPLAY_MODE_TOKEN,
} from './lib/directives/error-display-mode.token';
export { NGX_VALIDATION_CONFIG_DEBOUNCE_TOKEN } from './lib/tokens/debounce.token';

// Components
export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';

// Directives
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export {
  FormErrorDisplayDirective,
  ScErrorDisplayMode,
} from './lib/directives/form-error-display.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export {
  FormDirective,
  NgxValidationConfig,
} from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { ValidationOptions } from './lib/directives/validation-options';
