import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NativeSchemaDemoModel,
  nativeSchemaDemoContract,
} from '../../models/native-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { NativeSchemaDemoFormBody } from './native-schema-demo.form';
import { nativeSchemaDemoSuite } from './native-schema-demo.validations';

@Component({
  selector: 'ngx-native-schema-demo-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    NativeSchemaDemoFormBody,
  ],
  templateUrl: './native-schema-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NativeSchemaDemoPageComponent {
  protected readonly formValue = signal<NativeSchemaDemoModel>({});

  protected readonly suite = nativeSchemaDemoSuite;
  protected readonly contract = nativeSchemaDemoContract;

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
