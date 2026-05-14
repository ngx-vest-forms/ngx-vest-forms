import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { DisplayModesDemoFormBody } from './display-modes-demo.form';
import { displayModesDemoSuite } from './display-modes-demo.validations';

@Component({
  selector: 'ngx-display-modes-demo-page',
  imports: [
    Card,
    FormPageLayout,
    PageTitle,
    FormStateCardComponent,
    DisplayModesDemoFormBody,
  ],
  templateUrl: './display-modes-demo.page.html',
  styleUrls: ['./display-modes-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayModesDemoPageComponent {
  protected readonly formValue = signal<DisplayModesDemoModel>({});

  protected readonly suite = displayModesDemoSuite;

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
