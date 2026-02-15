import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-form-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside class="flex flex-col gap-8">
        <ng-content select="[layout-aside]" />
      </aside>

      <section class="space-y-6">
        <ng-content select="[layout-main]" />
      </section>
    </div>
  `,
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class FormPageLayout {}
