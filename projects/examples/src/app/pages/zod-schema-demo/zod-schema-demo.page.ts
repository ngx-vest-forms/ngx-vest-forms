import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ZodSchemaDemoModel,
  zodSchemaDemoShape,
} from '../../models/zod-schema-demo.model';
import { Card } from '../../ui/card/card.component';
import { FormPageLayout } from '../../ui/form-page-layout/form-page-layout.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { ZodSchemaDemoFormBody } from './zod-schema-demo.form';
import { zodSchemaDemoSuite } from './zod-schema-demo.validations';

@Component({
  selector: 'ngx-zod-schema-demo-page',
  imports: [
    Card,
    FormPageLayout,
    FormStateCardComponent,
    PageTitle,
    ZodSchemaDemoFormBody,
  ],
  templateUrl: './zod-schema-demo.page.html',
  styleUrls: ['./zod-schema-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZodSchemaDemoPageComponent {
  protected readonly formValue = signal<ZodSchemaDemoModel>({});

  protected readonly suite = zodSchemaDemoSuite;
  protected readonly shape = zodSchemaDemoShape;

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
