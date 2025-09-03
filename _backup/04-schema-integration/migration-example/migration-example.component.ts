import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-migration-example',
  template: `
    <section class="prose max-w-none">
      <h2>Migration Example (v1 -> v2)</h2>
      <p>
        Goal: Demonstrate migrating a v1 form to v2 using
        ngxModelToStandardSchema and the new schemas package.
      </p>
      <ul>
        <li>Show v1-style model and validations</li>
        <li>Convert to standard schema using adapter</li>
        <li>Wire [formSchema] and [vestSuite]</li>
        <li>Keep UX identical while types improve</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MigrationExampleComponent {}
