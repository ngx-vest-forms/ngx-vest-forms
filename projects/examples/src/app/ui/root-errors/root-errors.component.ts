import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ngx-root-errors',
  template: `
    @if (errors()?.length) {
      <div class="root-errors" role="alert" aria-live="polite">
        <ul>
          @for (err of errors(); track err) {
            <li>{{ err }}</li>
          }
        </ul>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class RootErrorsComponent {
  errors = input<string[] | null>(null);
}
