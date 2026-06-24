import {
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { CustomControlsModel } from '../../models/custom-controls.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { customControlsContent } from './custom-controls.content';
import { CustomControlsFormBody } from './custom-controls.form';
import { customControlsSuite } from './custom-controls.validations';

/**
 * Custom Controls demo — proves a non-native `ControlValueAccessor` control
 * is indistinguishable from a native input to ngx-vest-forms. The page keeps
 * state and outcomes while the concrete form wiring lives in
 * `custom-controls.form.html`. Public API only.
 */
@Component({
  selector: 'ngx-custom-controls-page',
  imports: [
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    Card,
    AlertPanel,
    FormStateCardComponent,
    ExampleCardsComponent,
    CustomControlsFormBody,
  ],
  templateUrl: './custom-controls.page.html',
})
export class CustomControlsPageComponent {
  protected readonly exampleContent = customControlsContent;
  protected readonly suite = customControlsSuite;

  /** The form value is the single source of truth, owned by the page. */
  protected readonly formValue = signal<CustomControlsModel>({});
  protected readonly submittedValue = signal<CustomControlsModel | null>(null);

  private readonly formBody = viewChild(CustomControlsFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected onSubmit(): void {
    if (!this.feedback()?.formState()?.valid) {
      this.submittedValue.set(null);
      this.formBody()?.focusFirstInvalidControl();
      return;
    }
    this.submittedValue.set(structuredClone(this.formValue()));
  }

  protected reset(): void {
    this.submittedValue.set(null);
    this.formBody()?.resetFormState({});
    this.formValue.set({});
  }
}
