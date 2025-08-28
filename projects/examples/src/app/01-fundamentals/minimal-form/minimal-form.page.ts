import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { CardComponent } from '../../ui/card/card.component';
import { FormStateDisplayComponent } from '../../ui/form-state-display/public-api';
import { MinimalForm } from './minimal.form';

@Component({
  selector: 'ngx-minimal-form-page',
  imports: [MinimalForm, CardComponent, FormStateDisplayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page wrapper with Tailwind for layout -->
    <div class="mx-auto max-w-md">
      <!-- Clean form in ngx-card replicating rounded white shadow container -->
      <ngx-card variant="primary-outline">
        <ngx-minimal-form #formComponent />
      </ngx-card>

      <!-- State display for learning -->
      <ngx-form-state-display
        [title]="'Form State'"
        [formState]="formComponent?.formState()"
      />
    </div>
  `,
})
export class MinimalFormPage {
  protected readonly formComponent =
    viewChild.required<MinimalForm>('formComponent');
}
