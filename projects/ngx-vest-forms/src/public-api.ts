/*
 * Public API Surface of ngx-vest-forms
 */

export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';
export { ROOT_FORM } from './lib/constants';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormDirective } from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { ValidationOptions } from './lib/directives/validation-options';
export { vestForms, vestFormsViewProviders } from './lib/exports';
export { arrayToObject } from './lib/utils/array-to-object';
export { DeepPartial } from './lib/utils/deep-partial';
export { DeepRequired } from './lib/utils/deep-required';
export {
  cloneDeep,
  getAllFormErrors,
  getFormControlField,
  getFormGroupField,
  mergeValuesAndRawValues,
  set,
} from './lib/utils/form-utils';
export {
  ShapeMismatchError,
  validateShape,
} from './lib/utils/shape-validation';
