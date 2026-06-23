import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  inject,
  injectAsync,
  Injector,
  onIdle,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize } from 'rxjs';
import { SubmissionPatternsModel } from '../../models/submission-patterns.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';

import { submissionPatternsContent } from './submission-patterns.content';
import { SubmissionPatternsFormBody } from './submission-patterns.form';
import { submissionPatternsSuite } from './submission-patterns.validations';

/** Deterministic outcomes the demo can force through the mock API. */
type Scenario = 'normal' | 'email-taken' | 'server-error' | 'network-error';

/** The four distinct submission concerns, modelled as one page state. */
type SubmissionState = 'editing' | 'submitting' | 'server-error' | 'success';

/**
 * Submission Patterns — models the FOUR submission concerns distinctly:
 *
 * (a) field validation — the plain Vest suite;
 * (b) submit-time INVALID handling — never calls the server and moves focus
 *     to the first invalid control via `FormDirective.focusFirstInvalidControl()`;
 * (c) server FAILURE messaging — an assertive error panel + Retry;
 * (d) SUCCESS state — a polite success panel + "Create another".
 *
 * ngx-vest-forms public API only.
 */
@Component({
  selector: 'ngx-submission-patterns-page',
  imports: [
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
    SubmissionPatternsFormBody,
  ],
  templateUrl: './submission-patterns.page.html',
})
export class SubmissionPatternsPageComponent {
  private readonly accountService = injectAsync(
    () => import('./account.service').then((m) => m.AccountService),
    { prefetch: onIdle }
  );
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly exampleContent = submissionPatternsContent;
  protected readonly suite = submissionPatternsSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<SubmissionPatternsModel>({});

  /** The four-state machine keeping the submission concerns distinct. */
  protected readonly state = signal<SubmissionState>('editing');
  protected readonly serverError = signal<string | null>(null);
  protected readonly createdId = signal<string | null>(null);
  protected readonly submitCycleActive = signal(false);
  protected readonly scenarios: ReadonlyArray<{
    label: string;
    value: Scenario;
  }> = [
    { label: 'Normal — succeeds (201)', value: 'normal' },
    { label: 'Email already taken (409)', value: 'email-taken' },
    { label: 'Server error (500)', value: 'server-error' },
    { label: 'Network error', value: 'network-error' },
  ];
  protected readonly scenario = signal<Scenario>('normal');

  private readonly formBody = viewChild(SubmissionPatternsFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected readonly showClearSubmitCycle = computed(
    () => this.state() === 'editing' && this.submitCycleActive()
  );
  protected onScenarioChange(value: string): void {
    this.scenario.set(this.isScenario(value) ? value : 'normal');
  }

  protected onSubmit(): void {
    if (!this.formBody()) {
      return;
    }

    this.submitCycleActive.set(true);

    // (b) Submit-time INVALID handling: never call the server, surface
    // errors, and move focus to the first invalid control. Deferred so the
    // submit-driven validation has flushed before we resolve the target.
    afterNextRender(
      () => {
        if (!this.feedback()?.formState()?.valid) {
          this.state.set('editing');
          this.serverError.set(null);
          this.formBody()?.focusFirstInvalidControl();
          return;
        }

        void this.callServer();
      },
      { injector: this.injector }
    );
  }

  /** (c)/(d) — the only place the server is contacted. */
  private async callServer(): Promise<void> {
    this.state.set('submitting');
    this.serverError.set(null);

    const scenario = this.scenario();
    const value = structuredClone(this.formValue());
    if (scenario === 'email-taken') {
      // The mock returns 409 when the email contains "taken".
      value.email = 'taken@example.com';
    }
    const errorScenario =
      scenario === 'server-error'
        ? 'server-error'
        : scenario === 'network-error'
          ? 'network-error'
          : undefined;

    let accountService: Awaited<ReturnType<typeof this.accountService>>;
    try {
      accountService = await this.accountService();
    } catch (error: unknown) {
      this.formBody()?.clearSubmittedState();
      this.submitCycleActive.set(false);
      this.state.set('server-error');
      this.serverError.set(this.toErrorMessage(error));
      return;
    }

    accountService
      .createAccount(value, errorScenario ? { errorScenario } : undefined)
      .pipe(
        catchError((error: unknown) => {
          this.formBody()?.clearSubmittedState();
          this.submitCycleActive.set(false);
          this.state.set('server-error');
          this.serverError.set(this.toErrorMessage(error));
          return EMPTY;
        }),
        finalize(() => {
          if (this.state() === 'submitting') {
            // Defensive: should not happen, success/error always set state.
            this.state.set('editing');
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        this.createdId.set(result.id);
        this.formBody()?.clearSubmittedState();
        this.submitCycleActive.set(false);
        this.state.set('success');
      });
  }

  /** Retry re-submits the exact same value through the same path. */
  protected retry(): void {
    void this.callServer();
  }

  /** End the current submit cycle while preserving values and control metadata. */
  protected clearSubmitCycle(): void {
    this.formBody()?.clearSubmittedState();
    this.submitCycleActive.set(false);
  }

  /** Create another: reset cleanly back to the editing state. */
  protected reset(): void {
    this.state.set('editing');
    this.serverError.set(null);
    this.createdId.set(null);
    this.submitCycleActive.set(false);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }

  private isScenario(value: string): value is Scenario {
    return this.scenarios.some((scenario) => scenario.value === value);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      if (body?.message) {
        return body.message;
      }
      if (error.status === 0) {
        return 'Network error — could not reach the server. Check your connection and retry.';
      }
      return `Request failed (${error.status} ${error.statusText}).`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong while creating the account.';
  }
}
