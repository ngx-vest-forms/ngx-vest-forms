import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { delay, mergeMap, of, throwError } from 'rxjs';

type MockErrorScenario =
  | 'not-found'
  | 'unauthorized'
  | 'server-error'
  | 'network-error';

type MockPerson = {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
};

const MOCK_RESPONSE_DELAY_MS = 800;
const MOCK_USERNAME_DELAY_MS = 600;

const MOCK_PEOPLE: Record<string, MockPerson> = {
  '1': {
    id: '1',
    name: 'Luke Skywalker',
    gender: 'male',
  },
};

/**
 * Usernames that are already taken in the mock directory. The Async Username
 * demo validates against `GET /api/username-availability/:name`.
 */
const TAKEN_USERNAMES = new Set([
  'admin',
  'root',
  'support',
  'ada',
  'luke',
  'taken',
  'test',
]);

function getPersonId(url: string): string | null {
  const requestUrl = new URL(url, globalThis.location.origin);
  const match = requestUrl.pathname.match(/^\/api\/people\/([^/]+)$/);
  return match?.[1] ?? null;
}

function getUsername(url: string): string | null {
  const requestUrl = new URL(url, globalThis.location.origin);
  const match = requestUrl.pathname.match(
    /^\/api\/username-availability\/([^/]+)$/
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getErrorScenario(url: string): MockErrorScenario | null {
  const requestUrl = new URL(url, globalThis.location.origin);
  const value = requestUrl.searchParams.get('errorScenario');

  if (
    value === 'not-found' ||
    value === 'unauthorized' ||
    value === 'server-error' ||
    value === 'network-error'
  ) {
    return value;
  }

  return null;
}

function createErrorResponse(
  requestUrl: string,
  detail: string,
  errorScenario: MockErrorScenario
): HttpErrorResponse {
  switch (errorScenario) {
    case 'unauthorized':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 401,
        statusText: 'Unauthorized',
        error: { message: `You are not authorized: ${detail}` },
      });
    case 'server-error':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 500,
        statusText: 'Internal Server Error',
        error: { message: `Mock server failed: ${detail}` },
      });
    case 'network-error':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 0,
        statusText: 'Unknown Error',
        error: {
          message: `Simulated network outage while contacting the mock API (${detail})`,
        },
      });
    case 'not-found':
    default:
      return new HttpErrorResponse({
        url: requestUrl,
        status: 404,
        statusText: 'Not Found',
        error: { message: `Not found: ${detail}` },
      });
  }
}

/**
 * In-app mock API used by several demos. Self-contained — no backend service.
 *
 * Routes:
 * - `GET  /api/people/:id`                     → person record (Purchase demo)
 * - `GET  /api/username-availability/:name`    → `{ username, available }`
 * - `POST /api/account`                        → `{ id }` or a server error
 *
 * Any route accepts `?errorScenario=not-found|unauthorized|server-error|network-error`
 * to deterministically simulate failures.
 */
export const mockPeopleApiInterceptor: HttpInterceptorFn = (request, next) => {
  // ── GET /api/username-availability/:name ────────────────────────────────
  if (request.method === 'GET') {
    const username = getUsername(request.url);
    if (username !== null) {
      const errorScenario = getErrorScenario(request.url);
      if (errorScenario) {
        return of(null).pipe(
          delay(MOCK_USERNAME_DELAY_MS),
          mergeMap(() =>
            throwError(() =>
              createErrorResponse(request.url, username, errorScenario)
            )
          )
        );
      }
      const available = !TAKEN_USERNAMES.has(username.trim().toLowerCase());
      return of(
        new HttpResponse<{ username: string; available: boolean }>({
          status: 200,
          body: { username, available },
        })
      ).pipe(delay(MOCK_USERNAME_DELAY_MS));
    }
  }

  // ── POST /api/account ───────────────────────────────────────────────────
  if (request.method === 'POST') {
    const requestUrl = new URL(request.url, globalThis.location.origin);
    if (requestUrl.pathname === '/api/account') {
      const errorScenario = getErrorScenario(request.url);
      const body = (request.body ?? {}) as { email?: string };
      // A deterministic "server-side" failure the demo can trigger on demand.
      if (errorScenario) {
        return of(null).pipe(
          delay(MOCK_RESPONSE_DELAY_MS),
          mergeMap(() =>
            throwError(() =>
              createErrorResponse(
                request.url,
                'account creation',
                errorScenario
              )
            )
          )
        );
      }
      if ((body.email ?? '').toLowerCase().includes('taken')) {
        return of(null).pipe(
          delay(MOCK_RESPONSE_DELAY_MS),
          mergeMap(() =>
            throwError(
              () =>
                new HttpErrorResponse({
                  url: request.url,
                  status: 409,
                  statusText: 'Conflict',
                  error: {
                    message: 'An account with that email already exists.',
                  },
                })
            )
          )
        );
      }
      return of(
        new HttpResponse<{ id: string }>({
          status: 201,
          body: { id: `acct_${Date.now()}` },
        })
      ).pipe(delay(MOCK_RESPONSE_DELAY_MS));
    }
  }

  // ── GET /api/people/:id ─────────────────────────────────────────────────
  if (request.method !== 'GET') {
    return next(request);
  }

  const personId = getPersonId(request.url);
  if (!personId) {
    return next(request);
  }

  const errorScenario = getErrorScenario(request.url);
  if (errorScenario) {
    return of(null).pipe(
      delay(MOCK_RESPONSE_DELAY_MS),
      mergeMap(() =>
        throwError(() =>
          createErrorResponse(request.url, `person ${personId}`, errorScenario)
        )
      )
    );
  }

  const person = MOCK_PEOPLE[personId];
  if (!person) {
    return of(null).pipe(
      delay(MOCK_RESPONSE_DELAY_MS),
      mergeMap(() =>
        throwError(() =>
          createErrorResponse(request.url, `person ${personId}`, 'not-found')
        )
      )
    );
  }

  return of(
    new HttpResponse<MockPerson>({
      status: 200,
      body: person,
    })
  ).pipe(delay(MOCK_RESPONSE_DELAY_MS));
};
