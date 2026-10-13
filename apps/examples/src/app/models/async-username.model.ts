import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * Model for the Async Username Availability demo.
 *
 * `NgxDeepPartial` is the recommended shape for ngx-vest-forms models — every
 * field is optional because the template owns the truth and fields populate
 * progressively as the user types.
 */
export type AsyncUsernameModel = NgxDeepPartial<{
  username: string;
  displayName: string;
}>;

/**
 * The form contract: the fully-required mirror of the model. Providing it via
 * `provideFormContract` lets ngx-vest-forms warn (in dev) about `name`
 * attributes that don't line up with the model shape.
 */
export const asyncUsernameShape: NgxDeepRequired<AsyncUsernameModel> = {
  username: '',
  displayName: '',
};
