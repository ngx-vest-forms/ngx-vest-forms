import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SubmissionPatternsModel } from '../../models/submission-patterns.model';

/** Options accepted by {@link AccountService.createAccount}. */
export type CreateAccountOptions = {
  /**
   * Forwarded to the mock API as `?errorScenario=` to deterministically
   * simulate a server-side failure (`server-error`, `network-error`, …).
   */
  readonly errorScenario?: string;
};

/**
 * Thin HTTP client for the account-creation endpoint backed by the in-app
 * mock interceptor (`POST /api/account`). Auto-provided via Angular 22's
 * `@Service()` so the submission demo can lazy-load it with `injectAsync()`.
 */
@Service()
export class AccountService {
  private readonly httpClient = inject(HttpClient);
  private readonly accountUrl = '/api/account';

  /**
   * Creates an account. Resolves with the new account `id` on success
   * (HTTP 201) and errors with an `HttpErrorResponse` on failure
   * (409 conflict for taken emails, or the simulated `errorScenario`).
   */
  createAccount(
    model: SubmissionPatternsModel,
    opts?: CreateAccountOptions
  ): Observable<{ id: string }> {
    const url = opts?.errorScenario
      ? `${this.accountUrl}?errorScenario=${encodeURIComponent(opts.errorScenario)}`
      : this.accountUrl;

    return this.httpClient.post<{ id: string }>(url, model);
  }
}
