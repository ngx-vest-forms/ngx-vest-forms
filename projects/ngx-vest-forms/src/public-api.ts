/*
 * Public API Surface of ngx-vest-forms
 */

export { NgxVestForms, vestForms, vestFormsViewProviders } from './lib/exports';

// Type utilities
export type { DeepPartial, NgxDeepPartial } from './lib/utils/deep-partial';
export type {
  DeepRequired,
  FormCompatibleDeepRequired,
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from './lib/utils/deep-required';
export { ROOT_FORM as ROOT_FORM_CONSTANT } from './lib/utils/field-path-types';
export type {
  FieldPath,
  FieldPathValue,
  FormFieldName,
  LeafFieldPath,
  ValidateFieldPath,
  ValidationConfigMap,
} from './lib/utils/field-path-types';
export { createEmptyFormState } from './lib/utils/form-state.utils';
export type { NgxFormState } from './lib/utils/form-state.utils';
export {
  ValidationConfigBuilder,
  createValidationConfig,
} from './lib/utils/validation-config-builder';
export type {
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
export { createDebouncedPendingState } from './lib/utils/pending-state.utils';
export type {
  DebouncedPendingStateOptions,
  DebouncedPendingStateResult,
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
export { FormGroupWrapperComponent } from './lib/components/form-group-wrapper/form-group-wrapper.component';

// Directives
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorControlDirective } from './lib/directives/form-error-control.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export type { ScErrorDisplayMode } from './lib/directives/form-error-display.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormDirective } from './lib/directives/form.directive';
export type { NgxValidationConfig } from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export type { ValidationOptions } from './lib/directives/validation-options';
