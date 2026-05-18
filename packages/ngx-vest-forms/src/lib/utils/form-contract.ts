import type { StandardSchemaV1 } from '@standard-schema/spec';
import { logWarning, NGX_VEST_FORMS_ERRORS } from '../errors/error-catalog';
import type { NgxFormContract } from '../tokens/form-contract.token';
import type { NgxDeepPartial } from './deep-partial';
import type { NgxDeepRequired } from './deep-required';
import { stringifyFieldPath } from './field-path.utils';
import { toFormContract } from './to-form-contract';

type StandardSchemaIssue = StandardSchemaV1.Issue;
type StandardSchemaIssuePathSegment =
  | PropertyKey
  | StandardSchemaV1.PathSegment;

/**
 * Normalizes legacy `NgxDeepRequired<T>` contracts and real Standard Schema
 * values behind one Standard Schema seam.
 *
 * The shape branch goes through {@link toFormContract}, which always yields a
 * `StandardSchemaV1<NgxDeepPartial<T>>` (it never narrows back to the required
 * `T`), so the honest return type is `StandardSchemaV1<NgxDeepPartial<T>>`.
 */
export function normalizeFormContract<T>(
  contract: NgxFormContract<T>
): StandardSchemaV1<NgxDeepPartial<T>> {
  return typeof contract === 'object' &&
    contract !== null &&
    '~standard' in contract
    ? (contract as StandardSchemaV1<NgxDeepPartial<T>>)
    : toFormContract<T>(contract as NgxDeepRequired<T>);
}

/**
 * Converts a Standard Schema issue path into the field-path format used by
 * Angular template-driven forms and Vest.
 */
export function stringifyFormContractIssuePath(
  path?: readonly StandardSchemaIssuePathSegment[]
): string {
  if (!path || path.length === 0) {
    return '<root>';
  }

  const normalizedPath = path.map((segment) => {
    const key =
      typeof segment === 'object' && segment !== null && 'key' in segment
        ? segment.key
        : segment;
    // `stringifyFieldPath` works with string | number; coerce symbols (rare in
    // Standard Schema issue paths) to their string form for a readable label.
    return typeof key === 'symbol' ? key.toString() : key;
  });

  return stringifyFieldPath(normalizedPath) || '<root>';
}

/**
 * Emits development warnings for contract issues without affecting runtime
 * validity. This stays intentionally separate from user-facing Vest errors.
 */
export function logFormContractIssues(
  issues?: readonly StandardSchemaIssue[]
): void {
  if (!issues || issues.length === 0) {
    return;
  }

  for (const issue of issues) {
    logWarning(
      NGX_VEST_FORMS_ERRORS.SCHEMA_ISSUE,
      stringifyFormContractIssuePath(issue.path),
      issue.message
    );
  }
}

/**
 * Validates a value against the supplied form contract and logs any synchronous
 * Standard Schema issues. Async contract validators are ignored by the
 * directive's development-only diagnostic pass.
 */
export function validateFormContract<T>(
  value: T,
  contract: NgxFormContract<T>
): void {
  const result = normalizeFormContract(contract)['~standard'].validate(value);

  if (result instanceof Promise) {
    return;
  }

  if (result.issues) {
    logFormContractIssues(result.issues);
  }
}
