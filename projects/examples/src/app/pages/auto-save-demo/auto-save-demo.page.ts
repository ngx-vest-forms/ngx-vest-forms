import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  createValidationConfig,
  NgxFieldBlurEvent,
} from 'ngx-vest-forms';
import { EMPTY, Subject, catchError, concatMap, defer, tap } from 'rxjs';
import {
  AutoSaveDemoModel,
  initialAutoSaveDemoValue,
} from '../../models/auto-save-demo.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { AutoSaveDemoFormBody } from './auto-save-demo.form';
import {
  autoSaveDemoValidationErrorRulesByField,
  autoSaveDemoValidationWarningRulesByField,
  autoSaveDemoSuite,
} from './auto-save-demo.validations';
import {
  AutoSaveDemoService,
  AutoSaveDraftResult,
  StoredAutoSaveDraft,
} from './auto-save-demo.service';

type AlertTone = 'error' | 'info' | 'success' | 'warning';

type AutoSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving'; field: string }
  | { kind: 'saved'; field: string; savedAtLabel: string; version: number }
  | { kind: 'error'; field: string; message: string };

type AutoSaveRequest = {
  field: string;
  key: string;
  draft: AutoSaveDemoModel;
};

@Component({
  selector: 'ngx-auto-save-demo-page',
  imports: [
    AlertPanel,
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    AutoSaveDemoFormBody,
  ],
  templateUrl: './auto-save-demo.page.html',
  styleUrls: ['./auto-save-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoSaveDemoPageComponent {
  private readonly autoSaveService = inject(AutoSaveDemoService);
  private readonly formBody = viewChild(AutoSaveDemoFormBody);
  private readonly autoSaveRequests = new Subject<AutoSaveRequest>();
  private readonly restoredDraft = this.autoSaveService.loadDraft();

  protected readonly formValue = signal<AutoSaveDemoModel>(
    this.restoredDraft?.draft ?? initialAutoSaveDemoValue
  );
  protected readonly suite = autoSaveDemoSuite;
  protected readonly validationConfig =
    createValidationConfig<AutoSaveDemoModel>()
      .bidirectional('quantity', 'quantityJustification')
      .whenChanged('preferredContactMethod', 'email')
      .build();

  protected readonly saveStatus = signal<AutoSaveStatus>({ kind: 'idle' });
  private readonly lastSavedDraftKey = signal(
    this.#createDraftKey(this.restoredDraft?.draft ?? initialAutoSaveDemoValue)
  );
  private readonly lastQueuedDraftKey = signal<string | null>(null);
  protected readonly storageKey = this.autoSaveService.storageKey;
  protected readonly restoredFromSession = signal(!!this.restoredDraft);

  protected readonly validationErrorRules = autoSaveDemoValidationErrorRulesByField;
  protected readonly validationWarningRules =
    autoSaveDemoValidationWarningRulesByField;

  protected readonly hasUnsavedChanges = computed(
    () =>
      this.#createDraftKey(this.formValue()) !== this.lastSavedDraftKey()
  );

  protected readonly saveTone = computed<AlertTone>(() => {
    switch (this.saveStatus().kind) {
      case 'saving':
        return 'info';
      case 'saved':
        return 'success';
      case 'error':
        return 'error';
      case 'idle':
      default:
        return 'warning';
    }
  });

  protected readonly saveTitle = computed(() => {
    switch (this.saveStatus().kind) {
      case 'saving':
        return 'Saving draft';
      case 'saved':
        return 'Draft saved';
      case 'error':
        return 'Draft save failed';
      case 'idle':
      default:
        return 'Auto-save ready';
    }
  });

  protected readonly saveMessages = computed(() => {
    const status = this.saveStatus();

    switch (status.kind) {
      case 'saving':
        return [
          `Saving the latest draft after blurring “${this.#humanizeField(status.field)}”.`,
          'Validation keeps running independently, so draft persistence does not pretend to be final submission.',
        ];
      case 'saved':
        return [
          `Saved after blurring “${this.#humanizeField(status.field)}”.`,
          `Draft version ${status.version} persisted at ${status.savedAtLabel}.`,
        ];
      case 'error':
        return [
          status.message,
          `Blur “${this.#humanizeField(status.field)}” again after fixing the draft to retry.`,
        ];
      case 'idle':
      default:
        return [
          'Blur any changed field to save a draft.',
          'Untouched dependent fields can still stay visually quiet until their own blur.',
        ];
    }
  });

  protected readonly formInfo = computed(() => {
    const messages = [
      this.hasUnsavedChanges()
        ? 'Current form state has changes that have not been saved as a draft yet.'
        : 'Current form state matches the latest saved draft.',
      `Drafts are temporarily stored in sessionStorage under ${this.storageKey}.`,
    ];

    const status = this.saveStatus();
    if (status.kind === 'saved') {
      messages.push(
        `Latest blur-save: ${this.#humanizeField(status.field)} at ${status.savedAtLabel}.`
      );
    }

    if (status.kind === 'error') {
      messages.push('The last save attempt failed, but validation state is still intact.');
    }

    if (this.restoredFromSession()) {
      messages.push('A previous draft was restored from sessionStorage for this browser tab.');
    }

    return messages;
  });

  constructor() {
    this.#applyRestoredDraftStatus(this.restoredDraft);

    this.autoSaveRequests
      .pipe(
        concatMap((request) =>
          defer(() => {
            this.saveStatus.set({ kind: 'saving', field: request.field });
            return this.autoSaveService.saveDraft(
              request.draft,
              request.field
            ).pipe(
              tap((result) => this.#handleSaveSuccess(request, result)),
              catchError((error: unknown) => {
                this.#handleSaveError(request, error);
                return EMPTY;
              })
            );
          })
        ),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  protected handleFieldBlur(
    event: NgxFieldBlurEvent<AutoSaveDemoModel>
  ): void {
    if (!event.formValue || !event.dirty || event.pending) {
      return;
    }

    const draft = structuredClone(event.formValue);
    const key = this.#createDraftKey(draft);
    if (key === this.lastSavedDraftKey() || key === this.lastQueuedDraftKey()) {
      return;
    }

    this.lastQueuedDraftKey.set(key);
    this.autoSaveRequests.next({
      field: event.field,
      key,
      draft,
    });
  }

  protected save(): void {
    if (!this.formBody()?.formState().valid) {
      return;
    }

    this.saveStatus.set({
      kind: 'saved',
      field: 'form submit',
      savedAtLabel: this.#formatTimestamp(new Date().toISOString()),
      version: 0,
    });
  }

  protected reset(): void {
    this.formBody()?.resetFormState(initialAutoSaveDemoValue);
    this.formValue.set(initialAutoSaveDemoValue);
    this.autoSaveService.clearDraft();
    this.lastSavedDraftKey.set(this.#createDraftKey(initialAutoSaveDemoValue));
    this.lastQueuedDraftKey.set(this.#createDraftKey(initialAutoSaveDemoValue));
    this.restoredFromSession.set(false);
    this.saveStatus.set({ kind: 'idle' });
  }

  #handleSaveSuccess(
    request: AutoSaveRequest,
    result: AutoSaveDraftResult
  ): void {
    this.lastSavedDraftKey.set(request.key);
    this.saveStatus.set({
      kind: 'saved',
      field: result.field,
      savedAtLabel: this.#formatTimestamp(result.savedAt),
      version: result.version,
    });
  }

  #handleSaveError(request: AutoSaveRequest, error: unknown): void {
    if (this.lastQueuedDraftKey() === request.key) {
      this.lastQueuedDraftKey.set(null);
    }

    this.saveStatus.set({
      kind: 'error',
      field: request.field,
      message: this.#toErrorMessage(error),
    });
  }

  #createDraftKey(value: AutoSaveDemoModel): string {
    return JSON.stringify(value);
  }

  #applyRestoredDraftStatus(draft: StoredAutoSaveDraft | null): void {
    if (!draft) {
      return;
    }

    this.saveStatus.set({
      kind: 'saved',
      field: draft.field,
      savedAtLabel: this.#formatTimestamp(draft.savedAt),
      version: draft.version,
    });
    this.lastQueuedDraftKey.set(this.#createDraftKey(draft.draft));
  }

  #formatTimestamp(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  }

  #humanizeField(field: string): string {
    const normalized = field.replace(/([a-z])([A-Z])/g, '$1 $2');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  #toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Something went wrong while saving the draft.';
  }
}
