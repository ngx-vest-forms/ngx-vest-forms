import { delay, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { SwapiService } from '../../swapi.service';
import { createPurchaseValidationSuite } from './purchase.validations';

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

    return new Promise<void>((resolve, reject) => {
      suite({ userId: '1' }, 'userId').done((result) => {
        try {
          // Should fail because user exists ("userId is already taken")
          expect(result.hasErrors('userId')).toBe(true);
          expect(result.getErrors('userId')).toContain(
            'userId is already taken'
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should pass validation when userId does not exist (async)', async () => {
    // Mock service to return false (user not found) with small delay for async behavior
    mockSwapiService.userIdExists.mockReturnValue(of(false).pipe(delay(10)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );

    return new Promise<void>((resolve, reject) => {
      const result = suite({ userId: '999' }, 'userId');
      // In browser mode, sync observables complete immediately, so check pending only with delay
      expect(result.isPending('userId')).toBe(true);

      result.done((finalResult) => {
        try {
          // Should pass because user does not exist
          expect(finalResult.hasErrors('userId')).toBe(false);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('should be pending while async validation is running', async () => {
    // Mock with longer delay to ensure we catch the pending state
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(200)));

    const suite = createPurchaseValidationSuite(
      mockSwapiService as unknown as SwapiService
    );
    const result = suite({ userId: '1' }, 'userId');

    // With proper delay, we should catch the pending state
    expect(result.isPending('userId')).toBe(true);
    expect(result.isValid('userId')).toBe(false); // Not valid yet

    // Wait for completion
    return new Promise<void>((resolve) => {
      result.done(() => resolve());
    });
  });
});
