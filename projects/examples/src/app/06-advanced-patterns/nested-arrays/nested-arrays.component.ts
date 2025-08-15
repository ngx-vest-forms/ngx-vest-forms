import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-nested-arrays',
  template: `
    <section class="prose max-w-none">
      <h2>Nested Arrays (3 levels)</h2>
      <p>
        Goal: Project Management form with Organization -> Projects ->
        Milestones -> Tasks (optionally Subtasks) demonstrating deeply nested
        arrays with CRUD, validation, and performance considerations.
      </p>
      <h3>Requirements</h3>
      <ul>
        <li>CRUD at each level (add, edit, remove)</li>
        <li>Drag-and-drop reordering</li>
        <li>Cross-field and array-level validation</li>
        <li>Progress indicators and summaries</li>
        <li>Schema (Zod) + Vest validation</li>
        <li>Smart state optional external sync</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NestedArraysComponent {
  readonly note = 'Scaffold placeholder — implement next.';
}
