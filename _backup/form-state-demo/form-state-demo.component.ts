import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CardComponent } from '../../projects/examples/src/app/ui/card/card.component';
import { DevelopmentPanelComponent } from '../../projects/examples/src/app/ui/dev-panel/dev-panel.component';
import { OverviewSectionComponent } from '../../ui/overview/overview-section.component';
import { FormStateDemoFormComponent } from './form-state-demo-form.component';

/**
 * Form State API Demonstration - Foundation Level
 *
 * This example provides a comprehensive demonstration of the ngx-vest-forms state API.
 * It showcases all available state properties and their behavior patterns.
 *
 * 🎯 Learning Objectives:
 * - Understanding all form state properties (valid, pending, errors, warnings)
 * - Visual feedback for different validation states
 * - Real-time state monitoring and debugging
 * - State-driven UI conditional rendering
 * - Performance implications of state access patterns
 *
 * 🚀 Features Demonstrated:
 * - Complete formState API coverage
 * - Visual state indicators
 * - State transition examples
 * - Debugging techniques
 * - Performance monitoring
 *
 * 📚 Educational Value:
 * Essential for understanding how ngx-vest-forms manages and exposes validation state.
 * This knowledge is crucial for building responsive, user-friendly forms.
 */

@Component({
  selector: 'ngx-form-state-demo',
  imports: [
    FormStateDemoFormComponent,
    DevelopmentPanelComponent,
    CardComponent,
    OverviewSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="example-layout" aria-labelledby="formStateDemoHeading">
      <!-- Header Section -->
      <header class="mb-8 text-center">
        <h1 id="formStateDemoHeading" class="nv-page-title">
          Form State API Demo
        </h1>
        <p class="example-tagline">
          Comprehensive demonstration of the ngx-vest-forms state API: valid,
          pending, errors, warnings, and debugging techniques.
        </p>
      </header>

      <ngx-overview-section
        title="🎯 What You'll Learn"
        tagline="Master the complete form state API with visual feedback and real-time monitoring."
      >
        <ngx-card variant="flat">
          <div card-header>Form State Properties</div>
          <ul class="feature-list">
            <li><code>formState().valid</code> - Boolean validation status</li>
            <li><code>formState().pending</code> - Async validation state</li>
            <li><code>formState().errors</code> - Field error messages</li>
            <li><code>formState().warnings</code> - Field warning messages</li>
            <li><code>formState().fieldResults</code> - Detailed field data</li>
          </ul>
        </ngx-card>
        <ngx-card variant="flat">
          <div card-header>Visual State Feedback</div>
          <ul class="feature-list">
            <li>Real-time validation indicators</li>
            <li>Error and warning styling</li>
            <li>Pending state animations</li>
            <li>Success confirmation patterns</li>
            <li>Accessibility-compliant feedback</li>
          </ul>
        </ngx-card>
      </ngx-overview-section>

      <!-- Form demonstration -->
      <ngx-form-state-demo-form (formStateChange)="formState.set($event)" />

      <!-- Developer panel showing comprehensive state -->
      <section class="mt-8" aria-labelledby="devPanelHeading">
        <h2 id="devPanelHeading" class="section-title sr-only">
          Complete Form State
        </h2>
        <ngx-dev-panel
          [state]="formState()"
          [defaultOpen]="true"
          title="Complete Form State API"
        ></ngx-dev-panel>
      </section>
    </main>
  `,
})
export class FormStateDemoComponent {
  protected readonly formState = signal<unknown | null>(null);
}
