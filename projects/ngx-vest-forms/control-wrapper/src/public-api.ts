/**
 * Public API Surface of @ngx-vest-forms/control-wrapper
 *
 * @description
 * This package provides the NgxControlWrapper component for accessible field UI presentation.
 * It integrates with ngx-vest-forms core to display validation errors, warnings, and form state.
 *
 * @example
 * ```typescript
 * import { NgxControlWrapper } from '@ngx-vest-forms/control-wrapper';
 *
 * @Component({
 *   imports: [NgxControlWrapper],
 *   template: `
 *     <ngx-control-wrapper>
 *       <label for="email">Email</label>
 *       <input id="email" name="email" type="email" />
 *     </ngx-control-wrapper>
 *   `
 * })
 * ```
 */

export * from './lib/ngx-control-wrapper.component';
