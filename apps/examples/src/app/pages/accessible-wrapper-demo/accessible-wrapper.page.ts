import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { AccessibleWrapperModel } from '../../models/accessible-wrapper.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { accessibleWrapperContent } from './accessible-wrapper.content';
import { AccessibleWrapperFormBody } from './accessible-wrapper.form';
import { accessibleWrapperSuite } from './accessible-wrapper.validations';

@Component({
  selector: 'ngx-accessible-wrapper-page',
  imports: [
    PageTitle,
    Card,
    AlertPanel,
    ExampleCardsComponent,
    FormPageLayout,
    FormStateCardComponent,
    AccessibleWrapperFormBody,
  ],
  templateUrl: './accessible-wrapper.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibleWrapperPageComponent {
  protected readonly exampleContent = accessibleWrapperContent;
  protected readonly suite = accessibleWrapperSuite;
  protected readonly formValue = signal<AccessibleWrapperModel>({});
  protected readonly submittedValue = signal<AccessibleWrapperModel | null>(
    null
  );

  private readonly formBody = viewChild(AccessibleWrapperFormBody);

  protected readonly feedback = computed(() => this.formBody()?.feedback);

  protected clearSearchQuery(): void {
    this.formValue.update((current) => ({
      ...current,
      searchQuery: '',
    }));
    this.submittedValue.set(null);
  }

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
