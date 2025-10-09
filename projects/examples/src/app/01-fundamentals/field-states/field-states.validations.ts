import { createSafeSuite } from 'ngx-vest-forms';
import { enforce, test, warn } from 'vest';
import debounce from 'vest/debounce';
import type { FieldStatesModel } from './field-states.model';

/**
 * Validation suite for Field States demonstration
 * Shows simple validation rules to demonstrate state changes
 *
 * ✅ IMPORTANT: Uses createSafeSuite (stateful) instead of staticSafeSuite (stateless)
 * because this form has multiple fields and we need errors to persist across field navigation.
 * When a user tabs between fields in 'on-touch' mode, all touched field errors must remain
 * visible. createSafeSuite maintains this state, staticSafeSuite doesn't.
 *
 * **Password warnings demonstrate:**
 * - warn() for non-blocking feedback
 * - test.debounce() to reduce UI chatter (500ms delay)
 * - dirty() + warnings() pattern (show warnings immediately when typing)
 */
export const fieldStatesValidations = createSafeSuite<FieldStatesModel>(
  (data = {}) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotEmpty();
    });

    test('email', 'Email format is invalid', () => {
      enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    test('username', 'Username is required', () => {
      enforce(data.username).isNotEmpty();
    });

    test('username', 'Username must be at least 3 characters', () => {
      enforce(data.username).longerThanOrEquals(3);
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotEmpty();
    });

    test('password', 'Password must be at least 8 characters', () => {
      enforce(data.password).longerThanOrEquals(8);
    });

    // ✨ Password strength warnings (non-blocking)
    // Use warn() to make these suggestions instead of errors
    // Use debounce() to wait 500ms after user stops typing before showing
    test(
      'password',
      'Consider adding special characters (!@#$%^&*)',
      debounce(() => {
        warn(); // Must be called synchronously at the top
        enforce(data.password).matches(/[!@#$%^&*]/);
      }, 500),
    );

    test(
      'password',
      'Consider adding uppercase letters for stronger security',
      debounce(() => {
        warn();
        enforce(data.password).matches(/[A-Z]/);
      }, 500),
    );

    test(
      'password',
      'Consider adding numbers for stronger security',
      debounce(() => {
        warn();
        enforce(data.password).matches(/[0-9]/);
      }, 500),
    );
  },
);
