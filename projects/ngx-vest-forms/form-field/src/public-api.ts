/**
 * Public API Surface of @ngx-vest-forms/form-field
 *
 * @description
 * This package provides the NgxVestFormField component for accessible field UI presentation.
 * It integrates with ngx-vest-forms core to display validation errors, warnings, and form state.
 *
 * @example
 * ```typescript
 * import { NgxVestFormField } from '@ngx-vest-forms/form-field';
 *
 * @Component({
 *   imports: [NgxVestFormField],
 *   template: `
 *     <ngx-vest-form-field>
 *       <label for="email">Email</label>
 *       <input id="email" name="email" type="email" />
 *     </ngx-vest-form-field>
 *   `
 * })
 * ```
 */

export * from './lib/form-field.component';
