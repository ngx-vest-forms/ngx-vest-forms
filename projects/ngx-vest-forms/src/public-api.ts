/*
 * Public API Surface of ngx-vest-forms
 */

export { ControlWrapperComponent } from './lib/components/control-wrapper/control-wrapper.component';
export { FormControlStateDirective } from './lib/directives/form-control-state.directive';
export { FormErrorDisplayDirective } from './lib/directives/form-error-display.directive';
export { FormModelGroupDirective } from './lib/directives/form-model-group.directive';
export { FormModelDirective } from './lib/directives/form-model.directive';
export { FormDirective, FormState } from './lib/directives/form.directive';
export { ValidateRootFormDirective } from './lib/directives/validate-root-form.directive';
export { ValidationOptions } from './lib/directives/validation-options';
export {
  injectRootFormKey,
  vestForms,
  vestFormsViewProviders,
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
export {
  InferSchemaType,
  SchemaDefinition,
  extractTemplateFromSchema,
  isStandardSchema,
  modelToStandardSchema,
  shapeToSchema,
} from './lib/utils/schema-adapter';
export { FieldKey, VestSuite } from './lib/utils/validation-suite';

export {
  ModelTemplateMismatchError,
  ShapeMismatchError,
  validateModelTemplate,
  validateShape,
} from './lib/utils/shape-validation';

export * from './lib/utils/field-path.utils';
