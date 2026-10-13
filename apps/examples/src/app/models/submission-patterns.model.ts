import { NgxDeepPartial, NgxDeepRequired } from 'ngx-vest-forms';

/**
 * The account-creation model for the Submission Patterns demo.
 *
 * `NgxDeepPartial` is the recommended shape for ngx-vest-forms models — every
 * field is optional because the template owns the truth and fields populate
 * progressively as the user types.
 */
export type SubmissionPatternsModel = NgxDeepPartial<{
  fullName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}>;

/**
 * The form contract: the fully-required mirror of the model. Providing it via
 * `provideFormContract` lets ngx-vest-forms warn (in dev) about `name`
 * attributes that don't line up with the model shape.
 */
export const submissionPatternsShape: NgxDeepRequired<SubmissionPatternsModel> =
  {
    fullName: '',
    email: '',
    password: '',
    acceptTerms: false,
  };
