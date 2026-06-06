import type { NgxSuiteRunResult } from 'ngx-vest-forms';
import { delay, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { createPurchaseValidationSuite } from './purchase.validations';
import type { SwapiService } from './swapi.service';

type ThenableSuiteResult = NgxSuiteRunResult & {
  then: NonNullable<NgxSuiteRunResult['then']>;
};

type ResolvedSuiteResult = {
  result: NgxSuiteRunResult;
};

function isThenableSuiteResult(
  result: NgxSuiteRunResult
): result is ThenableSuiteResult {
  return typeof result.then === 'function';
}

function waitForSuiteResult(
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

describe('Purchase Validations', () => {
  let mockSwapiService: Mocked<Pick<SwapiService, 'userIdExists'>>;

  beforeEach(() => {
    mockSwapiService = {
      userIdExists: vi.fn(),
    };
  });

  it('should fail validation when userId exists (async)', async () => {
    // Mock service to return true (user exists) with small delay for async behavior
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(mockSwapiService);

    // Vest 6: use suite.only(field).run() for focused validation
    // SuiteResult is thenable at runtime, so await resolves after async tests complete
    const { result } = await waitForSuiteResult(
      suite.only('userId').run({ userId: '1' })
    );
    // Should fail because user exists ("userId is already taken")
    expect(result.hasErrors('userId')).toBe(true);
    expect(result.getErrors('userId')).toContain('userId is already taken');
  });

  it('should pass validation when userId does not exist (async)', async () => {
    // Mock service to return false (user not found) with small delay for async behavior
    mockSwapiService.userIdExists.mockReturnValue(of(false).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(mockSwapiService);

    // Vest 6: use suite.only(field).run() for focused validation
    const syncResult = suite.only('userId').run({ userId: '999' });
    // In browser mode, sync observables complete immediately, so check pending only with delay
    expect(syncResult.isPending('userId')).toBe(true);

    // SuiteResult is thenable — await resolves after async tests complete
    const { result: finalResult } = await waitForSuiteResult(syncResult);
    // Should pass because user does not exist
    expect(finalResult.hasErrors('userId')).toBe(false);
  });

  it('should be pending while async validation is running', async () => {
    // Mock with longer delay to ensure we catch the pending state
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(200)));

    const suite = createPurchaseValidationSuite(mockSwapiService);
    // Vest 6: use suite.only(field).run() for focused validation
    const result = suite.only('userId').run({ userId: '1' });

    // With proper delay, we should catch the pending state
    expect(result.isPending('userId')).toBe(true);
    expect(result.isValid('userId')).toBe(false); // Not valid yet

    // Wait for completion — SuiteResult is thenable in Vest 6
    await waitForSuiteResult(result);
  });

  it('should memoize userId validation across repeated suite.only() runs', async () => {
    mockSwapiService.userIdExists.mockReturnValue(of(false).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(mockSwapiService);

    const { result: firstResult } = await waitForSuiteResult(
      suite.only('userId').run({ userId: '42' })
    );
    expect(firstResult.hasErrors('userId')).toBe(false);

    const { result: secondResult } = await waitForSuiteResult(
      suite.only('userId').run({ userId: '42' })
    );
    expect(secondResult.hasErrors('userId')).toBe(false);

    // Regression guard: memo() should reuse previous result for unchanged dependency.
    expect(mockSwapiService.userIdExists).toHaveBeenCalledTimes(1);
    expect(mockSwapiService.userIdExists).toHaveBeenCalledWith('42');
  });
});
