import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-dynamic-forms',
  template: `
    <section class="prose max-w-none">
      <h2>Dynamic Forms</h2>
      <p>Goal: Demonstrate runtime field generation and schema adaptation.</p>
      <ul>
        <li>Add/remove fields dynamically</li>
        <li>Dynamic validation rules</li>
        <li>Maintain form state across changes</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormsComponent {
  readonly note = 'Scaffold placeholder — implement next.';
}
