import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * The canonical starter model: a small, opinionated contact form.
 *
 * `NgxDeepPartial` is the recommended shape for ngx-vest-forms models — every
 * field is optional because the template owns the truth and fields populate
 * progressively as the user types.
 */
export type StarterFormModel = NgxDeepPartial<{
  name: string;
  email: string;
  subject: string;
  message: string;
}>;

/**
 * The form contract: the fully-required mirror of the model. Providing it via
 * `provideFormContract` lets ngx-vest-forms warn (in dev) about `name`
 * attributes that don't line up with the model shape.
 */
export const starterFormShape: NgxDeepRequired<StarterFormModel> = {
  name: '',
  email: '',
  subject: '',
  message: '',
};
