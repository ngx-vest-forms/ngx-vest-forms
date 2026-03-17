import { delay, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { createPurchaseValidationSuite } from './purchase.validations';
import type { SwapiService } from './swapi.service';

describe('Purchase Validations', () => {
  let mockSwapiService: Mocked<
    Pick<SwapiService, 'searchUserById' | 'userIdExists'>
  >;

  beforeEach(() => {
    mockSwapiService = {
      searchUserById: vi.fn(),
      userIdExists: vi.fn(),
    };
  });

  it('should fail validation when userId exists (async)', async () => {
    // Mock service to return true (user exists) with small delay for async behavior
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );

    // Vest 6: use suite.only(field).run() for focused validation
    // SuiteResult is thenable at runtime, so await resolves after async tests complete
    const result = await (suite.only('userId').run({ userId: '1' }) as any);
    // Should fail because user exists ("userId is already taken")
    expect(result.hasErrors('userId')).toBe(true);
    expect(result.getErrors('userId')).toContain('userId is already taken');
  });

  it('should pass validation when userId does not exist (async)', async () => {
    // Mock service to return false (user not found) with small delay for async behavior
    mockSwapiService.userIdExists.mockReturnValue(of(false).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );

    // Vest 6: use suite.only(field).run() for focused validation
    const syncResult = suite.only('userId').run({ userId: '999' });
    // In browser mode, sync observables complete immediately, so check pending only with delay
    expect(syncResult.isPending('userId')).toBe(true);

    // SuiteResult is thenable — await resolves after async tests complete
    const finalResult = await (syncResult as any);
    // Should pass because user does not exist
    expect(finalResult.hasErrors('userId')).toBe(false);
  });

  it('should be pending while async validation is running', async () => {
    // Mock with longer delay to ensure we catch the pending state
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(200)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );
    // Vest 6: use suite.only(field).run() for focused validation
    const result = suite.only('userId').run({ userId: '1' });

    // With proper delay, we should catch the pending state
    expect(result.isPending('userId')).toBe(true);
    expect(result.isValid('userId')).toBe(false); // Not valid yet

    // Wait for completion — SuiteResult is thenable in Vest 6
    await (result as any);
  });

  it('should memoize userId validation across repeated suite.only() runs', async () => {
    mockSwapiService.userIdExists.mockReturnValue(of(false).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );

    const firstResult = await (suite
      .only('userId')
      .run({ userId: '42' }) as any);
    expect(firstResult.hasErrors('userId')).toBe(false);

    const secondResult = await (suite
      .only('userId')
      .run({ userId: '42' }) as any);
    expect(secondResult.hasErrors('userId')).toBe(false);

    // Regression guard: memo() should reuse previous result for unchanged dependency.
    expect(mockSwapiService.userIdExists).toHaveBeenCalledTimes(1);
    expect(mockSwapiService.userIdExists).toHaveBeenCalledWith('42');
  });
});
