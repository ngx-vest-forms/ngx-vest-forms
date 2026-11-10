import type { NgxSuiteRunResult } from 'ngx-vest-forms';

type ThenableSuiteResult = NgxSuiteRunResult & {
  then: NonNullable<NgxSuiteRunResult['then']>;
};

export type ResolvedSuiteResult = {
  result: NgxSuiteRunResult;
};

function isThenableSuiteResult(
  result: NgxSuiteRunResult
): result is ThenableSuiteResult {
  return typeof result.then === 'function';
}

/**
 * Spec helper: waits for the async tests of a suite run to finish.
 *
 * A Vest run result is thenable at runtime, but `await` rejects its type
 * (TS1320), so the settled result comes back wrapped in `{ result }`.
 */
export function waitForSuiteResult(
  result: NgxSuiteRunResult
): Promise<ResolvedSuiteResult> {
  if (!isThenableSuiteResult(result)) {
    return Promise.resolve({ result });
  }

  return new Promise((resolve, reject) => {
    result.then(
      (resolvedResult) => resolve({ result: resolvedResult }),
      reject
    );
  });
}
