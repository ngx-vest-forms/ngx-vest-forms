import { delay, of } from 'rxjs';
import { SwapiService } from '../swapi.service';
import { createPurchaseValidationSuite } from './purchase.validations';

describe('Purchase Validations', () => {
  let mockSwapiService: jest.Mocked<SwapiService>;

  beforeEach(() => {
    mockSwapiService = {
      searchUserById: jest.fn(),
      userIdExists: jest.fn(),
    } as unknown as jest.Mocked<SwapiService>;
  });

  it('should fail validation when userId exists (async)', () => {
    // Mock service to return true (user exists)
    mockSwapiService.userIdExists.mockReturnValue(of(true));

    const suite = createPurchaseValidationSuite(mockSwapiService);

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

  it('should pass validation when userId does not exist (async)', () => {
    // Mock service to return false (user not found)
    mockSwapiService.userIdExists.mockReturnValue(of(false));

    const suite = createPurchaseValidationSuite(mockSwapiService);

    const result = suite({ userId: '999' }, 'userId');
    expect(result.isPending('userId')).toBe(true);

    return new Promise<void>((resolve, reject) => {
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

  it('should be pending while async validation is running', () => {
    // Mock with delay to ensure we catch the pending state
    mockSwapiService.userIdExists.mockReturnValue(of(true).pipe(delay(100)));

    const suite = createPurchaseValidationSuite(mockSwapiService);
    const result = suite({ userId: '1' }, 'userId');

    expect(result.isPending('userId')).toBe(true);
    expect(result.isValid('userId')).toBe(false); // Not valid yet
  });
});
