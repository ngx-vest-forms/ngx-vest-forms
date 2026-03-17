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

const MOCK_PEOPLE: Record<string, MockPerson> = {
  '1': {
    id: '1',
    name: 'Luke Skywalker',
    gender: 'male',
  },
};

function getPersonId(url: string): string | null {
  const requestUrl = new URL(url, globalThis.location.origin);
  const match = requestUrl.pathname.match(/^\/api\/people\/([^/]+)$/);
  return match?.[1] ?? null;
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
  personId: string,
  errorScenario: MockErrorScenario
): HttpErrorResponse {
  switch (errorScenario) {
    case 'unauthorized':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 401,
        statusText: 'Unauthorized',
        error: {
          message: `You are not authorized to load mock person ${personId}`,
        },
      });
    case 'server-error':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 500,
        statusText: 'Internal Server Error',
        error: {
          message: `Mock server failed while loading person ${personId}`,
        },
      });
    case 'network-error':
      return new HttpErrorResponse({
        url: requestUrl,
        status: 0,
        statusText: 'Unknown Error',
        error: {
          message:
            'Simulated network outage while contacting the mock people API',
        },
      });
    case 'not-found':
    default:
      return new HttpErrorResponse({
        url: requestUrl,
        status: 404,
        statusText: 'Not Found',
        error: {
          message: `Mock person ${personId} not found`,
        },
      });
  }
}

export const mockPeopleApiInterceptor: HttpInterceptorFn = (request, next) => {
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
          createErrorResponse(request.url, personId, errorScenario)
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
          createErrorResponse(request.url, personId, 'not-found')
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
