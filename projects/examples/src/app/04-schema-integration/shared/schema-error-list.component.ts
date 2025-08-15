import { Component, input } from '@angular/core';
import type { NgxParseResult } from 'ngx-vest-forms/schemas';

@Component({
  selector: 'ngx-schema-error-list',
  template: `
    @if (failureIssues().length) {
      <div class="form-error" role="alert" aria-live="polite">
        <strong>Schema validation error:</strong>
        <ul>
          @for (issue of failureIssues(); track issue) {
            <li>
              {{ issue.path ? issue.path + ': ' : '' }}{{ issue.message }}
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class SchemaErrorListComponent<T = unknown> {
  result = input<NgxParseResult<T> | null | undefined>(null);
  protected failureIssues() {
    const r = this.result();
    if (r && !r.success) return r.issues;
    return [] as const;
  }
}
