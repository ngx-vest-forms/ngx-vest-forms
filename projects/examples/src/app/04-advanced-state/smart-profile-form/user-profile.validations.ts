import { enforce, only, staticSuite, test } from 'vest';
import type { UserProfile } from './user-profile.model';

export const userProfileSuite = staticSuite(
  (data: Partial<UserProfile> = {}, field?: string) => {
    only(field);

    test('firstName', 'First name is required.', () => {
      enforce(data.firstName).isNotEmpty();
    });

    test('firstName', 'First name must be at least 2 characters.', () => {
      enforce(data.firstName).longerThanOrEquals(2);
    });

    test('lastName', 'Last name is required.', () => {
      enforce(data.lastName).isNotEmpty();
    });

    test('lastName', 'Last name must be at least 2 characters.', () => {
      enforce(data.lastName).longerThanOrEquals(2);
    });

    test('email', 'A valid email is required.', () => {
      enforce(data.email)
        .isNotEmpty()
        .matches(/^[^@]+@[^@]+\.[^@]+$/);
    });

    test('bio', 'Bio must not exceed 500 characters.', () => {
      enforce(data.bio).shorterThanOrEquals(500);
    });

    // Example of a root-level validation, though not strictly necessary for this simple form
    // test('rootForm', 'Either first name or last name must be "Admin" if newsletter is subscribed.', () => {
    //   omitWhen(!data.receiveNewsletter, () => {
    //     enforce(data.firstName === 'Admin' || data.lastName === 'Admin').isTruthy();
    //   });
    // });
  },
);
