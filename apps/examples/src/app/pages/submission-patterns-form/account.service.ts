import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
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
 * mock interceptor (`POST /api/account`). Mirrors the style of the other
 * example services (swapi / auto-save): a single injected `HttpClient`,
 * no error handling here — the page owns the success/failure state machine.
 */
@Injectable({ providedIn: 'root' })
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
