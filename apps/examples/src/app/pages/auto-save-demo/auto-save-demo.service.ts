import { Service } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { AutoSaveDemoModel } from '../../models/auto-save-demo.model';

export type AutoSaveDraftResult = {
  field: string;
  savedAt: string;
  version: number;
};

export type StoredAutoSaveDraft = AutoSaveDraftResult & {
  draft: AutoSaveDemoModel;
};

@Service()
export class AutoSaveDemoService {
  static readonly STORAGE_KEY = 'ngx-vest-forms:auto-save-demo:draft';

  #version = 0;

  loadDraft(): StoredAutoSaveDraft | null {
    const rawDraft = readStorage(AutoSaveDemoService.STORAGE_KEY);
    if (!rawDraft) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawDraft) as StoredAutoSaveDraft;
      this.#version = Math.max(this.#version, parsed.version ?? 0);
      return parsed;
    } catch {
      writeStorage(AutoSaveDemoService.STORAGE_KEY, null);
      return null;
    }
  }

  clearDraft(): void {
    writeStorage(AutoSaveDemoService.STORAGE_KEY, null);
  }

  saveDraft(
    draft: AutoSaveDemoModel,
    field: string
  ): Observable<AutoSaveDraftResult> {
    const projectName = draft.projectName?.trim().toLowerCase();
    if (projectName === 'fail') {
      return throwError(
        () =>
          new Error(
            'Simulated save failure. Change the project name to retry the next blur save.'
          )
      ).pipe(delay(700));
    }

    this.#version += 1;

    const result: StoredAutoSaveDraft = {
      draft,
      field,
      savedAt: new Date().toISOString(),
      version: this.#version,
    };

    writeStorage(AutoSaveDemoService.STORAGE_KEY, JSON.stringify(result));

    return of(result).pipe(delay(700));
  }

  get storageKey(): string {
    return AutoSaveDemoService.STORAGE_KEY;
  }
}

function readStorage(key: string): string | null {
  try {
    return globalThis.sessionStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      globalThis.sessionStorage?.removeItem(key);
    } else {
      globalThis.sessionStorage?.setItem(key, value);
    }
  } catch {
    // Storage can be blocked (privacy settings); the demo keeps working without drafts.
  }
}
