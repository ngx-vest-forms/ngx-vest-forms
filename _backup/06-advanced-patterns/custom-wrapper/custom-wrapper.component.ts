import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-custom-wrapper-example',
  template: `
    <section class="prose max-w-none">
      <h2>Custom Error Wrapper</h2>
      <p>
        Goal: Build a custom control wrapper using NgxFormErrorDisplayDirective
        to integrate with a custom design system.
      </p>
      <ul>
        <li>Wrap input and project validation UI</li>
        <li>ARIA compliant error rendering</li>
        <li>Animations on error appearance</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomWrapperComponent {
  readonly note = 'Scaffold placeholder — implement next.';
}
