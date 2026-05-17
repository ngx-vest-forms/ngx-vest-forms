import { type NgxVestSuite } from 'ngx-vest-forms';
import { fromEvent, lastValueFrom, takeUntil } from 'rxjs';
import { create, enforce, omitWhen, test } from 'vest';
import { memo } from 'vest/memo';
import { AsyncUsernameModel } from '../../models/async-username.model';
import { UsernameAvailabilityService } from './username-availability.service';

type AvailabilityCheck = Pick<UsernameAvailabilityService, 'isUsernameTaken'>;

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * Factory that builds the Async Username Availability suite around an
 * availability service. Mirrors `createPurchaseValidationSuite`: the suite is
 * a plain Vest spec with no Angular dependency, so it can be unit-tested by
 * calling `createAsyncUsernameSuite(fakeService)(model, field)` directly.
 *
 * Synchronous rules (required / length / pattern) run first and gate the
 * async availability check via `omitWhen`, so the network is only hit once
 * the username is structurally valid. The async test is wrapped in `memo`
 * keyed on the username so it does not re-run while other fields change, and
 * it aborts the in-flight request when the username changes by listening to
 * the Vest-provided `signal`'s `abort` event.
 */
export const createAsyncUsernameSuite = (
  service: AvailabilityCheck
): NgxVestSuite<AsyncUsernameModel> => {
  const suite: NgxVestSuite<AsyncUsernameModel> = create(
    (model: AsyncUsernameModel) => {
      test('username', 'Username is required', () => {
        enforce(model.username).isNotBlank();
      });

      omitWhen(!model.username, () => {
        test('username', 'Username must be at least 3 characters', () => {
          enforce(model.username).longerThanOrEquals(3);
        });

        test(
          'username',
          'Use only lowercase letters, digits, and underscores',
          () => {
            enforce(model.username ?? '').matches(USERNAME_PATTERN);
          }
        );
      });

      // Only contact the remote endpoint once the username passes the cheap
      // synchronous rules above. `omitWhen` short-circuits the async test
      // while the value is blank / too short / malformed.
      omitWhen(
        !model.username ||
          (model.username as string).length < 3 ||
          !USERNAME_PATTERN.test(model.username as string),
        () => {
          memo(
            () => {
              test(
                'username',
                'Username is already taken',
                async ({ signal }) => {
                  const taken = await lastValueFrom(
                    service
                      .isUsernameTaken(model.username as string)
                      .pipe(takeUntil(fromEvent(signal, 'abort')))
                  );

                  if (taken) {
                    return Promise.reject();
                  }
                }
              );
            },
            [model.username]
          );
        }
      );

      test('displayName', 'Display name is required', () => {
        enforce(model.displayName).isNotBlank();
      });
    }
  );

  return suite;
};
