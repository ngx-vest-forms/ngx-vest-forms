import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';

/**
 * Talks to the in-app mock endpoint `GET /api/username-availability/:name`.
 *
 * The interceptor responds with `{ username, available }`. We map a response
 * of `available === false` to "taken" so the validation suite can simply
 * reject when the username is unavailable. Mirrors `SwapiService` — an
 * injectable HttpClient wrapper returning an `Observable<boolean>`.
 *
 * Uses Angular 22's `@Service()` decorator for simplified service registration.
 */
@Service()
export class UsernameAvailabilityService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/username-availability';

  /** Resolves `true` when the username is already taken. */
  isUsernameTaken(name: string): Observable<boolean> {
    return this.httpClient
      .get<{
        username: string;
        available: boolean;
      }>(`${this.baseUrl}/${encodeURIComponent(name)}`)
      .pipe(map((res) => res.available === false));
  }
}
