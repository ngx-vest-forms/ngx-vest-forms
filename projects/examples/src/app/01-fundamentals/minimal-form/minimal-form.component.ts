import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-minimal-form',
  template: `
    <section class="prose max-w-none">
      <h2>Minimal Form (no control wrapper)</h2>
      <p>Goal: Showcase the absolute minimum setup of ngx-vest-forms.</p>
      <ul>
        <li>Form element with ngxVestForm directive</li>
        <li>Model bound via [(formValue)] signal</li>
        <li>Single input using [ngModel] (unidirectional)</li>
        <li>Vest suite wired (basic required rule)</li>
        <li>Manual inline error rendering; no ngx-control-wrapper</li>
      </ul>
      <p class="text-sm text-gray-500">
        This is a scaffold. Implement the form and tests in a follow-up step.
      </p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimalFormComponent {
  readonly scaffoldNote = 'Scaffold placeholder - implement next.';
}
