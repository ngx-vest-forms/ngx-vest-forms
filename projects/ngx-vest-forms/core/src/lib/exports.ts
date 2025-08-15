import { Optional, Provider, forwardRef } from '@angular/core';
import {
  ControlContainer,
  FormsModule,
  NgForm,
  NgModelGroup,
} from '@angular/forms';
import { NgxFormControlStateDirective } from './directives/form-control-state.directive';
import { NgxFormCoreDirective } from './directives/form-core.directive';
import { NgxFormErrorDisplayDirective } from './directives/form-error-display.directive';
import { NgxFormModelGroupDirective } from './directives/form-model-group.directive';
import { NgxFormModelDirective } from './directives/form-model.directive';
import { NgxFormDirective } from './directives/form.directive';
import { NgxValidateRootFormDirective } from './directives/validate-root-form.directive';

// Re-export utility functions

/**
 * This is borrowed from  [https://github.com/wardbell/ngc-validate/blob/main/src/app/core/form-container-view-provider.ts](https://github.com/wardbell/ngc-validate/blob/main/src/app/core/form-container-view-provider.ts)
 * Thank you so much Ward Bell for your effort!:
 *
 * Provide a ControlContainer to a form component from the
 * nearest parent NgModelGroup (preferred) or NgForm.
 *
 * Required for Reactive Forms as well (unless you write CVA)
 *
 * @example
 * ```
 *   @Component({
 *     ...
 *    viewProviders[ formViewProvider ]
 *   })
 * ```
 * @see Kara's AngularConnect 2017 talk: https://youtu.be/CD_t3m2WMM8?t=1826
 *
 * Without this provider
 * - Controls are not registered with parent NgForm or NgModelGroup
 * - Form-level flags say "untouched" and "valid"
 * - No form-level validation roll-up
 * - Controls still validate, update model, and update their statuses
 * - If within NgForm, no compiler error because ControlContainer is optional for ngModel
 *
 * Note: if the SubForm Component that uses this Provider
 * is not within a Form or NgModelGroup, the provider returns `null`
 * resulting in an error, something like
 * ```
 * preview-fef3604083950c709c52b.js:1 ERROR Error:
 *  ngModelGroup cannot be used with a parent formGroup directive.
 *```
 */
const formViewProvider: Provider = {
  provide: ControlContainer,
  useFactory: _formViewProviderFactory,
  deps: [
    [new Optional(), NgForm],
    [new Optional(), NgModelGroup],
  ],
};

function _formViewProviderFactory(ngForm: NgForm, ngModelGroup: NgModelGroup) {
  return ngModelGroup || ngForm || null;
}

/**
 * The providers we need in every child component that holds an ngModelGroup
 */
export const ngxVestFormsViewProviders = [
  { provide: ControlContainer, useExisting: NgForm },
  formViewProvider, // very important if we want nested components with ngModelGroup
];

/**
 * Exports all the stuff we need to use the template driven forms
 *
 * NgxValidateRootFormDirective is included for manual cross-field validation
 * when needed alongside the main form directives.
 *
 * __N.B.__:
 * - This _also_ includes Angular's FormsModule, which is required for
 * template-driven forms to work properly.
 */
export const ngxVestForms = [
  FormsModule,
  forwardRef(() => NgxFormDirective),
  NgxFormModelDirective,
  NgxFormModelGroupDirective,
  NgxFormControlStateDirective,
  NgxFormErrorDisplayDirective,
  NgxValidateRootFormDirective,
] as const;

/**
 * Minimal preset exporting only the core directive and Angular FormsModule.
 * Useful when you want the lightest setup.
 */
export const ngxVestFormsCore = [
  FormsModule,
  NgxFormCoreDirective,
  // Include field and group validator directives so core-only usage
  // still gets Vest validation on ngModel and ngModelGroup.
  NgxFormModelDirective,
  forwardRef(() => NgxFormModelGroupDirective),
] as const;

export {
  NgxFormControlState,
  getInitialNgxFormControlState,
} from './directives/form-control-state.directive';
export { NgxFormCoreDirective } from './directives/form-core.directive';
export { NgxFormState } from './directives/form.directive';
export { injectNgxRootFormKey } from './utils/form-token';

// Export utility types
export { NgxValidationOptions } from './directives/validation-options';
export { NgxDeepPartial } from './utils/deep-partial';
export {
  NgxDeepRequired,
  NgxFormCompatibleDeepRequired,
} from './utils/deep-required';
export { NgxInjectRootFormKeyOptions } from './utils/form-token';
export { NgxFieldKey, NgxVestSuite } from './utils/validation-suite';
