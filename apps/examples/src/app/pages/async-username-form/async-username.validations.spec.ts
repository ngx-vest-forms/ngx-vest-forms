import { Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { waitForSuiteResult } from '../../shared/testing/wait-for-suite-result';
import { createAsyncUsernameSuite } from './async-username.validations';

/**
 * Fake availability service that the test controls: every call opens a
 * request the test resolves by hand, and unsubscribing (which the suite does
 * when Vest aborts the test's signal) is recorded per request.
 */
function createFakeService() {
  const requests: {
    name: string;
    subject: Subject<boolean>;
    unsubscribed: boolean;
  }[] = [];

  return {
    requests,
    isUsernameTaken(name: string): Observable<boolean> {
      return new Observable<boolean>((subscriber) => {
        const request = {
          name,
          subject: new Subject<boolean>(),
          unsubscribed: false,
        };
        requests.push(request);
        const inner = request.subject.subscribe(subscriber);
        return () => {
          request.unsubscribed = true;
          inner.unsubscribe();
        };
      });
    },
    /** Answers the open request for `name`. */
    respond(name: string, taken: boolean) {
      const request = requests.find(
        (r) => r.name === name && !r.subject.closed && !r.unsubscribed
      );
      if (!request) throw new Error(`no open request for ${name}`);
      request.subject.next(taken);
      request.subject.complete();
    },
    callsFor(name: string) {
      return requests.filter((r) => r.name === name).length;
    },
  };
}

describe('Async Username Validations', () => {
  let service: ReturnType<typeof createFakeService>;
  let suite: ReturnType<typeof createAsyncUsernameSuite>;

  beforeEach(() => {
    service = createFakeService();
    suite = createAsyncUsernameSuite(service);
  });

  describe('synchronous rules', () => {
    it('requires a username', () => {
      const result = suite.only('username').run({});

      expect(result.getErrors('username')).toContain('Username is required');
    });

    it('requires at least 3 characters', () => {
      const result = suite.only('username').run({ username: 'ab' });

      expect(result.getErrors('username')).toContain(
        'Username must be at least 3 characters'
      );
    });

    it.each(['Alice', 'al ice', 'al-ice'])(
      'rejects %s because only lowercase letters, digits and underscores are allowed',
      (username) => {
        const result = suite.only('username').run({ username });

        expect(result.getErrors('username')).toContain(
          'Use only lowercase letters, digits, and underscores'
        );
      }
    );

    it('requires a display name', () => {
      const result = suite.only('displayName').run({});

      expect(result.getErrors('displayName')).toContain(
        'Display name is required'
      );
    });
  });

  describe('availability check', () => {
    it.each(['', 'ab', 'Alice', 'al-ice'])(
      'does not contact the service while the username %j fails the sync rules',
      async (username) => {
        await waitForSuiteResult(suite.only('username').run({ username }));

        expect(service.requests).toHaveLength(0);
      }
    );

    it('is pending while the request is in flight', async () => {
      const run = suite.only('username').run({ username: 'alice' });

      expect(run.isPending('username')).toBe(true);
      expect(run.isValid('username')).toBe(false);
      expect(service.callsFor('alice')).toBe(1);

      service.respond('alice', false);
      const { result } = await waitForSuiteResult(run);

      expect(result.isPending('username')).toBe(false);
      expect(result.hasErrors('username')).toBe(false);
      expect(result.isValid('username')).toBe(true);
    });

    it('reports a taken username as an error', async () => {
      const run = suite.only('username').run({ username: 'admin' });
      service.respond('admin', true);
      const { result } = await waitForSuiteResult(run);

      expect(result.hasErrors('username')).toBe(true);
      expect(result.getErrors('username')).toContain(
        'Username is already taken'
      );
      expect(result.isValid('username')).toBe(false);
    });

    it('does not call the service again for a repeated username (memo)', async () => {
      const first = suite.only('username').run({ username: 'alice' });
      service.respond('alice', false);
      await waitForSuiteResult(first);

      const { result: second } = await waitForSuiteResult(
        suite.only('username').run({ username: 'alice', displayName: 'Alice' })
      );

      expect(service.callsFor('alice')).toBe(1);
      expect(second.hasErrors('username')).toBe(false);
    });

    it('keeps reporting a taken username on a repeated run without a new request', async () => {
      const first = suite.only('username').run({ username: 'admin' });
      service.respond('admin', true);
      await waitForSuiteResult(first);

      const { result: second } = await waitForSuiteResult(
        suite.only('username').run({ username: 'admin' })
      );

      expect(service.callsFor('admin')).toBe(1);
      expect(second.getErrors('username')).toContain(
        'Username is already taken'
      );
    });

    it('checks the service again when the username changes', async () => {
      const first = suite.only('username').run({ username: 'alice' });
      service.respond('alice', false);
      await waitForSuiteResult(first);

      const second = suite.only('username').run({ username: 'alicia' });
      service.respond('alicia', true);
      const { result } = await waitForSuiteResult(second);

      expect(service.callsFor('alicia')).toBe(1);
      expect(result.getErrors('username')).toContain(
        'Username is already taken'
      );
    });

    it('aborts the previous request when the username changes', async () => {
      // The superseded run is not awaited: nothing here needs it to settle.
      suite.only('username').run({ username: 'alice' });
      const aliceRequest = service.requests[0];
      if (!aliceRequest) throw new Error('alice was not requested');
      expect(aliceRequest.unsubscribed).toBe(false);

      const second = suite.only('username').run({ username: 'alicia' });

      expect(aliceRequest.unsubscribed).toBe(true);

      service.respond('alicia', false);
      const { result } = await waitForSuiteResult(second);

      // The stale request must not leak into the current result.
      expect(result.hasErrors('username')).toBe(false);
      expect(result.isPending('username')).toBe(false);
    });
  });

  // The async test sits in `skipWhen((res) => res.hasErrors('username'))`, so
  // the result so far must not hold the previous run's outcome against it.
  describe('skipWhen gating across runs', () => {
    it('checks again after a taken username is replaced by a free one', async () => {
      const first = suite.only('username').run({ username: 'admin' });
      service.respond('admin', true);
      await waitForSuiteResult(first);

      const second = suite.only('username').run({ username: 'alice' });
      expect(service.callsFor('alice')).toBe(1);
      service.respond('alice', false);
      const { result } = await waitForSuiteResult(second);

      expect(result.hasErrors('username')).toBe(false);
      expect(result.isValid('username')).toBe(true);
    });

    it('stops calling the service once the username fails a sync rule again', async () => {
      const first = suite.only('username').run({ username: 'alice' });
      service.respond('alice', false);
      await waitForSuiteResult(first);

      const { result } = await waitForSuiteResult(
        suite.only('username').run({ username: 'al' })
      );

      expect(service.requests).toHaveLength(1);
      expect(result.isValid('username')).toBe(false);
    });
  });
});
