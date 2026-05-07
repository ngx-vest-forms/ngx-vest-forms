import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class AutoSaveDemoService {
  static readonly STORAGE_KEY = 'ngx-vest-forms:auto-save-demo:draft';

  #version = 0;

  loadDraft(): StoredAutoSaveDraft | null {
    const storage = this.#storage;
    if (!storage) {
      return null;
    }

    const rawDraft = storage.getItem(AutoSaveDemoService.STORAGE_KEY);
    if (!rawDraft) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawDraft) as StoredAutoSaveDraft;
      this.#version = Math.max(this.#version, parsed.version ?? 0);
      return parsed;
    } catch {
      storage.removeItem(AutoSaveDemoService.STORAGE_KEY);
      return null;
    }
  }

  clearDraft(): void {
    this.#storage?.removeItem(AutoSaveDemoService.STORAGE_KEY);
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

    this.#storage?.setItem(
      AutoSaveDemoService.STORAGE_KEY,
      JSON.stringify(result)
    );

    return of(result).pipe(delay(700));
  }

  get storageKey(): string {
    return AutoSaveDemoService.STORAGE_KEY;
  }

  get #storage(): Storage | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage;
  }
}
