import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  createFormFeedbackSignals,
  FormDirective,
  NgxVestForms,
  provideFormContract,
} from 'ngx-vest-forms';
import { catchError, EMPTY, finalize } from 'rxjs';
import {
  SubmissionPatternsModel,
  submissionPatternsShape,
} from '../../models/submission-patterns.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { AccountService } from './account.service';
import { submissionPatternsContent } from './submission-patterns.content';
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
    NgxVestForms,
    PageTitle,
    Card,
    AlertPanel,
    FormPageLayout,
    FormStateCardComponent,
    ExampleCardsComponent,
  ],
  templateUrl: './submission-patterns.page.html',
  providers: [provideFormContract(submissionPatternsShape)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmissionPatternsPageComponent {
  private readonly accountService = inject(AccountService);
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

  private readonly vestForm =
    viewChild<FormDirective<SubmissionPatternsModel>>('vestForm');
  private readonly feedback = createFormFeedbackSignals(this.vestForm);

  protected readonly formState = this.feedback.formState;
  protected readonly warnings = this.feedback.warnings;
  protected readonly validatedFields = this.feedback.validatedFields;
  protected readonly pending = this.feedback.pending;

  protected onScenarioChange(value: string): void {
    this.scenario.set(this.isScenario(value) ? value : 'normal');
  }

  protected onSubmit(): void {
    const formDirective = this.vestForm();
    if (!formDirective) {
      return;
    }

    // (b) Submit-time INVALID handling: never call the server, surface
    // errors, and move focus to the first invalid control. Deferred so the
    // submit-driven validation has flushed before we resolve the target.
    afterNextRender(
      () => {
        if (!this.formState()?.valid) {
          this.state.set('editing');
          this.serverError.set(null);
          formDirective.focusFirstInvalidControl();
          return;
        }

        this.callServer();
      },
      { injector: this.injector }
    );
  }

  /** (c)/(d) — the only place the server is contacted. */
  private callServer(): void {
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

    this.accountService
      .createAccount(value, errorScenario ? { errorScenario } : undefined)
      .pipe(
        catchError((error: unknown) => {
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
        this.state.set('success');
      });
  }

  /** Retry re-submits the exact same value through the same path. */
  protected retry(): void {
    this.callServer();
  }

  /** Create another: reset cleanly back to the editing state. */
  protected reset(): void {
    this.state.set('editing');
    this.serverError.set(null);
    this.createdId.set(null);
    this.vestForm()?.resetForm({});
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
