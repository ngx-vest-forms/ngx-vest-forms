/*
 * Public API Surface of ngx-vest-forms
 */

export { NgxFormControlStateDirective } from './lib/directives/form-control-state.directive';
export { NgxFormCoreDirective } from './lib/directives/form-core.directive';
export { NgxFormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { NgxFormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { NgxFormModelDirective } from './lib/directives/form-model.directive';
export {
  NgxFormDirective,
  NgxFormState,
} from './lib/directives/form.directive';

export {
  NgxDeepPartial,
  NgxDeepRequired,
  NgxFieldKey,
  NgxFormCompatibleDeepRequired,
  NgxFormControlState,
  NgxFormLevelValidationDirective,
  NgxInjectRootFormKeyOptions,
  NgxValidationOptions,
  NgxVestSuite,
  getInitialNgxFormControlState,
  injectNgxRootFormKey,
  ngxVestForms,
  ngxVestFormsCore,
  ngxVestFormsViewProviders,
} from './lib/exports';

export { arrayToObject } from './lib/utils/array-to-object';
export {
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  setValueAtPath as set,
} from './lib/utils/form-utils';

export {
  NGX_ERROR_DISPLAY_MODE_DEFAULT,
  NgxErrorDisplayMode,
} from './lib/config/error-display.config';
export {
  provideNgxVestForms,
  provideNgxVestFormsCore,
  withErrorDisplayMode,
  withRootFormKey,
} from './lib/providers';
export {
  NGX_SCHEMA_STATE,
  type NgxSchemaValidationState,
} from './lib/tokens/schema-state.token';
export * from './lib/utils/field-path.utils';
