import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-basic-smart-state',
  template: `
    <section class="prose max-w-none">
      <h2>Basic Smart State</h2>
      <p>Goal: Minimal example of ngx-vest-forms smart state extension.</p>
      <ul>
        <li>Bind ngxVestFormsSmartState to a form</li>
        <li>Provide externalSource signal</li>
        <li>Demonstrate merging strategy (prefer-form vs prefer-external)</li>
        <li>No schema yet, focus on mechanics</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicSmartStateComponent {
  readonly note = 'Scaffold placeholder — implement next.';
}
